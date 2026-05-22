import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalUsers },
    { count: paidUsers },
    { count: totalPicks },
    { data: config },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('inscription_paid', true),
    supabase.from('picks').select('*', { count: 'exact', head: true }),
    supabase.from('quiniela_config').select('*').single(),
    supabase.from('change_logs').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const pendingPayments = (totalUsers ?? 0) - (paidUsers ?? 0)
  const poolAmount = config?.pool_amount ?? 0
  const daysLeft = config?.close_date
    ? Math.max(0, Math.floor((new Date(config.close_date).getTime() - Date.now()) / 86400000))
    : 0

  const stats = [
    { icon: '👥', label: 'Participantes',   value: totalUsers ?? 0,    color: 'text-white',        href: '/admin/participantes' },
    { icon: '✅', label: 'Pagos recibidos', value: paidUsers ?? 0,     color: 'text-pitch-300',    href: '/admin/pagos' },
    { icon: '⏳', label: 'Pagos pendientes',value: pendingPayments,     color: 'text-orange-400',   href: '/admin/pagos' },
    { icon: '⚽', label: 'Picks totales',   value: totalPicks ?? 0,    color: 'text-white',        href: '/admin/participantes' },
    { icon: '💰', label: 'Bolsa total',     value: `$${poolAmount.toLocaleString('es-MX')}`, color: 'text-brand-400', href: '/admin/config' },
    { icon: '📅', label: 'Días al cierre',  value: daysLeft,           color: daysLeft < 3 ? 'text-red-400' : 'text-white', href: '/admin/config' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">Panel Administrador</h1>
        <p className="text-pitch-400">Quiniela Mundial 2026 · Sabor a Miga</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="card-hover p-5 text-center group">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
            <div className="text-pitch-400 text-xs mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/participantes', icon: '👥', title: 'Participantes', desc: 'Ver todos los registrados' },
          { href: '/admin/pagos',         icon: '💰', title: 'Gestionar Pagos', desc: 'Marcar quién pagó su inscripción' },
          { href: '/admin/resultados',    icon: '⚽', title: 'Cargar Resultados', desc: 'Ingresar marcadores de partidos' },
          { href: '/admin/config',        icon: '⚙️', title: 'Configuración', desc: 'Bolsa, fechas y reglas' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="card-hover p-6 flex items-center gap-4 group">
            <span className="text-4xl">{item.icon}</span>
            <div>
              <div className="font-semibold text-white group-hover:text-pitch-200">{item.title}</div>
              <div className="text-pitch-400 text-sm">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Logs recientes */}
      <div className="card p-6">
        <h2 className="font-display text-xl text-white mb-4 tracking-wide">📋 Actividad reciente</h2>
        <div className="space-y-2">
          {recentLogs?.map(log => (
            <div key={log.id} className="flex items-center justify-between bg-pitch-800/40 rounded-lg px-4 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.action.includes('blocked') ? 'bg-red-400' :
                  log.action.includes('admin')   ? 'bg-brand-400' : 'bg-pitch-400'
                }`} />
                <span className="text-pitch-300">{log.action}</span>
              </div>
              <span className="text-pitch-600 text-xs flex-shrink-0 ml-4">
                {new Date(log.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
          {!recentLogs?.length && <p className="text-pitch-500 text-center py-4">Sin actividad registrada</p>}
        </div>
      </div>
    </div>
  )
}
