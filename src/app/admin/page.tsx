import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import AdminConfigForm from '@/components/admin/AdminConfigForm'
import AdminMatchResults from '@/components/admin/AdminMatchResults'
import AdminParticipants from '@/components/admin/AdminParticipants'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/auth/login')

  const supabase = createAdminSupabaseClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  console.log('[ADMIN] user.id:', user.id)
  console.log('[ADMIN] profile:', profile)
  console.log('[ADMIN] profileError:', profileError)

  if (!profile?.is_admin) redirect('/dashboard')

  const [configRes, statsRes, logsRes] = await Promise.all([
    supabase.from('quiniela_config').select('*').single(),
    supabase.from('standings').select('user_id', { count: 'exact', head: true }),
    supabase.from('change_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div className="min-h-screen">
      {/* Header admin */}
      <header className="border-b border-pitch-800 bg-pitch-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
          <span className="font-display text-xl text-brand-400 tracking-widest">⚙️ PANEL ADMIN</span>
          <Link href="/dashboard" className="text-sm text-pitch-400 hover:text-white">
            ← Volver al dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
        <div>
          <h1 className="font-display text-4xl text-white">Panel Administrador</h1>
          <p className="text-pitch-400">Quiniela Mundial 2026 · Sabor a Miga</p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Participantes', value: statsRes.count ?? 0, icon: '👥' },
            { label: 'Bolsa total', value: `$${(configRes.data?.pool_amount ?? 0).toLocaleString('es-MX')}`, icon: '💰' },
            { label: 'Cierre', value: configRes.data?.close_date ? new Date(configRes.data.close_date).toLocaleDateString('es-MX') : '—', icon: '📅' },
            { label: 'Logs', value: logsRes.data?.length ?? 0, icon: '📋' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-display text-2xl text-white">{s.value}</div>
              <div className="text-pitch-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Participantes y pagos */}
        <div className="card p-6">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wide">👥 Participantes y Pagos</h2>
          <AdminParticipants />
        </div>

        {/* Configuración quiniela */}
        <div className="card p-6">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wide">⚙️ Configuración de la Quiniela</h2>
          <AdminConfigForm config={configRes.data} />
        </div>

        {/* Resultados de partidos */}
        <div className="card p-6">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wide">⚽ Cargar Resultados</h2>
          <AdminMatchResults />
        </div>

        {/* Logs recientes */}
        <div className="card p-6">
          <h2 className="font-display text-2xl text-white mb-4 tracking-wide">📋 Registro de Cambios</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logsRes.data?.map(log => (
              <div key={log.id} className="flex items-center justify-between bg-pitch-800/50 rounded-lg px-4 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    log.action.includes('blocked') ? 'bg-red-400' : 'bg-pitch-400'
                  }`} />
                  <span className="text-pitch-300">{log.action}</span>
                </div>
                <span className="text-pitch-600 text-xs">
                  {new Date(log.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                </span>
              </div>
            ))}
            {!logsRes.data?.length && (
              <p className="text-pitch-500 text-center py-4">No hay registros todavía</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
