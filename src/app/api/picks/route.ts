import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PickSchema = z.object({
  match_id:       z.string().uuid(),
  predicted_home: z.number().int().min(0).max(20),
  predicted_away: z.number().int().min(0).max(20),
})

// GET /api/picks — obtener picks del usuario autenticado
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('picks')
    .select('*, match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/picks — crear o actualizar pick (bloqueado por middleware si quiniela cerrada)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Validación doble en backend — independiente del middleware
  const adminSupabase = createAdminSupabaseClient()
  const { data: config } = await adminSupabase
    .from('quiniela_config')
    .select('close_date, is_manually_open')
    .single()

  if (config) {
    const now       = new Date()
    const closeDate = new Date(config.close_date)
    const isOpen    = config.is_manually_open || now < closeDate

    if (!isOpen) {
      // Registrar intento de modificación ilegal
      await adminSupabase.from('change_logs').insert({
        user_id:    user.id,
        action:     'pick_blocked_closed',
        table_name: 'picks',
        old_data:   null,
        new_data:   await req.json().catch(() => null),
        ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
      })
      return NextResponse.json(
        { error: 'La quiniela está cerrada', code: 'QUINIELA_CLOSED' },
        { status: 423 }
      )
    }
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = PickSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { match_id, predicted_home, predicted_away } = parsed.data

  // Verificar que el partido existe y no ha terminado
  const { data: match } = await supabase
    .from('matches')
    .select('id, is_finished')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  if (match.is_finished) return NextResponse.json({ error: 'El partido ya terminó' }, { status: 409 })

  // Upsert pick
  const { data, error } = await supabase
    .from('picks')
    .upsert({
      user_id: user.id,
      match_id,
      predicted_home,
      predicted_away,
    }, { onConflict: 'user_id,match_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log de cambio exitoso
  await adminSupabase.from('change_logs').insert({
    user_id:    user.id,
    action:     'pick_saved',
    table_name: 'picks',
    record_id:  data.id,
    new_data:   data as unknown as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ data })
}
