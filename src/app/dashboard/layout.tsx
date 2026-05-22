import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import NavBar from '@/components/shared/NavBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        username={profile?.username ?? 'Usuario'}
        fullName={profile?.full_name ?? ''}
        isAdmin={profile?.is_admin ?? false}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
      <footer className="border-t border-pitch-800 py-4 text-center text-pitch-600 text-xs">
        Quiniela Mundial 2026 · Sabor a Miga
      </footer>
    </div>
  )
}
