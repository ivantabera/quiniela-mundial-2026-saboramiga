import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

const INSCRIPTION_FEE = 100

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminSupabase = createAdminSupabaseClient()
  const { data: adminProfile } = await adminSupabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { inscription_paid } = await req.json()

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ inscription_paid, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Sumar o restar $100 a la bolsa acumulada
  const { data: config } = await adminSupabase
    .from('quiniela_config')
    .select('id, pool_amount')
    .single()

  let newPoolAmount = 0
  if (config) {
    newPoolAmount = Math.max(0, config.pool_amount + (inscription_paid ? INSCRIPTION_FEE : -INSCRIPTION_FEE))
    await adminSupabase
      .from('quiniela_config')
      .update({ pool_amount: newPoolAmount, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', config.id)
  }

  await adminSupabase.from('change_logs').insert({
    user_id:    user.id,
    action:     inscription_paid ? 'payment_confirmed' : 'payment_reverted',
    table_name: 'profiles',
    record_id:  params.id,
    new_data:   { inscription_paid, pool_amount: newPoolAmount } as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  })

  return NextResponse.json({ ok: true, pool_amount: newPoolAmount })
}
