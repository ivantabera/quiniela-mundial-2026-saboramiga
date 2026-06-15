'use client'

import { useState, useMemo } from 'react'
import MatchCard from './MatchCard'
import { isMatchOpen } from '@/lib/utils/quiniela-status'
import type { MatchWithTeams } from '@/types/database'

type ViewMode = 'dia' | 'grupo'

interface Props {
  matches: MatchWithTeams[]
  config: { close_date: string; is_manually_open: boolean } | null
  userId: string
}

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final']
const STAGE_LABEL: Record<string, string> = {
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarters:    'Cuartos de Final',
  semis:       'Semifinales',
  third_place: 'Tercer Lugar',
  final:       'Gran Final',
}

export default function QuinielaMatchList({ matches, config, userId }: Props) {
  const [view, setView] = useState<ViewMode>('dia')

  // useMemo evita recalcular todayKey en cada render y previene mismatch de hidratación
  const todayKey = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
    [],
  )

  const dayGroups = useMemo(() => {
    const map = new Map<string, { label: string; matches: MatchWithTeams[] }>()
    for (const m of matches) {
      const key = m.match_date
        ? new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
        : 'zz-sin-fecha'
      if (!map.has(key)) {
        const label = m.match_date
          ? new Date(m.match_date).toLocaleDateString('es-MX', {
              weekday: 'long', day: 'numeric', month: 'long',
              timeZone: 'America/Mexico_City',
            })
          : 'Por confirmar'
        map.set(key, { label, matches: [] })
      }
      map.get(key)!.matches.push(m)
    }
    const all     = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
    const future  = all.filter(([k]) => k >= todayKey)
    const past    = all.filter(([k]) => k < todayKey && k !== 'zz-sin-fecha')
    const noDate  = all.filter(([k]) => k === 'zz-sin-fecha')
    return [...future, ...past, ...noDate]
  }, [matches, todayKey])

  const sortedGroups = useMemo(() => {
    const map: Record<string, MatchWithTeams[]> = {}
    for (const m of matches) {
      const key = m.group_name
        ? `Grupo ${m.group_name}`
        : (STAGE_LABEL[m.stage] ?? m.stage)
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return Object.entries(map).sort(([a], [b]) => {
      const aG = a.startsWith('Grupo ')
      const bG = b.startsWith('Grupo ')
      if (aG && bG) return a.localeCompare(b)
      if (aG) return -1
      if (bG) return 1
      const ai = STAGE_ORDER.findIndex(s => (STAGE_LABEL[s] ?? s) === a)
      const bi = STAGE_ORDER.findIndex(s => (STAGE_LABEL[s] ?? s) === b)
      return ai - bi
    })
  }, [matches])

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('dia')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === 'dia'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
              : 'bg-pitch-800 text-pitch-400 hover:text-white hover:bg-pitch-700'
          }`}
        >
          Por Día
        </button>
        <button
          type="button"
          onClick={() => setView('grupo')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === 'grupo'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
              : 'bg-pitch-800 text-pitch-400 hover:text-white hover:bg-pitch-700'
          }`}
        >
          Por Grupo
        </button>
      </div>

      {view === 'dia' ? (
        <div className="space-y-8">
          {dayGroups.map(([dateKey, { label, matches: dayMatches }]) => {
            const isToday = dateKey === todayKey
            const isPast  = dateKey < todayKey && dateKey !== 'zz-sin-fecha'
            return (
              <section key={dateKey} className={isPast ? 'opacity-55' : ''}>
                <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${
                  isToday ? 'border-brand-600/60' : 'border-pitch-700/50'
                }`}>
                  <h2 className={`font-display text-xl tracking-widest uppercase ${
                    isToday ? 'text-brand-400' : 'text-pitch-300'
                  }`}>
                    {isToday ? '⚽ Hoy — ' : ''}{label}
                  </h2>
                  <span className="text-pitch-500 text-xs">
                    {dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isEditable={!match.is_finished && isMatchOpen(match.match_date, config)}
                      userId={userId}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([groupName, groupMatches]) => (
            <section key={groupName}>
              <h2 className="font-display text-2xl text-pitch-300 tracking-widest uppercase mb-4 pb-2 border-b border-pitch-700/50">
                {groupName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isEditable={!match.is_finished && isMatchOpen(match.match_date, config)}
                    userId={userId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
