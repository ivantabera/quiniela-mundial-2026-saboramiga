import Link from 'next/link'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import PagosAdminClient from '@/components/admin/PagosAdminClient'

export const dynamic = 'force-dynamic'

export default async function PagosAdminPage() {
  const admin = createAdminSupabaseClient()

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

  const profiles = profilesRes.data ?? []
  const config   = configRes.data

  const counts = {
    total:      profiles.length,
    confirmado: profiles.filter(p => p.payment_status === 'confirmado').length,
    pendiente:  profiles.filter(p => p.payment_status === 'pendiente_verificacion').length,
    sin_iniciar: profiles.filter(p => p.payment_status === 'sin_iniciar').length,
    rechazado:  profiles.filter(p => p.payment_status === 'rechazado').length,
  }

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

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-green-400">{counts.confirmado}</div>
          <div className="text-pitch-400 text-sm mt-1">✅ Confirmados</div>
        </div>
        <div className="card p-5 text-center border-amber-700/30">
          <div className="font-display text-4xl text-amber-400">{counts.pendiente}</div>
          <div className="text-pitch-400 text-sm mt-1">⏳ Por verificar</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-pitch-400">{counts.sin_iniciar}</div>
          <div className="text-pitch-400 text-sm mt-1">— Sin iniciar</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-red-400">{counts.rechazado}</div>
          <div className="text-pitch-400 text-sm mt-1">❌ Rechazados</div>
        </div>
      </div>

      {/* Bolsa acumulada */}
      {config && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-pitch-300 font-semibold">Bolsa acumulada</span>
            <span className="text-pitch-500 text-xs ml-2">({counts.confirmado} × ${config.inscription_amount})</span>
          </div>
          <span className="font-display text-2xl text-brand-400">
            ${config.pool_amount.toLocaleString('es-MX')} {config.currency}
          </span>
        </div>
      )}

      <PagosAdminClient profiles={profiles} />
      </div>
    </div>
  )
}
