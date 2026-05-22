import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createAdminSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const adminSupabase = await createAdminSupabaseClient()

  const { data, error } = await adminSupabase
    .from('quiniela_config')
    .update({ ...body, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log del cambio
  await adminSupabase.from('change_logs').insert({
    user_id: user.id, action: 'admin_config_change',
    table_name: 'quiniela_config', record_id: data.id,
    new_data: body as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ data })
}
