'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  username: string
  full_name: string | null
  inscription_paid: boolean
  payment_status: string
  payment_submitted_at: string | null
  payment_confirmed_at: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  sin_iniciar:           { label: 'Sin iniciar',   badge: 'bg-pitch-800 text-pitch-400 border-pitch-700' },
  pendiente_verificacion:{ label: 'Por verificar', badge: 'bg-amber-950/60 text-amber-300 border-amber-700' },
  confirmado:            { label: 'Confirmado',    badge: 'bg-green-950/60 text-green-300 border-green-700' },
  rechazado:             { label: 'Rechazado',     badge: 'bg-red-950/60 text-red-300 border-red-700' },
}

const STATUS_ORDER: Record<string, number> = {
  pendiente_verificacion: 0,
  rechazado:              1,
  sin_iniciar:            2,
  confirmado:             3,
}

type Filter = 'all' | 'pendiente_verificacion' | 'confirmado' | 'sin_iniciar' | 'rechazado'

export default function PagosAdminClient({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles]       = useState(initial)
  const [loading, setLoading]         = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<Filter>('all')
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/payments')
    if (res.ok) setProfiles(await res.json())
  }, [])

  async function confirm(id: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/payments/${id}/confirm`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        toast.success('✅ Pago confirmado')
        await reload()
      } else {
        toast.error(json.error ?? 'Error al confirmar')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(null)
  }

  async function resetPassword() {
    if (!resetTarget) return
    if (newPassword.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setLoading('reset')
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(`Contraseña de ${resetTarget.username} actualizada`)
        setResetTarget(null)
        setNewPassword('')
      } else {
        toast.error(json.error ?? 'Error al resetear')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(null)
  }

  async function reject(id: string) {
    setLoading(id + '_reject')
    try {
      const res = await fetch(`/api/admin/payments/${id}/reject`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        toast.success('❌ Pago rechazado')
        await reload()
      } else {
        toast.error(json.error ?? 'Error al rechazar')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(null)
  }

  const filtered = profiles
    .filter(p => filter === 'all' || p.payment_status === filter)
    .filter(p =>
      !search ||
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      (p.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (STATUS_ORDER[a.payment_status] ?? 9) - (STATUS_ORDER[b.payment_status] ?? 9))

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',                   label: 'Todos' },
    { key: 'pendiente_verificacion',label: '⏳ Por verificar' },
    { key: 'confirmado',            label: '✅ Confirmados' },
    { key: 'sin_iniciar',           label: '— Sin iniciar' },
    { key: 'rechazado',             label: '❌ Rechazados' },
  ]

  return (
    <div className="card overflow-hidden">

      {/* Modal reset contraseña */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <h3 className="font-display text-xl text-white">🔐 Resetear contraseña</h3>
            <p className="text-pitch-400 text-sm">Usuario: <span className="text-white font-semibold">@{resetTarget.username}</span></p>
            <div>
              <label className="block text-sm text-pitch-300 mb-2">Nueva contraseña</label>
              <input
                type="text"
                className="input w-full"
                placeholder="mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetPassword}
                disabled={loading === 'reset'}
                className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
              >
                {loading === 'reset' ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setResetTarget(null); setNewPassword('') }}
                className="flex-1 py-2.5 text-sm rounded-xl bg-pitch-800 text-pitch-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Controles */}
      <div className="p-4 border-b border-pitch-700/50 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o usuario..."
          className="input flex-1 py-2 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={reload}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-pitch-800 text-pitch-400 hover:text-white transition-all whitespace-nowrap"
        >
          🔄 Actualizar
        </button>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-pitch-600 text-white'
                  : 'bg-pitch-800 text-pitch-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3">Participante</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Comprobante enviado</th>
              <th className="text-center px-5 py-3">Estado</th>
              <th className="text-center px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(profile => {
              const s = STATUS_LABEL[profile.payment_status] ?? STATUS_LABEL.sin_iniciar
              const isPending = profile.payment_status === 'pendiente_verificacion'
              return (
                <tr
                  key={profile.id}
                  className={`border-b border-pitch-800/50 transition-colors hover:bg-pitch-800/20 ${
                    isPending ? 'border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-pitch-700 flex items-center justify-center text-sm font-bold text-pitch-200 flex-shrink-0">
                        {profile.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{profile.username}</div>
                        <div className="text-pitch-500 text-xs">{profile.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-pitch-400 text-sm">
                      {profile.payment_submitted_at
                        ? new Date(profile.payment_submitted_at).toLocaleString('es-MX', {
                            dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City',
                          })
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {isPending && (
                        <>
                          <button
                            onClick={() => confirm(profile.id)}
                            disabled={loading === profile.id}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-green-800 hover:bg-green-700 text-white transition-all disabled:opacity-50"
                          >
                            {loading === profile.id ? '...' : '✅ Confirmar'}
                          </button>
                          <button
                            onClick={() => reject(profile.id)}
                            disabled={loading === profile.id + '_reject'}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-pitch-800 hover:bg-red-950/60 hover:text-red-300 text-pitch-400 border border-pitch-700 transition-all disabled:opacity-50"
                          >
                            {loading === profile.id + '_reject' ? '...' : '❌ Rechazar'}
                          </button>
                        </>
                      )}
                      {!isPending && profile.payment_status === 'confirmado' && (
                        <span className="text-pitch-600 text-xs">
                          {profile.payment_confirmed_at
                            ? new Date(profile.payment_confirmed_at).toLocaleDateString('es-MX', { dateStyle: 'short' })
                            : 'Confirmado'}
                        </span>
                      )}
                      {!isPending && profile.payment_status !== 'confirmado' && (
                        <span className="text-pitch-700 text-xs">—</span>
                      )}
                      <button
                        onClick={() => setResetTarget(profile)}
                        className="text-xs px-2 py-1.5 rounded-lg text-pitch-600 hover:text-pitch-300 transition-colors"
                        title="Resetear contraseña"
                      >
                        🔐
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-pitch-500">
                  No hay participantes con ese filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
