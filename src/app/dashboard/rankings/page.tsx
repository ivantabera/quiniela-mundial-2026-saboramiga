import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { StandingWithProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [standingsRes, configRes, totalMatchesRes] = await Promise.all([
    supabase
      .from('standings')
      .select('*, profile:profiles(*)')
      .order('rank', { ascending: true })
      .limit(100),
    supabase
      .from('quiniela_config')
      .select('pool_amount, currency, tiebreak_enabled')
      .single(),
    supabase
      .from('matches')
      .select('id', { count: 'exact', head: true }),
  ])

  const config      = configRes.data
  const totalMatches = totalMatchesRes.count ?? 72
  const hasStarted  = (standingsRes.data?.length ?? 0) > 0

  // --- Vista pre-torneo: participantes con conteo de picks ---
  let preRows: { id: string; username: string; full_name: string | null; picks: number }[] = []
  if (!hasStarted) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    const { data: pickCounts } = await supabase
      .from('picks')
      .select('user_id')

    const countMap = new Map<string, number>()
    pickCounts?.forEach(p => countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1))

    preRows = (profiles ?? []).map(p => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      picks: countMap.get(p.id) ?? 0,
    })).sort((a, b) => b.picks - a.picks)
  }

  // --- Vista durante torneo ---
  const rows = (standingsRes.data ?? []) as unknown as StandingWithProfile[]
  const topPoints = rows[0]?.total_points ?? 0
  const winners   = rows.filter(r => r.total_points === topPoints && topPoints > 0)
  const prizeEach = winners.length > 0 && config ? config.pool_amount / winners.length : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">Rankings</h1>
        <p className="text-pitch-400">
          {hasStarted ? 'Tabla de posiciones en tiempo real' : 'Participantes registrados · El ranking arranca con el primer partido'}
        </p>
      </div>

      {/* Bolsa */}
      {config && (
        <div className="card p-5 flex items-center justify-between">
          <span className="text-pitch-300 text-sm">Bolsa acumulada</span>
          <span className="font-display text-2xl text-yellow-400">
            ${config.pool_amount.toLocaleString('es-MX')} {config.currency}
          </span>
        </div>
      )}

      {/* Aviso empate */}
      {hasStarted && config && winners.length > 1 && (
        <div className="card border-brand-600/40 bg-brand-900/20 p-5">
          <p className="text-brand-300 font-semibold text-sm uppercase tracking-wider mb-1">⚠️ Empate en primer lugar</p>
          <p className="text-white">
            {winners.length} participantes empatados · La bolsa se divide:{' '}
            <span className="text-yellow-400 font-bold">
              ${prizeEach.toLocaleString('es-MX', { minimumFractionDigits: 0 })} {config.currency}
            </span>{' '}
            para cada ganador.
          </p>
        </div>
      )}

      {/* Podio — solo durante el torneo con 3+ participantes */}
      {hasStarted && rows.length >= 3 && (
        <div className="flex items-end justify-center gap-4 pt-6 pb-4">
          {[rows[1], rows[0], rows[2]].map((row, i) => {
            const heights = ['h-24', 'h-32', 'h-20']
            const medals  = ['🥈', '🥇', '🥉']
            const positions = [2, 1, 3]
            return (
              <div key={row.user_id} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{medals[i]}</span>
                <div className="text-center">
                  <div className="text-white font-semibold text-sm">{row.profile.username}</div>
                  <div className="text-pitch-400 text-xs">{row.total_points} pts</div>
                </div>
                <div className={`${heights[i]} w-20 rounded-t-xl flex items-end justify-center pb-2 ${
                  i === 1 ? 'bg-yellow-600/80' : i === 0 ? 'bg-gray-500/80' : 'bg-orange-700/80'
                }`}>
                  <span className="font-display text-2xl text-white">#{positions[i]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabla durante el torneo */}
      {hasStarted && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Participante</th>
                  <th className="text-center px-4 py-3">Pts</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">Aciertos</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">Completado</th>
                  {config && <th className="text-center px-4 py-3">Premio</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isCurrentUser = row.user_id === user?.id
                  const isWinner = row.total_points === topPoints && topPoints > 0
                  return (
                    <tr key={row.user_id} className={`border-b border-pitch-800/50 transition-colors ${
                      isCurrentUser ? 'bg-pitch-700/30' : 'hover:bg-pitch-800/30'
                    } ${isWinner ? 'border-l-2 border-l-yellow-500' : ''}`}>
                      <td className="px-4 py-4">
                        <span className={`font-display text-xl ${
                          idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-pitch-400'
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
                        <span className="text-brand-400 text-sm">✓ {row.correct_results}</span>
                      </td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-pitch-800 rounded-full h-1.5">
                            <div className="bg-pitch-500 h-1.5 rounded-full" style={{ width: `${row.completion_pct}%` }} />
                          </div>
                          <span className="text-pitch-400 text-xs">{row.completion_pct}%</span>
                        </div>
                      </td>
                      {config && (
                        <td className="px-4 py-4 text-center">
                          {isWinner
                            ? <span className="text-yellow-400 font-bold text-sm">${prizeEach.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
                            : <span className="text-pitch-600 text-sm">—</span>
                          }
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla pre-torneo */}
      {!hasStarted && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-pitch-700/50">
            <p className="text-pitch-400 text-xs uppercase tracking-wider">
              Participantes registrados — {preRows.length} en total
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Participante</th>
                  <th className="text-center px-4 py-3">Picks</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">Completado</th>
                </tr>
              </thead>
              <tbody>
                {preRows.map((row, idx) => {
                  const isCurrentUser = row.id === user?.id
                  const pct = totalMatches > 0 ? Math.round((row.picks / totalMatches) * 100) : 0
                  return (
                    <tr key={row.id} className={`border-b border-pitch-800/50 transition-colors ${
                      isCurrentUser ? 'bg-pitch-700/30' : 'hover:bg-pitch-800/30'
                    }`}>
                      <td className="px-4 py-4">
                        <span className="font-display text-xl text-pitch-400">#{idx + 1}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pitch-700 flex items-center justify-center text-sm font-bold text-pitch-300">
                            {row.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">
                              {row.username}
                              {isCurrentUser && <span className="ml-2 text-xs text-pitch-500">(tú)</span>}
                            </div>
                            {row.full_name && <div className="text-pitch-500 text-xs">{row.full_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-display text-lg text-white">{row.picks}</span>
                        <span className="text-pitch-500 text-xs"> /{totalMatches}</span>
                      </td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-pitch-800 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-brand-400' : 'bg-pitch-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs ${pct === 100 ? 'text-brand-400' : 'text-pitch-400'}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {preRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-pitch-500">
                      Aún no hay participantes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
