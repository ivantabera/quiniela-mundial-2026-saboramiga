import Link from 'next/link'

interface Props {
  paymentStatus: string
}

const BANNERS = {
  sin_iniciar: {
    wrapper: 'bg-amber-950/30 border-amber-700/40',
    text: '⚠️ Aún no has pagado tu inscripción. Sin pago no entras a la competencia oficial.',
    cta: 'Ver instrucciones de pago →',
    cta_style: 'bg-amber-700 hover:bg-amber-600 text-white',
  },
  pendiente_verificacion: {
    wrapper: 'bg-blue-950/30 border-blue-700/40',
    text: '⏳ Tu comprobante está siendo verificado. Te confirmamos a la brevedad.',
    cta: 'Ver estado del pago →',
    cta_style: 'bg-blue-800 hover:bg-blue-700 text-white',
  },
  rechazado: {
    wrapper: 'bg-red-950/30 border-red-700/40',
    text: '❌ Tu pago fue rechazado. Contáctanos por WhatsApp para resolverlo.',
    cta: 'Ver instrucciones →',
    cta_style: 'bg-red-800 hover:bg-red-700 text-white',
  },
} as const

export default function PaymentStatusBanner({ paymentStatus }: Props) {
  if (paymentStatus === 'confirmado' || paymentStatus === 'reembolsado') return null

  const banner = BANNERS[paymentStatus as keyof typeof BANNERS]
  if (!banner) return null

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${banner.wrapper}`}>
      <p className="text-sm text-pitch-200">{banner.text}</p>
      <Link
        href="/dashboard/pago"
        className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${banner.cta_style}`}
      >
        {banner.cta}
      </Link>
    </div>
  )
}
