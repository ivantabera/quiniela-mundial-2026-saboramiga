'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { MatchWithTeams } from '@/types/database'

type ResultOption = 'home' | 'draw' | 'away'

const OPTIONS: { value: ResultOption; label: string; short: string }[] = [
  { value: 'home', label: 'Local',  short: 'L' },
  { value: 'draw', label: 'Empate', short: 'E' },
  { value: 'away', label: 'Visita', short: 'V' },
]

export default function AdminMatchResults() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setMatches(d.data ?? [])
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  async function saveResult(matchId: string, result: ResultOption) {
    setSaving(matchId)
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, is_finished: true }),
    })
    if (res.ok) {
      toast.success('✅ Resultado guardado y puntos calculados')
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, result, is_finished: true } : m
      ))
    } else {
      const j = await res.json()
      toast.error(j.error ?? 'Error al guardar')
    }
    setSaving(null)
  }

  if (loading) return <div className="text-pitch-400 py-4">Cargando partidos...</div>
  if (error) return <div className="text-red-400 py-4 text-sm font-mono">Error: {error}</div>

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
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  match.result === 'home' ? 'bg-blue-900/50 text-blue-300' :
                  match.result === 'away' ? 'bg-purple-900/50 text-purple-300' :
                  'bg-pitch-700 text-pitch-300'
                }`}>
                  {match.result === 'home' ? 'Local' : match.result === 'away' ? 'Visita' : 'Empate'}
                </span>
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
  onSave: (id: string, result: ResultOption) => void
  isSaving: boolean
}) {
  const [selected, setSelected] = useState<ResultOption | null>(null)

  return (
    <div className="bg-pitch-800/40 rounded-xl px-4 py-3 space-y-3">
      <div className="flex items-center justify-between text-sm text-white">
        <span>{match.home_team?.flag_emoji} {match.home_team?.short_name}</span>
        <span className="text-pitch-500 text-xs">VS</span>
        <span>{match.away_team?.short_name} {match.away_team?.flag_emoji}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`py-2 rounded-lg border font-semibold text-sm transition-all ${
              selected === opt.value
                ? 'bg-brand-500 border-brand-400 text-white'
                : 'bg-pitch-700/60 border-pitch-600/50 text-pitch-300 hover:bg-pitch-600/60 hover:text-white'
            }`}
          >
            <span className="block font-display text-lg leading-none">{opt.short}</span>
            <span className="block text-[10px] uppercase tracking-wider mt-0.5 opacity-80">{opt.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected && onSave(match.id, selected)}
        disabled={!selected || isSaving}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
          selected && !isSaving
            ? 'btn-green'
            : 'bg-pitch-700 text-pitch-500 cursor-not-allowed'
        }`}
      >
        {isSaving ? 'Guardando...' : 'Confirmar resultado'}
      </button>
    </div>
  )
}
