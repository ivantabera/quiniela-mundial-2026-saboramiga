import { createServerSupabaseClient } from '@/lib/supabase/server'
import ConfigClient from './ConfigClient'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const supabase = await createServerSupabaseClient()
  const { data: config } = await supabase.from('quiniela_config').select('*').single()

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">⚙️ Configuración</h1>
        <p className="text-pitch-400">Ajusta las reglas y parámetros de la quiniela</p>
      </div>
      <ConfigClient config={config} />
    </div>
  )
}
