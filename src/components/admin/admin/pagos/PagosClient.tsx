'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string
  full_name: string | null
  inscription_paid: boolean
  created_at: string
}

export default function PagosClient({ profiles: initial }: { profiles: Profile[] }) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')

  async function togglePago(id: string, currentStatus: boolean) {
    setLoading(id)
    const newStatus = !currentStatus
    const { error } = await supabase
      .from('profiles')
      .update({ inscription_paid: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, inscription_paid: newStatus } : p))
      toast.success(newStatus ? '✅ Pago registrado' : '↩️ Pago revertido')
    }
    setLoading(null)
  }

  async function markAllPaid() {
    const pending = profiles.filter(p => !p.inscription_paid)
    if (!pending.length) { toast('Ya todos han pagado ✅'); return }
    if (!confirm(`¿Marcar ${pending.length} participantes como pagados?`)) return

    setLoading('all')
    const { error } = await supabase
      .from('profiles')
      .update({ inscription_paid: true })
      .in('id', pending.map(p => p.id))

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p => ({ ...p, inscription_paid: true })))
      toast.success(`✅ ${pending.length} pagos registrados`)
    }
    setLoading(null)
  }

  const filtered = profiles
    .filter(p => {
      if (filter === 'paid')    return p.inscription_paid
      if (filter === 'pending') return !p.inscription_paid
      return true
    })
    .filter(p =>
      !search ||
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      (p.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="card overflow-hidden">
      {/* Controles */}
      <div className="p-4 border-b border-pitch-700/50 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o usuario..."
          className="input flex-1 py-2 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {(['all', 'paid', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-pitch-600 text-white'
                  : 'bg-pitch-800 text-pitch-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'paid' ? '✅ Pagados' : '⏳ Pendientes'}
            </button>
          ))}
        </div>
        <button
          onClick={markAllPaid}
          disabled={loading === 'all'}
          className="btn-green text-sm py-2 px-4 whitespace-nowrap"
        >
          {loading === 'all' ? 'Guardando...' : '✅ Marcar todos como pagados'}
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pitch-700/50 text-pitch-400 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3">Participante</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">Registro</th>
              <th className="text-center px-5 py-3">Estado</th>
              <th className="text-center px-5 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(profile => (
              <tr key={profile.id} className={`border-b border-pitch-800/50 transition-colors hover:bg-pitch-800/20 ${
                profile.inscription_paid ? '' : 'border-l-2 border-l-orange-600'
              }`}>
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
                <td className="px-5 py-4 hidden sm:table-cell">
                  <span className="text-pitch-400 text-sm">
                    {new Date(profile.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.inscription_paid
                      ? 'bg-pitch-800 text-pitch-200 border border-pitch-600'
                      : 'bg-orange-950/50 text-orange-300 border border-orange-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.inscription_paid ? 'bg-pitch-400' : 'bg-orange-400'}`} />
                    {profile.inscription_paid ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => togglePago(profile.id, profile.inscription_paid)}
                    disabled={loading === profile.id}
                    className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                      profile.inscription_paid
                        ? 'bg-pitch-800 text-pitch-400 hover:bg-red-950/50 hover:text-red-300 border border-pitch-700'
                        : 'bg-pitch-700 text-white hover:bg-pitch-600 border border-pitch-600'
                    }`}
                  >
                    {loading === profile.id
                      ? '...'
                      : profile.inscription_paid
                      ? '↩️ Revertir'
                      : '✅ Marcar pagado'}
                  </button>
                </td>
              </tr>
            ))}
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
