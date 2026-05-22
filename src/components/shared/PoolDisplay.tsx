interface Props {
  amount: number
  currency: string
  large?: boolean
}

export default function PoolDisplay({ amount, currency, large = false }: Props) {
  const formatted = amount.toLocaleString('es-MX', {
    style: 'currency', currency: currency === 'MXN' ? 'MXN' : 'USD',
    minimumFractionDigits: 0,
  })

  return (
    <div className={`inline-block ${large ? 'py-6 px-10' : 'py-4 px-6'} pool-gradient rounded-2xl shadow-lg shadow-brand-900/40`}>
      <p className="text-white/70 text-xs uppercase tracking-widest mb-1">💰 Bolsa acumulada</p>
      <p className={`font-display text-white leading-none ${large ? 'text-6xl' : 'text-4xl'}`}>
        {formatted} <span className="text-white/60 text-2xl">{currency}</span>
      </p>
    </div>
  )
}
