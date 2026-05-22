import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminSupabase = createAdminSupabaseClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { result, is_finished } = await req.json()

  if (!['home', 'draw', 'away'].includes(result)) {
    return NextResponse.json({ error: 'Resultado inválido' }, { status: 400 })
  }

  // Obtener ganador
  let winner_id: string | null = null
  if (result !== 'draw') {
    const { data: match } = await adminSupabase
      .from('matches').select('home_team_id, away_team_id').eq('id', params.id).single()
    winner_id = result === 'home' ? match?.home_team_id ?? null : match?.away_team_id ?? null
  }

  const { data, error } = await adminSupabase
    .from('matches')
    .update({ result, winner_id, is_finished, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calcular puntos de todos los picks de este partido
  const { data: picks } = await adminSupabase
    .from('picks').select('id').eq('match_id', params.id)

  if (picks) {
    for (const pick of picks) {
      await adminSupabase.rpc('calculate_pick_points', { p_pick_id: pick.id })
    }
    // Refrescar standings
    await adminSupabase.rpc('refresh_standings')
  }

  return NextResponse.json({ data })
}
