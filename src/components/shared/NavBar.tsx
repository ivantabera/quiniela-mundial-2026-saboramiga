'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Props {
  username: string
  fullName: string
  isAdmin: boolean
  avatarUrl?: string | null
}

const NAV_LINKS = [
  { href: '/dashboard',          label: '🏠 Inicio'   },
  { href: '/dashboard/quiniela', label: '⚽ Quiniela' },
  { href: '/dashboard/rankings', label: '🏆 Rankings' },
  { href: '/dashboard/perfil',   label: '👤 Perfil'   },
]

export default function NavBar({ username, fullName, isAdmin, avatarUrl }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('¡Hasta pronto!')
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-pitch-800/80 bg-pitch-950/90 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo-crema.png" alt="Sabor a Miga" width={36} height={36} className="rounded-full" />
            <span className="font-display text-xl text-white tracking-widest hidden sm:block">MUNDIAL 2026</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-pitch-700 text-white'
                    : 'text-pitch-400 hover:text-white hover:bg-pitch-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-brand-700 text-white'
                    : 'text-brand-400 hover:text-white hover:bg-brand-900/50'
                }`}
              >
                ⚙️ Admin
              </Link>
            )}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/perfil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-pitch-800 ring-1 ring-brand-500/50 flex-shrink-0">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={username} width={28} height={28} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                    {username[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-pitch-400 text-sm">{username}</span>
            </Link>
            <button
              onClick={signOut}
              className="text-xs text-pitch-500 hover:text-white border border-pitch-700 hover:border-pitch-500 px-3 py-1.5 rounded-lg transition-all"
            >
              Salir
            </button>
          </div>

        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === link.href
                  ? 'bg-pitch-700 text-white'
                  : 'text-pitch-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs text-brand-400">
              ⚙️ Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
