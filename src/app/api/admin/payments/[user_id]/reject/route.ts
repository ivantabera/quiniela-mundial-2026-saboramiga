import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/')
  const user_id = segments[segments.length - 2]

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { data: adminProfile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // inscription_paid se incluye explícitamente para que el trigger
  // profiles_update_pool_amount (AFTER UPDATE OF inscription_paid) se dispare
  const { data, error } = await admin
    .from('profiles')
    .update({ payment_status: 'rechazado', inscription_paid: false })
    .eq('id', user_id)
    .select('id, payment_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await admin.from('change_logs').insert({
    user_id:    user.id,
    action:     'payment_rejected',
    table_name: 'profiles',
    record_id:  user_id,
    new_data:   { payment_status: 'rechazado', rejected_by: user.id },
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ ok: true })
}
