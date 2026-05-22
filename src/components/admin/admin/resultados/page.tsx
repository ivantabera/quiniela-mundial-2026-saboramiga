import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResultadosClient from './ResultadosClient'

export const dynamic = 'force-dynamic'

export default async function ResultadosPage() {
  const supabase = await createServerSupabaseClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, flag_emoji),
      away_team:away_team_id(id, name, short_name, flag_emoji)
    `)
    .eq('stage', 'group')
    .order('match_date', { ascending: true })

  const finished = matches?.filter(m => m.is_finished).length ?? 0
  const pending  = matches?.filter(m => !m.is_finished).length ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">⚽ Resultados</h1>
        <p className="text-pitch-400">Ingresa los marcadores reales de cada partido</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="font-display text-3xl text-white">{matches?.length ?? 0}</div>
          <div className="text-pitch-400 text-sm mt-1">Total partidos</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-3xl text-pitch-200">{finished}</div>
          <div className="text-pitch-400 text-sm mt-1">✅ Finalizados</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-3xl text-orange-400">{pending}</div>
          <div className="text-pitch-400 text-sm mt-1">⏳ Pendientes</div>
        </div>
      </div>

      <ResultadosClient matches={matches ?? []} />
    </div>
  )
}
