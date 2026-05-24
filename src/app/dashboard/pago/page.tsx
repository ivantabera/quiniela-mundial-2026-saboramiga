import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import DepositSlip from '@/components/payment/DepositSlip'
import PaymentActions from '@/components/payment/PaymentActions'

export const dynamic = 'force-dynamic'

export default async function PagoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminSupabaseClient()

  const [profileRes, configRes] = await Promise.all([
    admin
      .from('profiles')
      .select('username, full_name, payment_status')
      .eq('id', user.id)
      .single(),
    admin
      .from('quiniela_config')
      .select('inscription_amount, currency, payment_beneficiary, payment_bank, payment_clabe, payment_whatsapp')
      .single(),
  ])

  const profile = profileRes.data
  const config  = configRes.data

  if (!profile || !config) redirect('/dashboard')

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">Pago de Inscripción</h1>
        <p className="text-pitch-400 mt-1">Asegura tu lugar en la competencia oficial</p>
      </div>

      <DepositSlip
        beneficiary={config.payment_beneficiary}
        bank={config.payment_bank}
        clabe={config.payment_clabe}
        amount={config.inscription_amount}
        currency={config.currency}
        whatsapp={config.payment_whatsapp}
        username={profile.username}
      />

      <PaymentActions
        paymentStatus={profile.payment_status}
        whatsapp={config.payment_whatsapp}
        amount={config.inscription_amount}
        username={profile.username}
        fullName={profile.full_name ?? profile.username}
        currency={config.currency}
      />
    </div>
  )
}
