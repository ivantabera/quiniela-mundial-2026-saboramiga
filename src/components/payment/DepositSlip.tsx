interface Props {
  beneficiary: string
  bank: string
  clabe: string
  amount: number
  currency: string
  whatsapp: string
  username: string
}

export default function DepositSlip({ beneficiary, bank, clabe, amount, currency, whatsapp, username }: Props) {
  const clabeFormatted = clabe.replace(/(\d{4})(?=\d)/g, '$1 ')
  const whatsappFormatted = whatsapp.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3')

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a2744] px-6 py-5 text-center border-b border-pitch-700">
        <p className="font-display text-xl text-brand-400 tracking-widest">SABOR A MIGA</p>
        <p className="text-pitch-400 text-xs mt-1">Quiniela Oficial · Mundial 2026</p>
      </div>

      {/* Title */}
      <div className="px-6 py-4 text-center border-b border-pitch-700/50">
        <h2 className="font-display text-2xl text-white tracking-wider">FICHA DE DEPÓSITO</h2>
        <p className="text-pitch-400 text-sm mt-1">Asegura tu lugar en la bolsa acumulada</p>
      </div>

      {/* Monto */}
      <div className="mx-6 my-5 border-2 border-brand-500/40 rounded-xl p-4 text-center">
        <p className="text-pitch-400 text-xs uppercase tracking-widest mb-1">Inscripción</p>
        <p className="font-display text-6xl text-white">${amount}</p>
        <p className="text-pitch-400 text-sm mt-1">PESOS {currency}</p>
      </div>

      {/* Datos bancarios */}
      <div className="px-6 pb-2 space-y-3">
        <div className="bg-pitch-800/60 rounded-xl px-5 py-4 space-y-3">
          <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest">
            Datos para el depósito
          </p>
          <div>
            <p className="text-pitch-500 text-xs mb-0.5">Beneficiario</p>
            <p className="text-white font-semibold">{beneficiary}</p>
          </div>
          <div>
            <p className="text-pitch-500 text-xs mb-0.5">Banco</p>
            <p className="text-white font-semibold">{bank}</p>
          </div>
          <div>
            <p className="text-pitch-500 text-xs mb-0.5">CLABE Interbancaria</p>
            <p className="font-display text-2xl text-white tracking-wider">{clabeFormatted}</p>
          </div>
          <div>
            <p className="text-pitch-500 text-xs mb-0.5">Concepto</p>
            <p className="text-white">{username} · quiniela mundial</p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-green-950/40 border border-green-700/40 rounded-xl px-5 py-4">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">
            Envía tu comprobante
          </p>
          <p className="text-pitch-400 text-xs mb-0.5">WhatsApp</p>
          <p className="font-display text-2xl text-white">{whatsappFormatted}</p>
        </div>

        <p className="text-pitch-600 text-xs text-center pb-4">
          Conserva tu comprobante hasta el final del torneo
        </p>
      </div>
    </div>
  )
}
