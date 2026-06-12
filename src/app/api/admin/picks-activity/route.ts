import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [profilesRes, picksRes, matchesRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, username, full_name')
      .eq('inscription_paid', true)
      .eq('is_active', true)
      .order('username'),
    admin
      .from('picks')
      .select('user_id, updated_at'),
    admin
      .from('matches')
      .select('id', { count: 'exact', head: true }),
  ])

  const totalMatches = matchesRes.count ?? 0

  // Agrupar picks por usuario: contar y obtener la fecha más reciente
  const pickMap = new Map<string, { count: number; lastModified: string }>()
  for (const pick of picksRes.data ?? []) {
    const existing = pickMap.get(pick.user_id)
    if (!existing) {
      pickMap.set(pick.user_id, { count: 1, lastModified: pick.updated_at })
    } else {
      existing.count++
      if (pick.updated_at > existing.lastModified) existing.lastModified = pick.updated_at
    }
  }

  const data = (profilesRes.data ?? []).map(p => ({
    id:           p.id,
    username:     p.username,
    full_name:    p.full_name,
    pickCount:    pickMap.get(p.id)?.count ?? 0,
    lastModified: pickMap.get(p.id)?.lastModified ?? null,
    totalMatches,
  }))

  // Ordenar: sin picks al final, luego por última modificación descendente
  data.sort((a, b) => {
    if (a.pickCount === 0 && b.pickCount > 0) return 1
    if (b.pickCount === 0 && a.pickCount > 0) return -1
    if (!a.lastModified) return 1
    if (!b.lastModified) return -1
    return b.lastModified.localeCompare(a.lastModified)
  })

  return NextResponse.json({ data, totalMatches })
}
