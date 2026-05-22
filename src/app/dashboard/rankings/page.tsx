import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { StandingWithProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: standings } = await supabase
    .from('standings')
    .select('*, profile:profiles(*)')
    .order('rank', { ascending: true })
    .limit(100)

  const { data: config } = await supabase
    .from('quiniela_config')
    .select('pool_amount, currency, tiebreak_enabled')
    .single()

  const rows = (standings ?? []) as unknown as StandingWithProfile[]
  const topPoints = rows[0]?.total_points ?? 0
  const winners   = rows.filter(r => r.total_points === topPoints && topPoints > 0)
  const prizeEach = winners.length > 0 && config
    ? config.pool_amount / winners.length
    : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">Rankings</h1>
        <p className="text-pitch-400">Tabla de posiciones en tiempo real</p>
      </div>

      {/* Bolsa y empates */}
      {config && winners.length > 1 && (
        <div className="card border-brand-600/40 bg-brand-900/20 p-5">
          <p className="text-brand-300 font-semibold text-sm uppercase tracking-wider mb-1">⚠️ Empate en primer lugar</p>
          <p className="text-white">
            {winners.length} participantes empatados · La bolsa de{' '}
            <span className="text-brand-400 font-bold">
              ${config.pool_amount.toLocaleString('es-MX')} {config.currency}
            </span>{' '}
            se divide en partes iguales:{' '}
            <span className="text-yellow-400 font-bold">
              ${prizeEach.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {config.currency}
            </span>{' '}
            para cada ganador.
          </p>
        </div>
      )}

      {/* Top 3 podio */}
      {rows.length >= 3 && (
        <div className="flex items-end justify-center gap-4 pt-6 pb-4">
          {[rows[1], rows[0], rows[2]].map((row, i) => {
            const heights = ['h-24', 'h-32', 'h-20']
            const medals  = ['🥈', '🥇', '🥉']
            const actual  = [1, 0, 2]
            const idx = actual[i]
            return (
              <div key={row.user_id} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{medals[i]}</span>
                <div className="text-center">
                  <div className="text-white font-semibold text-sm">{row.profile.username}</div>
                  <div className="text-pitch-400 text-xs">{row.total_points} pts</div>
                </div>
                <div
                  className={`${heights[i]} w-20 rounded-t-xl flex items-end justify-center pb-2 podium-bar ${
                    i === 1 ? 'bg-yellow-600/80' : i === 0 ? 'bg-gray-500/80' : 'bg-orange-700/80'
                  }`}
                >
                  <span className="font-display text-2xl text-white">#{idx + 1}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabla completa */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Participante</th>
                <th className="text-center px-4 py-3">Pts</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Exactos</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Completado</th>
                {config && <th className="text-center px-4 py-3">Premio</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isCurrentUser = row.user_id === user?.id
                const isWinner = row.total_points === topPoints && topPoints > 0
                return (
                  <tr
                    key={row.user_id}
                    className={`border-b border-pitch-800/50 transition-colors ${
                      isCurrentUser ? 'bg-pitch-700/30' : 'hover:bg-pitch-800/30'
                    } ${isWinner ? 'border-l-2 border-l-yellow-500' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <span className={`font-display text-xl ${
                        idx === 0 ? 'text-yellow-400' :
                        idx === 1 ? 'text-gray-300' :
                        idx === 2 ? 'text-orange-400' : 'text-pitch-400'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${row.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pitch-700 flex items-center justify-center text-sm font-bold text-pitch-300">
                          {row.profile.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {row.profile.username}
                            {isCurrentUser && <span className="ml-2 text-xs text-pitch-500">(tú)</span>}
                          </div>
                          <div className="text-pitch-500 text-xs">{row.profile.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-display text-xl text-white">{row.total_points}</span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className="text-yellow-400 text-sm">🎯 {row.exact_scores}</span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-pitch-800 rounded-full h-1.5">
                          <div
                            className="bg-pitch-500 h-1.5 rounded-full"
                            style={{ width: `${row.completion_pct}%` }}
                          />
                        </div>
                        <span className="text-pitch-400 text-xs">{row.completion_pct}%</span>
                      </div>
                    </td>
                    {config && (
                      <td className="px-4 py-4 text-center">
                        {isWinner ? (
                          <span className="text-yellow-400 font-bold text-sm">
                            ${prizeEach.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                          </span>
                        ) : (
                          <span className="text-pitch-600 text-sm">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-pitch-500">
                    Aún no hay participantes con picks registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
