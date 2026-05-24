import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  if (profile.payment_status === 'confirmado') {
    return NextResponse.json({ error: 'El pago ya está confirmado' }, { status: 409 })
  }
  if (profile.payment_status === 'pendiente_verificacion') {
    return NextResponse.json({ error: 'Ya enviaste tu comprobante, espera la confirmación' }, { status: 409 })
  }

  const { error } = await admin
    .from('profiles')
    .update({
      payment_status: 'pendiente_verificacion',
      payment_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('change_logs').insert({
    user_id:    user.id,
    action:     'payment_submitted',
    table_name: 'profiles',
    record_id:  user.id,
    new_data:   { payment_status: 'pendiente_verificacion' },
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ ok: true })
}
