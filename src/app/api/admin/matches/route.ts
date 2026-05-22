import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminSupabase = createAdminSupabaseClient()
  const { data, error } = await adminSupabase
    .from('matches')
    .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
    .order('match_date', { ascending: true })

  if (error) {
    console.error('[API /admin/matches]', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }
  return NextResponse.json({ data })
}
