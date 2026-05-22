import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getQuinielaState } from '@/lib/utils/quiniela-status'
import CountdownBanner from '@/components/shared/CountdownBanner'
import PoolDisplay from '@/components/shared/PoolDisplay'
import StatusBadge from '@/components/shared/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: config } = await supabase
    .from('quiniela_config')
    .select('*')
    .single()

  const state = config
    ? getQuinielaState(config.close_date, config.is_manually_open)
    : null

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Fondo estilo estadio */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(22,163,74,0.25),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pitch-500/50 to-transparent" />
          {/* Líneas de cancha decorativas */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 800 600" fill="none">
            <rect x="100" y="50" width="600" height="500" stroke="#22c55e" strokeWidth="2"/>
            <circle cx="400" cy="300" r="80" stroke="#22c55e" strokeWidth="2"/>
            <line x1="400" y1="50" x2="400" y2="550" stroke="#22c55e" strokeWidth="2"/>
            <rect x="100" y="200" width="120" height="200" stroke="#22c55e" strokeWidth="2"/>
            <rect x="580" y="200" width="120" height="200" stroke="#22c55e" strokeWidth="2"/>
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Branding */}
          <p className="text-pitch-400 text-sm uppercase tracking-[0.3em] mb-4">
            Sabor a Miga presenta
          </p>

          <h1 className="font-display text-7xl md:text-9xl text-white leading-none mb-2 tracking-wide">
            QUINIELA
          </h1>
          <h2 className="font-display text-4xl md:text-6xl text-brand-400 leading-none mb-8 tracking-widest">
            MUNDIAL 2026
          </h2>

          {/* Estado de quiniela */}
          {state && (
            <div className="flex justify-center mb-8">
              <StatusBadge status={state.status} label={state.label} />
            </div>
          )}

          {/* Bolsa acumulada */}
          {config && (
            <div className="mb-10">
              <PoolDisplay amount={config.pool_amount} currency={config.currency} />
            </div>
          )}

          {/* Countdown */}
          {state?.isOpen && (
            <div className="mb-10">
              <CountdownBanner
                closeDate={config!.close_date}
                status={state.status}
              />
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard" className="btn-primary text-lg px-10 py-4">
                🏆 Ir a mi quiniela
              </Link>
            ) : (
              <>
                <Link href="/auth/register" className="btn-primary text-lg px-10 py-4">
                  ⚽ Registrarme y participar
                </Link>
                <Link href="/auth/login" className="btn-secondary text-lg px-10 py-4">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          {/* Info rápida */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: '🌎', label: '48 Selecciones', sub: 'del mundo entero' },
              { icon: '📅', label: '11 Jun – 19 Jul', sub: 'torneo completo' },
              { icon: '🏅', label: 'Bolsa total', sub: 'entre los ganadores' },
            ].map(item => (
              <div key={item.label} className="card px-4 py-5 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-display text-xl text-white">{item.label}</div>
                <div className="text-pitch-400 text-sm">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pitch-800 py-6 text-center text-pitch-500 text-sm">
        © 2026 Sabor a Miga · Quiniela Mundial 2026
      </footer>
    </main>
  )
}
