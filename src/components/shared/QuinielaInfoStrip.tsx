'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getQuinielaState } from '@/lib/utils/quiniela-status'
import CountdownBanner from './CountdownBanner'

interface Config {
  close_date: string
  is_manually_open: boolean
  pool_amount: number
  currency: string
}

export default function QuinielaInfoStrip() {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('quiniela_config')
      .select('close_date, is_manually_open, pool_amount, currency')
      .single()
      .then(({ data }) => { if (data) setConfig(data) })
  }, [])

  if (!config) return null

  const state = getQuinielaState(config.close_date, config.is_manually_open)

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between bg-pitch-800/60 border border-pitch-700/50 rounded-xl px-4 py-3">
        <span className="text-pitch-400 text-sm">Bolsa asegurada</span>
        <span className="font-display text-xl text-brand-400">
          ${Number(config.pool_amount).toLocaleString('es-MX')} {config.currency}
        </span>
      </div>
      {state.isOpen && (
        <CountdownBanner closeDate={config.close_date} status={state.status} compact />
      )}
      {!state.isOpen && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
          🔒 La quiniela está cerrada
        </div>
      )}
    </div>
  )
}
