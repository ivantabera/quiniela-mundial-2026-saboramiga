'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Team { id: string; name: string; short_name: string; flag_emoji: string | null }
interface Match {
  id: string
  match_number: number | null
  group_name: string | null
  match_date: string | null
  venue: string | null
  city: string | null
  is_finished: boolean
  home_score: number | null
  away_score: number | null
  result: string | null
  home_team: Team | null
  away_team: Team | null
}

type ResultOption = 'home' | 'draw' | 'away'

export default function ResultadosClient({ matches: initial }: { matches: Match[] }) {
  const supabase = createClient()
  const [matches, setMatches]   = useState(initial)
  const [saving, setSaving]     = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState('A')
  const [showFinished, setShowFinished] = useState(false)

  const groups = Array.from(new Set(initial.map(m => m.group_name).filter(Boolean))).sort() as string[]

  const filtered = matches.filter(m => {
    if (m.group_name !== groupFilter) return false
    if (!showFinished && m.is_finished) return false
    return true
  })

  async function saveResult(matchId: string, result: ResultOption) {
    setSaving(matchId)

    // Determinar marcadores según resultado
    const home_score = result === 'home' ? 1 : 0
    const away_score = result === 'away' ? 1 : 0

    const { error } = await supabase
      .from('matches')
      .update({
        result,
        home_score,
        away_score,
        is_finished: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      setMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, result, home_score, away_score, is_finished: true }
          : m
      ))
      // Refrescar standings via API
      await fetch(`/api/admin/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, home_score, away_score, is_finished: true }),
      })
      toast.success('✅ Resultado guardado y puntos calculados')
    }
    setSaving(null)
  }

  async function undoResult(matchId: string) {
    if (!confirm('¿Revertir este resultado? Se borrarán los puntos calculados.')) return
    setSaving(matchId)
    const { error } = await supabase
      .from('matches')
      .update({ result: null, home_score: null, away_score: null, is_finished: false })
      .eq('id', matchId)

    if (!error) {
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, result: null, home_score: null, away_score: null, is_finished: false } : m
      ))
      toast.success('↩️ Resultado revertido')
    } else {
      toast.error('Error: ' + error.message)
    }
    setSaving(null)
  }

  const RESULT_LABELS: Record<string, string> = { home: 'Local', draw: 'Empate', away: 'Visita' }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-pitch-400 text-sm">Grupo:</span>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              groupFilter === g ? 'bg-pitch-600 text-white' : 'bg-pitch-800 text-pitch-400 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
        <label className="ml-4 flex items-center gap-2 text-sm text-pitch-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showFinished}
            onChange={e => setShowFinished(e.target.checked)}
            className="accent-pitch-500"
          />
          Ver finalizados
        </label>
      </div>

      {/* Partidos */}
      <div className="space-y-3">
        {filtered.map(match => (
          <div key={match.id} className={`card p-4 ${match.is_finished ? 'opacity-70' : ''}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

              {/* Partido */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-pitch-600 text-xs w-6 text-center flex-shrink-0">
                  #{match.match_number}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0">{match.home_team?.flag_emoji ?? '🏳️'}</span>
                  <span className="text-white text-sm font-semibold truncate">{match.home_team?.short_name ?? '?'}</span>
                  <span className="text-pitch-500 text-xs">vs</span>
                  <span className="text-white text-sm font-semibold truncate">{match.away_team?.short_name ?? '?'}</span>
                  <span className="text-xl flex-shrink-0">{match.away_team?.flag_emoji ?? '🏳️'}</span>
                </div>
                {match.match_date && (
                  <span className="text-pitch-600 text-xs flex-shrink-0 hidden md:block">
                    {new Date(match.match_date).toLocaleDateString('es-MX', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      timeZone: 'America/Mexico_City'
                    })}
                  </span>
                )}
              </div>

              {/* Resultado o botones */}
              {match.is_finished ? (
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                    match.result === 'home' ? 'bg-pitch-700 text-white' :
                    match.result === 'away' ? 'bg-pitch-700 text-white' :
                    'bg-pitch-700 text-white'
                  }`}>
                    ✅ {RESULT_LABELS[match.result ?? ''] ?? match.result}
                  </span>
                  <button
                    onClick={() => undoResult(match.id)}
                    disabled={saving === match.id}
                    className="text-xs text-pitch-500 hover:text-red-400 transition-colors"
                  >
                    ↩️ Revertir
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  {(['home', 'draw', 'away'] as ResultOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => saveResult(match.id, opt)}
                      disabled={saving === match.id}
                      className="px-4 py-2 rounded-lg border border-pitch-600 bg-pitch-800/60 text-pitch-300 hover:bg-pitch-600 hover:text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {saving === match.id ? '...' : opt === 'home' ? 'L' : opt === 'draw' ? 'E' : 'V'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card p-10 text-center text-pitch-500">
            {showFinished ? 'No hay partidos en este grupo' : 'No hay partidos pendientes en este grupo'}
          </div>
        )}
      </div>
    </div>
  )
}
