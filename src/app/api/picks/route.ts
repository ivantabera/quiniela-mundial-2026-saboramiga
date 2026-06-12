import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { isMatchOpen } from '@/lib/utils/quiniela-status'
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

  const adminSupabase = createAdminSupabaseClient()

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = PickSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { match_id, predicted_home, predicted_away } = parsed.data

  // Verificar partido y validar deadline por partido (20 min antes del kickoff)
  const [matchRes, configRes] = await Promise.all([
    supabase.from('matches').select('id, is_finished, match_date').eq('id', match_id).single(),
    adminSupabase.from('quiniela_config').select('close_date, is_manually_open').single(),
  ])

  const match = matchRes.data
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  if (match.is_finished) return NextResponse.json({ error: 'El partido ya terminó' }, { status: 409 })

  if (!isMatchOpen(match.match_date, configRes.data)) {
    await adminSupabase.from('change_logs').insert({
      user_id:    user.id,
      action:     'pick_blocked_closed',
      table_name: 'picks',
      record_id:  match_id,
      ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
    })
    return NextResponse.json(
      { error: 'Este partido ya está cerrado para picks', code: 'MATCH_LOCKED' },
      { status: 423 }
    )
  }

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
