'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  paymentStatus: string
  whatsapp: string
  amount: number
  username: string
  fullName: string
  currency: string
}

export default function PaymentActions({ paymentStatus, whatsapp, amount, username, fullName, currency }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(paymentStatus)

  const message = encodeURIComponent(
    `Hola Sabor a Miga, te envío mi comprobante de pago de la quiniela.\n\n` +
    `Usuario: ${username}\n` +
    `Nombre: ${fullName}\n` +
    `Monto: $${amount} ${currency}`
  )
  const whatsappUrl = `https://wa.me/52${whatsapp}?text=${message}`

  async function handleMarkSubmitted() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/mark-submitted', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setStatus('pendiente_verificacion')
        toast.success('¡Listo! Te avisamos cuando confirmemos tu pago.', { duration: 6000 })
      } else {
        toast.error(json.error ?? 'Ocurrió un error')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(false)
  }

  if (status === 'confirmado') {
    return (
      <div className="card p-6 border-green-700/40 bg-green-950/20 text-center space-y-2">
        <div className="text-5xl">✅</div>
        <p className="font-display text-xl text-white">¡Pago confirmado!</p>
        <p className="text-pitch-400 text-sm">Estás registrado en la competencia oficial.</p>
      </div>
    )
  }

  if (status === 'pendiente_verificacion') {
    return (
      <div className="card p-6 border-amber-700/40 bg-amber-950/20 text-center space-y-2">
        <div className="text-5xl">⏳</div>
        <p className="font-display text-xl text-white">Comprobante recibido</p>
        <p className="text-pitch-400 text-sm">
          Estamos verificando tu pago. Te confirmamos a la brevedad.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-5">
      {status === 'rechazado' && (
        <div className="bg-red-950/40 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
          Tu pago anterior fue rechazado. Contáctanos por WhatsApp y vuelve a intentarlo.
        </div>
      )}

      <div className="space-y-3">
        <p className="text-pitch-300 text-sm font-semibold">Pasos a seguir:</p>
        {[
          'Realiza la transferencia con los datos de la ficha de arriba.',
          'Abre WhatsApp y envía el screenshot de tu comprobante.',
          'Regresa aquí y presiona el botón de abajo.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-pitch-400">
            <span className="w-6 h-6 rounded-full bg-pitch-700 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors text-sm"
      >
        <span className="text-lg">💬</span>
        Enviar comprobante por WhatsApp
      </a>

      <button
        onClick={handleMarkSubmitted}
        disabled={loading}
        className="btn-primary w-full py-3 text-sm disabled:opacity-50"
      >
        {loading ? 'Guardando...' : '✅ Ya envié mi comprobante'}
      </button>
    </div>
  )
}
