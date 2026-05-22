import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getQuinielaState } from '@/lib/utils/quiniela-status'
import CountdownBanner from '@/components/shared/CountdownBanner'
import StatusBadge from '@/components/shared/StatusBadge'
import PoolDisplay from '@/components/shared/PoolDisplay'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [configRes, standingRes, picksCountRes, matchCountRes] = await Promise.all([
    supabase.from('quiniela_config').select('*').single(),
    supabase.from('standings').select('*').eq('user_id', user!.id).single(),
    supabase.from('picks').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
  ])

  const config   = configRes.data
  const standing = standingRes.data
  const picks    = picksCountRes.count ?? 0
  const total    = matchCountRes.count ?? 0
  const pct      = total > 0 ? Math.round((picks / total) * 100) : 0
  const state    = config ? getQuinielaState(config.close_date, config.is_manually_open) : null

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Estado quiniela + countdown */}
      {state && config && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl text-white tracking-wide">
                Estado de la Quiniela
              </h2>
              <p className="text-pitch-400 text-sm">Mundial 2026 · {config.tournament_name}</p>
            </div>
            <StatusBadge status={state.status} label={state.label} large />
          </div>
          {state.isOpen && (
            <CountdownBanner closeDate={config.close_date} status={state.status} compact />
          )}
          {!state.isOpen && (
            <div className="mt-4 bg-red-950/40 border border-red-800/50 rounded-xl px-5 py-4 text-red-300">
              🔒 La quiniela está cerrada. Solo puedes consultar tus predicciones y el ranking.
            </div>
          )}
        </div>
      )}

      {/* Stats del usuario */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Posición',    value: standing?.rank   ? `#${standing.rank}`    : '—',   icon: '🏅' },
          { label: 'Puntos',      value: standing?.total_points ?? 0,                         icon: '⭐' },
          { label: 'Exactos',     value: standing?.exact_scores ?? 0,                         icon: '🎯' },
          { label: 'Completado',  value: `${pct}%`,                                           icon: '📋' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-display text-3xl text-white">{s.value}</div>
            <div className="text-pitch-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progreso de quiniela */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-semibold">Progreso de tu quiniela</span>
          <span className="text-pitch-300 text-sm">{picks} / {total} partidos</span>
        </div>
        <div className="w-full bg-pitch-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-pitch-600 to-brand-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-pitch-400 text-xs mt-2">
          {pct < 100 && state?.isOpen
            ? `Te faltan ${total - picks} partidos por llenar`
            : pct === 100
            ? '✅ ¡Quiniela completada!'
            : 'Quiniela cerrada con los picks guardados'}
        </p>
      </div>

      {/* Bolsa */}
      {config && (
        <div className="text-center">
          <PoolDisplay amount={config.pool_amount} currency={config.currency} large />
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/quiniela" className="card-hover p-6 flex items-center gap-4 group">
          <span className="text-4xl">⚽</span>
          <div>
            <div className="font-semibold text-white group-hover:text-pitch-200">Mi Quiniela</div>
            <div className="text-pitch-400 text-sm">
              {state?.isOpen ? 'Llena tus predicciones' : 'Ver mis picks'}
            </div>
          </div>
        </Link>
        <Link href="/dashboard/rankings" className="card-hover p-6 flex items-center gap-4 group">
          <span className="text-4xl">🏆</span>
          <div>
            <div className="font-semibold text-white group-hover:text-pitch-200">Rankings</div>
            <div className="text-pitch-400 text-sm">Ver tabla de posiciones</div>
          </div>
        </Link>
        <Link href="/dashboard/perfil" className="card-hover p-6 flex items-center gap-4 group">
          <span className="text-4xl">👤</span>
          <div>
            <div className="font-semibold text-white group-hover:text-pitch-200">Mi Perfil</div>
            <div className="text-pitch-400 text-sm">Estadísticas personales</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
