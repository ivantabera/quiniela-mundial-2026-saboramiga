'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  const [poolAmount, setPoolAmount] = useState<number>(0)
  const [currency, setCurrency]     = useState<string>('MXN')

  useEffect(() => {
    fetch('/api/admin/participants')
      .then(r => r.json())
      .then(d => {
        setParticipants(d.data ?? [])
        setPoolAmount(d.pool_amount ?? 0)
        setCurrency(d.currency ?? 'MXN')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const paid   = participants.filter(p => p.inscription_paid)
  const unpaid = participants.filter(p => !p.inscription_paid)

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
            ${poolAmount.toLocaleString('es-MX')}
          </div>
          <div className="text-pitch-400 text-xs uppercase tracking-wider mt-1">Bolsa {currency}</div>
        </div>
      </div>

      {/* Lista solo lectura */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto">
        {unpaid.length > 0 && (
          <>
            <p className="text-pitch-500 text-xs uppercase tracking-wider px-1 pt-2">Pendientes de pago ({unpaid.length})</p>
            {unpaid.map(p => <ParticipantRow key={p.id} participant={p} />)}
          </>
        )}
        {paid.length > 0 && (
          <>
            <p className="text-pitch-500 text-xs uppercase tracking-wider px-1 pt-3">Pagados ({paid.length})</p>
            {paid.map(p => <ParticipantRow key={p.id} participant={p} />)}
          </>
        )}
        {!participants.length && (
          <p className="text-pitch-500 text-center py-6">Aún no hay participantes registrados</p>
        )}
      </div>

      <div className="pt-1">
        <Link
          href="/admin/pagos"
          className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          💰 Gestionar pagos y comprobantes →
        </Link>
      </div>

      {/* Vista previa de reparto */}
      {poolAmount > 0 && (
        <div className="bg-pitch-800/30 rounded-xl px-4 py-4 border border-pitch-700/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-pitch-300 text-xs uppercase tracking-wider">💰 Vista previa de reparto</p>
            <span className="text-pitch-500 text-xs">
              {paid.length} pagados · <span className="text-yellow-400 font-medium">${poolAmount.toLocaleString('es-MX')} {currency}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-pitch-800/60 rounded-lg px-3 py-2.5 text-center">
                <div className="text-pitch-400 text-xs mb-1">{n} ganador{n > 1 ? 'es' : ''}</div>
                <div className="text-white font-semibold text-sm">
                  ${(poolAmount / n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-pitch-500 text-xs">c/u</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ParticipantRow({ participant }: { participant: Participant }) {
  const date = new Date(participant.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
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
      <span className={`ml-3 flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-lg ${
        participant.inscription_paid
          ? 'bg-brand-900/40 text-brand-400'
          : 'bg-pitch-700/50 text-pitch-500'
      }`}>
        {participant.inscription_paid ? '✓ Pagado' : 'Sin pagar'}
      </span>
    </div>
  )
}
