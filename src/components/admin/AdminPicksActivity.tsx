'use client'

import { useState, useEffect } from 'react'

interface MissingMatch {
  id: string
  match_number: number | null
  group_name: string | null
  home_team: { short_name: string; flag_emoji: string | null } | null
  away_team: { short_name: string; flag_emoji: string | null } | null
}

interface ParticipantActivity {
  id: string
  username: string
  full_name: string | null
  pickCount: number
  lastModified: string | null
  totalMatches: number
  missingMatches: MissingMatch[]
}

export default function AdminPicksActivity() {
  const [rows, setRows]         = useState<ParticipantActivity[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/picks-activity')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setRows(d.data ?? [])
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) return <div className="text-pitch-400 py-4">Cargando actividad...</div>
  if (error)   return <div className="text-red-400 py-4 text-sm font-mono">Error: {error}</div>

  const withPicks    = rows.filter(r => r.pickCount > 0)
  const withoutPicks = rows.filter(r => r.pickCount === 0)
  const incomplete   = rows.filter(r => r.pickCount > 0 && r.missingMatches.length > 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-pitch-400">{rows.length} pagados</span>
        <span className="text-brand-400">✓ {withPicks.length} con picks</span>
        {incomplete.length > 0 && <span className="text-yellow-400">⚠ {incomplete.length} incompletos</span>}
        {withoutPicks.length > 0 && <span className="text-red-400">✗ {withoutPicks.length} sin picks</span>}
      </div>

      <div className="space-y-1">
        {rows.map(row => {
          const pct      = row.totalMatches > 0 ? Math.round((row.pickCount / row.totalMatches) * 100) : 0
          const noPicks  = row.pickCount === 0
          const missing  = row.missingMatches.length
          const isOpen   = expanded.has(row.id)

          // Agrupar faltantes por grupo
          const byGroup = new Map<string, MissingMatch[]>()
          for (const m of row.missingMatches) {
            const g = m.group_name ?? 'Sin grupo'
            if (!byGroup.has(g)) byGroup.set(g, [])
            byGroup.get(g)!.push(m)
          }

          return (
            <div key={row.id} className={`rounded-xl border ${
              noPicks ? 'border-red-800/50 bg-red-950/20' :
              missing > 0 ? 'border-yellow-800/40 bg-yellow-950/10' :
              'border-pitch-700/30 bg-pitch-800/20'
            }`}>
              {/* Fila principal */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium text-sm">@{row.username}</span>
                  {row.full_name && <span className="text-pitch-500 text-xs ml-2">{row.full_name}</span>}
                </div>

                {/* Barra de progreso */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 bg-pitch-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-brand-400' : noPicks ? 'bg-red-600' : 'bg-yellow-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs w-8 text-right ${pct === 100 ? 'text-brand-400' : noPicks ? 'text-red-400' : 'text-yellow-400'}`}>
                    {pct}%
                  </span>
                </div>

                {/* Contador */}
                <span className="text-xs text-pitch-500 flex-shrink-0 w-14 text-right">
                  <span className={noPicks ? 'text-red-400 font-semibold' : 'text-white'}>{row.pickCount}</span>
                  /{row.totalMatches}
                </span>

                {/* Fecha */}
                <span className="text-pitch-400 text-xs flex-shrink-0 hidden md:block w-36 text-right">
                  {row.lastModified
                    ? new Date(row.lastModified).toLocaleString('es-MX', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: 'America/Mexico_City',
                      })
                    : <span className="text-red-400">Sin picks</span>
                  }
                </span>

                {/* Botón expandir si hay faltantes */}
                {missing > 0 && (
                  <button
                    onClick={() => toggleExpanded(row.id)}
                    className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-pitch-700/60 text-pitch-300 hover:text-white transition-colors"
                  >
                    {isOpen ? '▲' : '▼'} {missing} faltante{missing !== 1 ? 's' : ''}
                  </button>
                )}
                {missing === 0 && !noPicks && (
                  <span className="flex-shrink-0 text-xs text-brand-400">✓ Completo</span>
                )}
              </div>

              {/* Detalle de faltantes */}
              {isOpen && missing > 0 && (
                <div className="border-t border-pitch-700/30 px-4 py-3 space-y-3">
                  {[...byGroup.entries()].map(([group, matches]) => (
                    <div key={group}>
                      <p className="text-pitch-500 text-xs uppercase tracking-wider mb-1.5">
                        {group} — {matches.length} partido{matches.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matches.map(m => (
                          <span key={m.id} className="inline-flex items-center gap-1 bg-pitch-800/80 text-pitch-300 text-xs px-2 py-1 rounded-lg">
                            <span className="text-pitch-600">#{m.match_number}</span>
                            {m.home_team?.flag_emoji} {m.home_team?.short_name}
                            <span className="text-pitch-600">vs</span>
                            {m.away_team?.short_name} {m.away_team?.flag_emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
