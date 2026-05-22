'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { MatchWithTeams } from '@/types/database'

export default function AdminMatchResults() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function saveResult(matchId: string, home: number, away: number) {
    setSaving(matchId)
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_score: home, away_score: away, is_finished: true }),
    })
    if (res.ok) {
      toast.success('✅ Resultado guardado y puntos calculados')
      setMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, home_score: home, away_score: away, is_finished: true }
          : m
      ))
    } else {
      const j = await res.json()
      toast.error(j.error ?? 'Error al guardar')
    }
    setSaving(null)
  }

  if (loading) return <div className="text-pitch-400 py-4">Cargando partidos...</div>

  const pending  = matches.filter(m => !m.is_finished)
  const finished = matches.filter(m => m.is_finished)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-pitch-300 text-sm uppercase tracking-wider mb-3">
          Pendientes de resultado ({pending.length})
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pending.map(match => (
            <MatchResultRow
              key={match.id}
              match={match}
              onSave={saveResult}
              isSaving={saving === match.id}
            />
          ))}
          {!pending.length && (
            <p className="text-pitch-500 text-sm py-4 text-center">No hay partidos pendientes</p>
          )}
        </div>
      </div>

      {finished.length > 0 && (
        <div>
          <h3 className="text-pitch-300 text-sm uppercase tracking-wider mb-3">
            Finalizados ({finished.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto opacity-60">
            {finished.map(match => (
              <div key={match.id} className="flex items-center justify-between bg-pitch-800/30 rounded-lg px-4 py-2 text-sm">
                <span className="text-pitch-300">
                  {match.home_team?.flag_emoji} {match.home_team?.short_name} vs {match.away_team?.short_name} {match.away_team?.flag_emoji}
                </span>
                <span className="text-white font-bold">{match.home_score} – {match.away_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchResultRow({ match, onSave, isSaving }: {
  match: MatchWithTeams
  onSave: (id: string, h: number, a: number) => void
  isSaving: boolean
}) {
  const [home, setHome] = useState(match.home_score ?? 0)
  const [away, setAway] = useState(match.away_score ?? 0)

  return (
    <div className="flex items-center gap-3 bg-pitch-800/40 rounded-xl px-4 py-3">
      <div className="flex-1 text-right text-sm text-white">
        {match.home_team?.flag_emoji} {match.home_team?.short_name}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input type="number" min={0} max={20} className="w-14 h-10 text-center bg-pitch-700 border border-pitch-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-brand-500"
          value={home} onChange={e => setHome(Number(e.target.value))} />
        <span className="text-pitch-500 font-display text-xl">:</span>
        <input type="number" min={0} max={20} className="w-14 h-10 text-center bg-pitch-700 border border-pitch-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-brand-500"
          value={away} onChange={e => setAway(Number(e.target.value))} />
      </div>
      <div className="flex-1 text-left text-sm text-white">
        {match.away_team?.short_name} {match.away_team?.flag_emoji}
      </div>
      <button
        onClick={() => onSave(match.id, home, away)}
        disabled={isSaving}
        className="btn-green text-xs py-2 px-3 flex-shrink-0"
      >
        {isSaving ? '...' : '✅'}
      </button>
    </div>
  )
}
