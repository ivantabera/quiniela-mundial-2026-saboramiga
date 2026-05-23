'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { QuinielaConfig } from '@/types/database'

interface Props {
  config: QuinielaConfig | null
}

export default function AdminConfigForm({ config }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    close_date:       config?.close_date?.slice(0, 16) ?? '',
    pool_amount:      config?.pool_amount ?? 0,
    is_manually_open: config?.is_manually_open ?? false,
    tiebreak_enabled: config?.tiebreak_enabled ?? true,
    currency:         config?.currency ?? 'MXN',
  })

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        close_date: new Date(form.close_date).toISOString(),
      }),
    })
    const json = await res.json()
    if (res.ok) {
      toast.success('✅ Configuración guardada')
    } else {
      toast.error(json.error ?? 'Error al guardar')
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Fecha de cierre */}
      <div>
        <label className="block text-sm text-pitch-300 mb-2">
          📅 Fecha y hora de cierre (local)
        </label>
        <input
          type="datetime-local"
          className="input w-full"
          value={form.close_date}
          onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}
        />
        <p className="text-pitch-500 text-xs mt-1">Se convierte automáticamente a UTC al guardar</p>
      </div>

      {/* Bolsa */}
      <div>
        <label className="block text-sm text-pitch-300 mb-2">💰 Bolsa acumulada ({form.currency})</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            className="input flex-1"
            value={form.pool_amount}
            onChange={e => setForm(f => ({ ...f, pool_amount: Number(e.target.value) }))}
          />
          <select
            className="input w-24"
            value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <label className="flex items-center justify-between bg-pitch-800/50 rounded-xl px-4 py-3 cursor-pointer">
          <div>
            <div className="text-white text-sm font-semibold">🔓 Forzar quiniela abierta</div>
            <div className="text-pitch-400 text-xs">Sobreescribe la fecha de cierre temporalmente</div>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-brand-500"
            checked={form.is_manually_open}
            onChange={e => setForm(f => ({ ...f, is_manually_open: e.target.checked }))}
          />
        </label>

        <label className="flex items-center justify-between bg-pitch-800/50 rounded-xl px-4 py-3 cursor-pointer">
          <div>
            <div className="text-white text-sm font-semibold">⚖️ Habilitar regla de empate</div>
            <div className="text-pitch-400 text-xs">Divide la bolsa entre todos los ganadores empatados</div>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-brand-500"
            checked={form.tiebreak_enabled}
            onChange={e => setForm(f => ({ ...f, tiebreak_enabled: e.target.checked }))}
          />
        </label>
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button onClick={handleSave} disabled={loading} className="btn-primary px-8">
          {loading ? 'Guardando...' : '💾 Guardar configuración'}
        </button>
      </div>
    </div>
  )
}
