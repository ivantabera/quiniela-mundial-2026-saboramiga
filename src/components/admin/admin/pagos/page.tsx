import { createServerSupabaseClient } from '@/lib/supabase/server'
import PagosClient from './PagosClient'

export const dynamic = 'force-dynamic'

export default async function PagosPage() {
  const supabase = await createServerSupabaseClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, inscription_paid, created_at')
    .order('inscription_paid', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: config } = await supabase
    .from('quiniela_config')
    .select('pool_amount, currency')
    .single()

  const paid    = profiles?.filter(p => p.inscription_paid).length ?? 0
  const pending = profiles?.filter(p => !p.inscription_paid).length ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">💰 Gestión de Pagos</h1>
        <p className="text-pitch-400">Marca quién ha pagado su inscripción</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-white">{profiles?.length ?? 0}</div>
          <div className="text-pitch-400 text-sm mt-1">Total registrados</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-pitch-200">{paid}</div>
          <div className="text-pitch-400 text-sm mt-1">✅ Pagos recibidos</div>
        </div>
        <div className="card p-5 text-center">
          <div className="font-display text-4xl text-orange-400">{pending}</div>
          <div className="text-pitch-400 text-sm mt-1">⏳ Pendientes de pago</div>
        </div>
      </div>

      {/* Bolsa actual */}
      {config && (
        <div className="card p-4 flex items-center justify-between">
          <span className="text-pitch-300 font-semibold">Bolsa acumulada</span>
          <span className="font-display text-2xl text-brand-400">
            ${config.pool_amount.toLocaleString('es-MX')} {config.currency}
          </span>
        </div>
      )}

      <PagosClient profiles={profiles ?? []} />
    </div>
  )
}
