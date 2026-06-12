'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface RecalcResult {
  ok: boolean
  matchesProcessed: number
  picksRecalculated: number
  standingsRows: number
  errors: string[]
}

export default function AdminRecalculate() {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<RecalcResult | null>(null)

  async function recalculate() {
    if (!confirm('¿Recalcular puntos y rankings desde cero?')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/recalculate', { method: 'POST' })
      const data: RecalcResult = await res.json()
      setResult(data)
      if (data.ok) {
        toast.success(`Rankings actualizados · ${data.standingsRows} participantes`)
      } else {
        toast.error(`Completado con ${data.errors.length} errores`)
      }
    } catch (e) {
      toast.error('Error de red: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={recalculate}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all disabled:opacity-50"
      >
        {loading ? '⟳ Calculando...' : '🔄 Recalcular Rankings'}
      </button>

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm space-y-1 ${result.ok ? 'bg-pitch-800/60' : 'bg-red-950/40 border border-red-800/50'}`}>
          <div className="text-pitch-300">
            <span className="text-white font-semibold">{result.matchesProcessed}</span> partidos finalizados ·{' '}
            <span className="text-white font-semibold">{result.picksRecalculated}</span> picks recalculados ·{' '}
            <span className="text-white font-semibold">{result.standingsRows}</span> en ranking
          </div>
          {result.errors.length > 0 && (
            <ul className="text-red-400 text-xs space-y-0.5 mt-2">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
