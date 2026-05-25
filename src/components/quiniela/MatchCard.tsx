'use client'

import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface TeamData {
  id: string
  name: string
  short_name: string
  flag_emoji: string | null
  group_name: string | null
}

interface PickData {
  predicted_result: 'home' | 'away' | 'draw' | null
  is_exact?: boolean
  is_correct?: boolean
  points_earned?: number
}

interface MatchData {
  id: string
  match_number: number | null
  stage: string
  group_name: string | null
  match_date: string | null
  venue: string | null
  city: string | null
  home_score: number | null
  away_score: number | null
  result: 'home' | 'away' | 'draw' | null
  is_finished: boolean
  home_team: TeamData | null
  away_team: TeamData | null
  winner: TeamData | null
  user_pick?: PickData | null
}

interface Props {
  match: MatchData
  isEditable: boolean
  userId: string
}

type ResultOption = 'home' | 'draw' | 'away'

const OPTIONS: { value: ResultOption; label: string; shortLabel: string }[] = [
  { value: 'home',  label: 'Local',  shortLabel: 'L' },
  { value: 'draw',  label: 'Empate', shortLabel: 'E' },
  { value: 'away',  label: 'Visita', shortLabel: 'V' },
]

export default function MatchCard({ match, isEditable, userId }: Props) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<ResultOption | null>(
    (match.user_pick?.predicted_result as ResultOption) ?? null
  )
  const [saved, setSaved] = useState(!!match.user_pick)
  const [isDirty, setIsDirty] = useState(false)
  const [hasExistingPick, setHasExistingPick] = useState(!!match.user_pick)

  function handleSelect(value: ResultOption) {
    if (!isEditable || match.is_finished) return
    setSelected(value)
    setIsDirty(value !== (match.user_pick?.predicted_result ?? null))
    setSaved(false)
  }

  async function savePick() {
    if (!selected) { toast.error('Selecciona un resultado'); return }
    startTransition(async () => {
      const payload = {
        user_id:          userId,
        match_id:         match.id,
        predicted_home:   selected === 'home' ? 1 : 0,
        predicted_away:   selected === 'away' ? 1 : 0,
        predicted_result: selected,
      }

      const { error } = hasExistingPick
        ? await supabase.from('picks')
            .update({ predicted_result: selected, predicted_home: payload.predicted_home, predicted_away: payload.predicted_away })
            .eq('user_id', userId).eq('match_id', match.id)
        : await supabase.from('picks').insert(payload)

      if (error) {
        if (error.code === '42501' || error.message.includes('row-level')) {
          toast.error('🔒 La quiniela está cerrada')
        } else {
          toast.error('Error: ' + error.message)
        }
      } else {
        setSaved(true)
        setIsDirty(false)
        setHasExistingPick(true)
        toast.success('✅ Pick guardado')
      }
    })
  }

  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('es-MX', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Mexico_City',
      })
    : 'Por confirmar'

  const homeTeam = match.home_team
  const awayTeam = match.away_team

  // Color de cada botón según estado
  function btnClass(value: ResultOption) {
    const isSelected = selected === value
    const isCorrect  = match.is_finished && match.result === value && selected === value
    const isWrong    = match.is_finished && match.result !== value && selected === value

    if (isCorrect) return 'bg-verde-500 border-verde-400 text-white'
    if (isWrong)   return 'bg-red-900/60 border-red-600 text-red-300'
    if (isSelected && !match.is_finished) return 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-900/40'
    return 'bg-pitch-800/60 border-pitch-600/50 text-pitch-300 hover:bg-pitch-700/60 hover:text-white hover:border-pitch-500'
  }

  return (
    <div className={`card p-5 transition-all duration-200 ${match.is_finished ? 'opacity-80' : ''}`}>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] uppercase tracking-widest text-pitch-500">
          {match.group_name ? `Grupo ${match.group_name}` : match.stage}
        </span>
        <span className="text-[10px] text-pitch-500">{matchDate}</span>
      </div>

      {/* Equipos */}
      <div className="flex items-center justify-between gap-3 mb-5">
        {/* Local */}
        <div className="flex-1 text-center">
          <div className="text-3xl leading-none mb-1">{homeTeam?.flag_emoji ?? '🏳️'}</div>
          <div className="font-semibold text-white text-sm leading-tight">{homeTeam?.name ?? 'Por definir'}</div>
          <div className="text-pitch-500 text-[10px] uppercase tracking-wider mt-0.5">{homeTeam?.short_name ?? '—'}</div>
        </div>

        <div className="text-pitch-500 font-display text-xl">VS</div>

        {/* Visitante */}
        <div className="flex-1 text-center">
          <div className="text-3xl leading-none mb-1">{awayTeam?.flag_emoji ?? '🏳️'}</div>
          <div className="font-semibold text-white text-sm leading-tight">{awayTeam?.name ?? 'Por definir'}</div>
          <div className="text-pitch-500 text-[10px] uppercase tracking-wider mt-0.5">{awayTeam?.short_name ?? '—'}</div>
        </div>
      </div>

      {/* Botones L / E / V */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={!isEditable || match.is_finished}
            className={`py-3 rounded-xl border font-semibold text-sm transition-all duration-150 ${btnClass(opt.value)} disabled:cursor-default`}
          >
            <span className="block font-display text-xl leading-none">{opt.shortLabel}</span>
            <span className="block text-[10px] uppercase tracking-wider mt-0.5 opacity-80">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Resultado real si terminó */}
      {match.is_finished && (
        <div className="text-center mt-2">
          <span className="text-xs bg-pitch-800 text-pitch-300 px-3 py-1 rounded-full">
            Resultado: {match.home_score} – {match.away_score}
            {' '}({match.result === 'home' ? 'Local' : match.result === 'away' ? 'Visita' : 'Empate'})
          </span>
          {match.user_pick && (
            <span className={`ml-2 text-xs px-3 py-1 rounded-full ${
              match.user_pick.is_correct
                ? 'bg-pitch-700 text-pitch-200'
                : 'bg-red-950/50 text-red-400'
            }`}>
              {match.user_pick.is_correct ? '✅' : '❌'} {match.user_pick.points_earned ?? 0} pts
            </span>
          )}
        </div>
      )}

      {/* Botón guardar */}
      {isEditable && !match.is_finished && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-pitch-500">
            {selected
              ? `Seleccionado: ${OPTIONS.find(o => o.value === selected)?.label}`
              : 'Elige un resultado'}
          </span>
          <button
            onClick={savePick}
            disabled={isPending || !selected || (saved && !isDirty)}
            className={`text-sm px-4 py-2 rounded-lg font-semibold transition-all ${
              saved && !isDirty
                ? 'bg-pitch-800 text-pitch-400 cursor-default'
                : !selected
                ? 'bg-pitch-800 text-pitch-600 cursor-not-allowed'
                : 'btn-green text-sm'
            }`}
          >
            {isPending ? 'Guardando...' : saved && !isDirty ? '✅ Guardado' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}
