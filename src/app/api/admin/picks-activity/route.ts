import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [profilesRes, matchesRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, username, full_name')
      .eq('inscription_paid', true)
      .eq('is_active', true)
      .order('username'),
    admin
      .from('matches')
      .select('id, match_number, group_name, home_team:home_team_id(short_name, flag_emoji), away_team:away_team_id(short_name, flag_emoji)')
      .order('match_number', { ascending: true }),
  ])

  // Paginar picks de a 1000 (límite del servidor Supabase)
  const allPicks: { user_id: string; match_id: string; updated_at: string }[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('picks')
      .select('user_id, match_id, updated_at')
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    allPicks.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const allMatches  = matchesRes.data ?? []
  const totalMatches = allMatches.length
  const allMatchIds  = new Set(allMatches.map(m => m.id))

  // Por usuario: set de match_ids con pick y fecha más reciente
  const pickMap = new Map<string, { matchIds: Set<string>; lastModified: string }>()
  for (const pick of allPicks) {
    const existing = pickMap.get(pick.user_id)
    if (!existing) {
      pickMap.set(pick.user_id, { matchIds: new Set([pick.match_id]), lastModified: pick.updated_at })
    } else {
      existing.matchIds.add(pick.match_id)
      if (pick.updated_at > existing.lastModified) existing.lastModified = pick.updated_at
    }
  }

  const data = (profilesRes.data ?? []).map(p => {
    const userPicks    = pickMap.get(p.id)
    const pickedIds    = userPicks?.matchIds ?? new Set<string>()
    const missingIds   = Array.from(allMatchIds).filter(id => !pickedIds.has(id))
    const missingMatches = missingIds
      .map(id => allMatches.find(m => m.id === id))
      .filter(Boolean)

    return {
      id:             p.id,
      username:       p.username,
      full_name:      p.full_name,
      pickCount:      pickedIds.size,
      lastModified:   userPicks?.lastModified ?? null,
      totalMatches,
      missingMatches,
    }
  })

  data.sort((a, b) => {
    if (a.pickCount === 0 && b.pickCount > 0) return 1
    if (b.pickCount === 0 && a.pickCount > 0) return -1
    if (!a.lastModified) return 1
    if (!b.lastModified) return -1
    return b.lastModified.localeCompare(a.lastModified)
  })

  return NextResponse.json({ data, totalMatches })
}
