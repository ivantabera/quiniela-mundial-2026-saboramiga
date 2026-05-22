import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/admin',               label: '📊 Resumen'       },
  { href: '/admin/participantes', label: '👥 Participantes' },
  { href: '/admin/pagos',         label: '💰 Pagos'         },
  { href: '/admin/resultados',    label: '⚽ Resultados'    },
  { href: '/admin/config',        label: '⚙️ Config'        },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAdminSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin, username').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-pitch-800 bg-pitch-950/95 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-brand-400 tracking-widest">⚙️ ADMIN</span>
              <span className="text-pitch-600 text-xs hidden sm:block">· {profile.username}</span>
            </div>
            <Link href="/dashboard" className="text-sm text-pitch-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {NAV.map(item => (
              <Link key={item.href} href={item.href}
                className="flex-shrink-0 px-4 py-2 text-sm text-pitch-400 hover:text-white hover:bg-pitch-800/60 rounded-lg transition-colors whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 max-w-7xl py-8">
        {children}
      </main>
      <footer className="border-t border-pitch-800 py-3 text-center text-pitch-600 text-xs">
        Panel Admin · Quiniela Mundial 2026 · Sabor a Miga
      </footer>
    </div>
  )
}
