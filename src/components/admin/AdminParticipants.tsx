'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Participant {
  id: string
  username: string
  full_name: string | null
  inscription_paid: boolean
  is_active: boolean
  created_at: string
}

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [poolAmount, setPoolAmount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/participants')
      .then(r => r.json())
      .then(d => { setParticipants(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const paid   = participants.filter(p => p.inscription_paid)
  const unpaid = participants.filter(p => !p.inscription_paid)

  async function togglePaid(participant: Participant) {
    setToggling(participant.id)
    const newVal = !participant.inscription_paid
    const res = await fetch(`/api/admin/participants/${participant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inscription_paid: newVal }),
    })
    const json = await res.json()
    if (res.ok) {
      setParticipants(prev =>
        prev.map(p => p.id === participant.id ? { ...p, inscription_paid: newVal } : p)
      )
      if (json.pool_amount !== null) setPoolAmount(json.pool_amount)
      toast.success(newVal ? `✅ ${participant.username} marcado como pagado` : `↩️ Pago revertido`)
    } else {
      toast.error(json.error ?? 'Error al actualizar')
    }
    setToggling(null)
  }

  if (loading) return <div className="text-pitch-400 py-4">Cargando participantes...</div>

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-pitch-800/50 rounded-xl p-4 text-center">
          <div className="font-display text-2xl text-white">{participants.length}</div>
          <div className="text-pitch-400 text-xs uppercase tracking-wider mt-1">Registrados</div>
        </div>
        <div className="bg-pitch-800/50 rounded-xl p-4 text-center">
          <div className="font-display text-2xl text-brand-400">{paid.length}</div>
          <div className="text-pitch-400 text-xs uppercase tracking-wider mt-1">Pagados</div>
        </div>
        <div className="bg-pitch-800/50 rounded-xl p-4 text-center">
          <div className="font-display text-2xl text-yellow-400">
            ${poolAmount !== null ? poolAmount.toLocaleString('es-MX') : (paid.length * 100).toLocaleString('es-MX')}
          </div>
          <div className="text-pitch-400 text-xs uppercase tracking-wider mt-1">Bolsa MXN</div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto">
        {/* Sin pagar primero */}
        {unpaid.length > 0 && (
          <>
            <p className="text-pitch-500 text-xs uppercase tracking-wider px-1 pt-2">Pendientes de pago ({unpaid.length})</p>
            {unpaid.map(p => (
              <ParticipantRow key={p.id} participant={p} onToggle={togglePaid} isToggling={toggling === p.id} />
            ))}
          </>
        )}

        {paid.length > 0 && (
          <>
            <p className="text-pitch-500 text-xs uppercase tracking-wider px-1 pt-3">Pagados ({paid.length})</p>
            {paid.map(p => (
              <ParticipantRow key={p.id} participant={p} onToggle={togglePaid} isToggling={toggling === p.id} />
            ))}
          </>
        )}

        {!participants.length && (
          <p className="text-pitch-500 text-center py-6">Aún no hay participantes registrados</p>
        )}
      </div>
    </div>
  )
}

function ParticipantRow({ participant, onToggle, isToggling }: {
  participant: Participant
  onToggle: (p: Participant) => void
  isToggling: boolean
}) {
  const date = new Date(participant.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
      participant.inscription_paid
        ? 'bg-pitch-800/30 border-pitch-700/30'
        : 'bg-pitch-800/60 border-pitch-700/60'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${participant.inscription_paid ? 'bg-brand-400' : 'bg-pitch-600'}`} />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {participant.full_name || participant.username}
          </p>
          <p className="text-pitch-500 text-xs">@{participant.username} · {date}</p>
        </div>
      </div>

      <button
        onClick={() => onToggle(participant)}
        disabled={isToggling}
        className={`ml-3 flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
          participant.inscription_paid
            ? 'bg-pitch-700 text-pitch-400 hover:bg-red-900/50 hover:text-red-400'
            : 'bg-brand-600 text-white hover:bg-brand-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isToggling ? '...' : participant.inscription_paid ? '✓ Pagado' : 'Marcar pagado'}
      </button>
    </div>
  )
}
