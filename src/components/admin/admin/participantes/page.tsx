import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ParticipantesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: participants } = await supabase
    .from('profiles')
    .select(`
      id, username, full_name, inscription_paid, is_admin, created_at,
      standings (total_points, rank, completion_pct, exact_scores)
    `)
    .order('created_at', { ascending: true })

  const { count: totalPicks } = await supabase
    .from('picks').select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">👥 Participantes</h1>
        <p className="text-pitch-400">{participants?.length ?? 0} registrados · {totalPicks ?? 0} picks totales</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">#</th>
                <th className="text-left px-5 py-3">Participante</th>
                <th className="text-center px-5 py-3">Pago</th>
                <th className="text-center px-5 py-3">Completado</th>
                <th className="text-center px-5 py-3 hidden md:table-cell">Puntos</th>
                <th className="text-center px-5 py-3 hidden md:table-cell">Posición</th>
                <th className="text-center px-5 py-3 hidden lg:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {participants?.map((p, i) => {
                const standing = Array.isArray(p.standings) ? p.standings[0] : p.standings
                return (
                  <tr key={p.id} className="border-b border-pitch-800/50 hover:bg-pitch-800/20 transition-colors">
                    <td className="px-5 py-4 text-pitch-500 text-sm">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-pitch-700 flex items-center justify-center text-sm font-bold text-pitch-200 flex-shrink-0">
                          {p.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm">{p.username}</span>
                            {p.is_admin && (
                              <span className="text-[10px] bg-brand-900/60 text-brand-300 border border-brand-700 px-1.5 py-0.5 rounded-full">Admin</span>
                            )}
                          </div>
                          <div className="text-pitch-500 text-xs">{p.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.inscription_paid
                          ? 'bg-pitch-800 text-pitch-300'
                          : 'bg-orange-950/50 text-orange-400'
                      }`}>
                        {p.inscription_paid ? '✅' : '⏳'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-pitch-800 rounded-full h-1.5">
                          <div
                            className="bg-pitch-500 h-1.5 rounded-full"
                            style={{ width: `${standing?.completion_pct ?? 0}%` }}
                          />
                        </div>
                        <span className="text-pitch-400 text-xs">{standing?.completion_pct ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className="font-display text-xl text-white">{standing?.total_points ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className="text-pitch-300 text-sm">
                        {standing?.rank ? `#${standing.rank}` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center hidden lg:table-cell">
                      <span className="text-pitch-500 text-xs">
                        {new Date(p.created_at).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!participants?.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-pitch-500">
                    No hay participantes registrados
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
