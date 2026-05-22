import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getQuinielaState } from '@/lib/utils/quiniela-status'
import MatchCard from '@/components/quiniela/MatchCard'
import QuinielaLocked from '@/components/quiniela/QuinielaLocked'
import type { MatchWithTeams } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function QuinielaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [configRes, matchesRes] = await Promise.all([
    supabase.from('quiniela_config').select('*').single(),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name, short_name, flag_emoji, group_name),
        away_team:away_team_id(id, name, short_name, flag_emoji, group_name),
        winner:winner_id(id, name, short_name, flag_emoji, group_name)
      `)
      .order('match_date', { ascending: true }),
  ])

  const config = configRes.data
  const state  = config ? getQuinielaState(config.close_date, config.is_manually_open) : null

  // 👇 AGREGA AQUÍ
  console.log('CONFIG:', config)
  console.log('STATE isOpen:', state?.isOpen)
  console.log('MATCHES count:', matchesRes.data?.length, 'error:', matchesRes.error)


  // Obtener picks del usuario
  const { data: userPicks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user!.id)

  const picksMap = new Map(userPicks?.map(p => [p.match_id, p]) ?? [])

  // Combinar picks con partidos
  const matchesWithPicks: MatchWithTeams[] = (matchesRes.data ?? []).map(m => ({
    ...m,
    user_pick: picksMap.get(m.id) ?? null,
  }))

  // Agrupar por etapa
  const groups = matchesWithPicks.reduce<Record<string, MatchWithTeams[]>>((acc, m) => {
    const key = m.group_name ? `Grupo ${m.group_name}` : formatStage(m.stage)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">Mi Quiniela</h1>
          <p className="text-pitch-400">
            {state?.isOpen ? 'Llena tus predicciones antes del cierre' : 'Quiniela cerrada — solo lectura'}
          </p>
        </div>
        {state && (
          <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            state.isOpen
              ? 'bg-pitch-800 text-pitch-200 border-pitch-600'
              : 'bg-red-950/50 text-red-300 border-red-700'
          }`}>
            {state.isOpen ? `⏳ ${state.hoursRemaining}h restantes` : '🔒 Cerrada'}
          </div>
        )}
      </div>

      {!state?.isOpen && <QuinielaLocked />}

      {Object.entries(groups).map(([groupName, matches]) => (
        <section key={groupName}>
          <h2 className="font-display text-2xl text-pitch-300 tracking-widest uppercase mb-4 pb-2 border-b border-pitch-700/50">
            {groupName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isEditable={state?.canEdit ?? false}
                userId={user!.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function formatStage(stage: string): string {
  const map: Record<string, string> = {
    round_of_32:  'Ronda de 32',
    round_of_16:  'Octavos de Final',
    quarters:     'Cuartos de Final',
    semis:        'Semifinales',
    third_place:  'Tercer Lugar',
    final:        '🏆 Gran Final',
  }
  return map[stage] ?? stage
}
