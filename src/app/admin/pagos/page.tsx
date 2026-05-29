import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import PagosAdminClient from '@/components/admin/PagosAdminClient'

export const dynamic = 'force-dynamic'

export default async function PagosAdminPage() {
  // Guard de admin
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminSupabaseClient()
  const { data: adminProfile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/dashboard')

  const [profilesRes, configRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, username, full_name, inscription_paid, payment_status, payment_submitted_at, payment_confirmed_at, created_at')
      .order('payment_submitted_at', { ascending: false, nullsFirst: false }),
    admin
      .from('quiniela_config')
      .select('pool_amount, currency, inscription_amount')
      .single(),
  ])

  if (profilesRes.error) {
    console.error('[PagosAdmin] Error fetching profiles:', profilesRes.error.message)
  }

  console.log('[PagosAdmin] profiles count:', profilesRes.data?.length)
  console.log('[PagosAdmin] payment_status values:', profilesRes.data?.map(p => `${p.username}:${JSON.stringify(p.payment_status)}`))

  const profiles = profilesRes.data ?? []
  const config   = configRes.data

  return (
    <div className="min-h-screen">
      <header className="border-b border-pitch-800 bg-pitch-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
          <span className="font-display text-xl text-brand-400 tracking-widest">⚙️ PANEL ADMIN</span>
          <Link href="/admin" className="text-sm text-pitch-400 hover:text-white transition-colors">
            ← Volver al admin
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">💰 Gestión de Pagos</h1>
          <p className="text-pitch-400">Confirma o rechaza los comprobantes recibidos por WhatsApp</p>
        </div>

        <PagosAdminClient profiles={profiles} config={config} />
      </div>
    </div>
  )
}
