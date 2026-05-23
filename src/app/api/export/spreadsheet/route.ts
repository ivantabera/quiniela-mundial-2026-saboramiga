import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const [configRes, profilesRes, matchesRes, picksRes] = await Promise.all([
    admin.from('quiniela_config').select('close_date, is_manually_open, pool_amount, currency').single(),
    admin.from('profiles').select('id, username, full_name').eq('is_active', true).order('username'),
    admin.from('matches').select(`
      id, match_number, stage, group_name, match_date,
      home_team:home_team_id(name, short_name, flag_emoji),
      away_team:away_team_id(name, short_name, flag_emoji)
    `).order('match_date', { ascending: true }),
    admin.from('picks').select('user_id, match_id, predicted_result, updated_at'),
  ])

  const config   = configRes.data
  const profiles = profilesRes.data ?? []
  const matches  = matchesRes.data ?? []
  const picks    = picksRes.data ?? []

  const now      = new Date()
  const closeDate = config ? new Date(config.close_date) : null
  const isClosed  = closeDate ? (!config!.is_manually_open && now >= closeDate) : false

  const poolAmount   = config?.pool_amount ?? 0
  const poolCurrency = config?.currency ?? 'MXN'
  const statusText   = isClosed ? 'VERSION FINAL' : 'BORRADOR — Esta NO es la version final'

  return NextResponse.json({
    profiles,
    matches,
    picks,
    isClosed,
    poolAmount,
    poolCurrency,
    statusText,
  })
}
