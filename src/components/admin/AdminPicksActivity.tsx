'use client'

import { useState, useEffect } from 'react'

interface ParticipantActivity {
  id: string
  username: string
  full_name: string | null
  pickCount: number
  lastModified: string | null
  totalMatches: number
}

export default function AdminPicksActivity() {
  const [rows, setRows]       = useState<ParticipantActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

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

  if (loading) return <div className="text-pitch-400 py-4">Cargando actividad...</div>
  if (error)   return <div className="text-red-400 py-4 text-sm font-mono">Error: {error}</div>

  const withPicks    = rows.filter(r => r.pickCount > 0)
  const withoutPicks = rows.filter(r => r.pickCount === 0)

  return (
    <div className="space-y-3">
      <p className="text-pitch-400 text-sm">
        {rows.length} pagados · {withPicks.length} con picks · {withoutPicks.length} sin picks
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
              <th className="text-left px-3 py-2">Participante</th>
              <th className="text-center px-3 py-2">Picks</th>
              <th className="text-center px-3 py-2">Completado</th>
              <th className="text-left px-3 py-2">Última modificación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const pct = row.totalMatches > 0 ? Math.round((row.pickCount / row.totalMatches) * 100) : 0
              const noPicks = row.pickCount === 0
              return (
                <tr key={row.id} className={`border-b border-pitch-800/40 ${noPicks ? 'bg-red-950/20' : ''}`}>
                  <td className="px-3 py-3">
                    <div className="text-white font-medium">@{row.username}</div>
                    {row.full_name && <div className="text-pitch-500 text-xs">{row.full_name}</div>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={noPicks ? 'text-red-400 font-semibold' : 'text-white'}>
                      {row.pickCount}
                    </span>
                    <span className="text-pitch-600">/{row.totalMatches}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-pitch-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct === 100 ? 'bg-brand-400' : noPicks ? 'bg-red-600' : 'bg-pitch-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs ${pct === 100 ? 'text-brand-400' : noPicks ? 'text-red-400' : 'text-pitch-400'}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {row.lastModified ? (
                      <span className="text-pitch-300 text-xs">
                        {new Date(row.lastModified).toLocaleString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                          timeZone: 'America/Mexico_City',
                        })}
                      </span>
                    ) : (
                      <span className="text-red-400 text-xs font-semibold">⚠ Sin picks guardados</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
