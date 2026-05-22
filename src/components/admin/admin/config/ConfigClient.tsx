'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Config {
  id: string
  close_date: string
  is_manually_open: boolean
  pool_amount: number
  currency: string
  tiebreak_enabled: boolean
  tournament_name: string
}

export default function ConfigClient({ config }: { config: Config | null }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    close_date:       config?.close_date?.slice(0, 16) ?? '2026-06-10T09:00',
    pool_amount:      config?.pool_amount ?? 0,
    currency:         config?.currency ?? 'MXN',
    is_manually_open: config?.is_manually_open ?? false,
    tiebreak_enabled: config?.tiebreak_enabled ?? true,
    tournament_name:  config?.tournament_name ?? 'Mundial 2026',
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

  const prizeSimulation = [1, 2, 3, 4, 5].map(n => ({
    ganadores: n,
    porGanador: (form.pool_amount / n).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
  }))

  return (
    <div className="space-y-6">

      {/* Estado de la quiniela */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">🔒 Estado de la Quiniela</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-pitch-300 mb-2">
              📅 Fecha y hora de cierre (hora local)
            </label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.close_date}
              onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}
            />
            <p className="text-pitch-500 text-xs mt-1">Se guarda en UTC automáticamente</p>
          </div>

          <label className="flex items-center justify-between bg-pitch-800/50 rounded-xl px-4 py-4 cursor-pointer hover:bg-pitch-800 transition-colors">
            <div>
              <div className="text-white font-semibold">🔓 Forzar quiniela abierta (Admin)</div>
              <div className="text-pitch-400 text-sm mt-0.5">Sobreescribe la fecha de cierre temporalmente</div>
            </div>
            <div className="relative flex-shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.is_manually_open}
                onChange={e => setForm(f => ({ ...f, is_manually_open: e.target.checked }))}
              />
              <div
                onClick={() => setForm(f => ({ ...f, is_manually_open: !f.is_manually_open }))}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${form.is_manually_open ? 'bg-pitch-600' : 'bg-pitch-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${form.is_manually_open ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Bolsa */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">💰 Bolsa de Premios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-pitch-300 mb-2">Monto total</label>
            <input
              type="number"
              min={0}
              step={100}
              className="input w-full"
              value={form.pool_amount}
              onChange={e => setForm(f => ({ ...f, pool_amount: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm text-pitch-300 mb-2">Moneda</label>
            <select
              className="input w-full"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              <option value="MXN">MXN — Peso Mexicano</option>
              <option value="USD">USD — Dólar</option>
            </select>
          </div>
        </div>

        {/* Simulador de reparto */}
        <div className="bg-pitch-800/40 rounded-xl p-4">
          <p className="text-pitch-300 text-xs uppercase tracking-wider mb-3">Simulador de reparto</p>
          <div className="grid grid-cols-5 gap-2">
            {prizeSimulation.map(({ ganadores, porGanador }) => (
              <div key={ganadores} className="text-center bg-pitch-800 rounded-lg py-2 px-1">
                <div className="text-pitch-400 text-xs mb-1">{ganadores} {ganadores === 1 ? 'ganador' : 'ganadores'}</div>
                <div className="text-white text-xs font-bold">${porGanador}</div>
                <div className="text-pitch-500 text-[10px]">{form.currency} c/u</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reglas */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">📋 Reglas</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between bg-pitch-800/50 rounded-xl px-4 py-4 cursor-pointer hover:bg-pitch-800 transition-colors">
            <div>
              <div className="text-white font-semibold">⚖️ Regla de empate</div>
              <div className="text-pitch-400 text-sm mt-0.5">Divide la bolsa en partes iguales entre todos los ganadores empatados</div>
            </div>
            <div
              onClick={() => setForm(f => ({ ...f, tiebreak_enabled: !f.tiebreak_enabled }))}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4 ${form.tiebreak_enabled ? 'bg-pitch-600' : 'bg-pitch-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${form.tiebreak_enabled ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </label>

          <div>
            <label className="block text-sm text-pitch-300 mb-2">Nombre del torneo</label>
            <input
              type="text"
              className="input w-full"
              value={form.tournament_name}
              onChange={e => setForm(f => ({ ...f, tournament_name: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary px-10 py-4 text-lg"
        >
          {loading ? 'Guardando...' : '💾 Guardar configuración'}
        </button>
      </div>
    </div>
  )
}
