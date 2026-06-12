import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminSupabase = createAdminSupabaseClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Obtener todos los partidos finalizados
  const { data: finishedMatches, error: matchError } = await adminSupabase
    .from('matches')
    .select('id')
    .eq('is_finished', true)

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  let totalPicks = 0
  let errors: string[] = []

  // Recalcular puntos de cada pick de cada partido finalizado
  for (const match of finishedMatches ?? []) {
    const { data: picks, error: pickError } = await adminSupabase
      .from('picks')
      .select('id')
      .eq('match_id', match.id)

    if (pickError) { errors.push(`match ${match.id}: ${pickError.message}`); continue }

    for (const pick of picks ?? []) {
      const { error: calcError } = await adminSupabase
        .rpc('calculate_pick_points', { p_pick_id: pick.id })
      if (calcError) errors.push(`pick ${pick.id}: ${calcError.message}`)
      else totalPicks++
    }
  }

  // Refrescar standings
  const { error: standingsError } = await adminSupabase.rpc('refresh_standings')
  if (standingsError) errors.push(`refresh_standings: ${standingsError.message}`)

  // Contar standings resultantes
  const { count } = await adminSupabase
    .from('standings')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    ok: errors.length === 0,
    matchesProcessed: finishedMatches?.length ?? 0,
    picksRecalculated: totalPicks,
    standingsRows: count ?? 0,
    errors,
  })
}
