'use client'

import { useState, useEffect } from 'react'
import { formatCountdown } from '@/lib/utils/quiniela-status'
import type { QuinielaStatus } from '@/lib/utils/quiniela-status'

interface Props {
  closeDate: string
  status: QuinielaStatus
  compact?: boolean
}

export default function CountdownBanner({ closeDate, status, compact = false }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor((new Date(closeDate).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        const next = Math.max(0, Math.floor((new Date(closeDate).getTime() - Date.now()) / 1000))
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [closeDate])

  const { days, hours, minutes, seconds } = formatCountdown(secondsLeft)

  const bannerColor =
    status === 'closing_soon' ? 'border-red-700/50 bg-red-950/20' :
    status === 'warning'      ? 'border-orange-700/50 bg-orange-950/20' :
                                'border-pitch-700/40 bg-pitch-800/30'

  const textColor =
    status === 'closing_soon' ? 'text-red-300' :
    status === 'warning'      ? 'text-orange-300' :
                                'text-pitch-200'

  if (compact) {
    return (
      <div className={`flex items-center gap-6 justify-center rounded-xl border px-4 py-3 ${bannerColor}`}>
        <span className={`text-xs uppercase tracking-widest ${textColor}`}>Cierre en</span>
        {[
          { v: days,    l: 'días'  },
          { v: hours,   l: 'hrs'   },
          { v: minutes, l: 'min'   },
          { v: seconds, l: 'seg'   },
        ].map(({ v, l }) => (
          <div key={l} className="countdown-digit">
            <span className="countdown-num">{String(v).padStart(2, '0')}</span>
            <span className="countdown-label">{l}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border px-6 py-5 ${bannerColor}`}>
      {status === 'warning' && (
        <p className={`text-xs uppercase tracking-widest mb-3 text-center ${textColor}`}>
          ⚠️ Faltan menos de 72 horas — ¡completa tu quiniela!
        </p>
      )}
      {status === 'closing_soon' && (
        <p className={`text-xs uppercase tracking-widest mb-3 text-center ${textColor} animate-pulse`}>
          🚨 ¡ÚLTIMA LLAMADA! La quiniela cierra en menos de 1 hora
        </p>
      )}
      <div className="flex items-center justify-center gap-3 md:gap-6">
        {[
          { v: days,    l: 'días'     },
          { v: hours,   l: 'horas'    },
          { v: minutes, l: 'minutos'  },
          { v: seconds, l: 'segundos' },
        ].map(({ v, l }) => (
          <div key={l} className="countdown-digit">
            <span className="countdown-num">{String(v).padStart(2, '0')}</span>
            <span className="countdown-label">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
