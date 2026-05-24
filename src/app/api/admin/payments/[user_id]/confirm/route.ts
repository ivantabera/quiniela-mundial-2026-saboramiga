import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

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

  const { data, error } = await admin
    .from('profiles')
    .update({
      payment_status:       'confirmado',
      payment_confirmed_by: user.id,
    })
    .eq('id', user_id)
    .select('id, payment_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await admin.from('change_logs').insert({
    user_id:    user.id,
    action:     'payment_confirmed',
    table_name: 'profiles',
    record_id:  user_id,
    new_data:   { payment_status: 'confirmado', confirmed_by: user.id },
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ ok: true })
}
