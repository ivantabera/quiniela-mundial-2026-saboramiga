interface Props {
  amount: number
  currency: string
  large?: boolean
  showReparto?: boolean
  tiebreakEnabled?: boolean
}

export default function PoolDisplay({
  amount,
  currency,
  large = false,
  showReparto = false,
  tiebreakEnabled = true,
}: Props) {
  const fmt = (n: number) =>
    n.toLocaleString('es-MX', {
      style: 'currency',
      currency: currency === 'MXN' ? 'MXN' : 'USD',
      minimumFractionDigits: 0,
    })

  const WINNERS = [1, 2, 3, 4]

  return (
    <div className="inline-block w-full max-w-lg">
      {/* Bolsa acumulada */}
      <div className={`${large ? 'py-6 px-10' : 'py-4 px-6'} pool-gradient rounded-2xl shadow-lg shadow-brand-900/40 text-center`}>
        <p className="text-white/70 text-xs uppercase tracking-widest mb-1">💰 Bolsa acumulada</p>
        <p className={`font-display text-white leading-none ${large ? 'text-6xl' : 'text-4xl'}`}>
          {fmt(amount)} <span className="text-white/60 text-2xl">{currency}</span>
        </p>
      </div>

      {/* Reparto por escenario de ganadores */}
      {showReparto && amount > 0 && (
        <div className="mt-3 bg-pitch-900/80 border border-pitch-700/50 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-pitch-700/40 flex items-center justify-between">
            <span className="text-pitch-300 text-xs uppercase tracking-wider font-semibold">
              Regla de reparto
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              tiebreakEnabled
                ? 'text-brand-400 border-brand-700/50 bg-brand-900/30'
                : 'text-pitch-500 border-pitch-700 bg-pitch-800/50'
            }`}>
              {tiebreakEnabled ? '⚖️ Empate dividido' : '🏆 Un solo ganador'}
            </span>
          </div>

          <div className="grid grid-cols-4 divide-x divide-pitch-700/40">
            {WINNERS.map(n => {
              const perWinner = amount / n
              return (
                <div key={n} className="px-3 py-3 text-center">
                  <div className="text-pitch-500 text-[10px] uppercase tracking-wider mb-1">
                    {n} {n === 1 ? 'ganador' : 'ganadores'}
                  </div>
                  <div className="text-white font-semibold text-sm leading-tight">
                    {fmt(perWinner)}
                  </div>
                  <div className="text-pitch-600 text-[10px] mt-0.5">c/u</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
