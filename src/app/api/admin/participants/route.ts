import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminSupabase = createAdminSupabaseClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [profilesRes, configRes] = await Promise.all([
    adminSupabase
      .from('profiles')
      .select('id, username, full_name, inscription_paid, is_active, created_at')
      .order('created_at', { ascending: true }),
    adminSupabase
      .from('quiniela_config')
      .select('pool_amount, currency')
      .single(),
  ])

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })

  return NextResponse.json({
    data:        profilesRes.data,
    pool_amount: configRes.data?.pool_amount ?? 0,
    currency:    configRes.data?.currency ?? 'MXN',
  })
}
