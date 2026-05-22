'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(form)
    if (error) {
      toast.error('Credenciales incorrectas')
    } else {
      toast.success('¡Bienvenido!')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl text-white tracking-widest">
            ⚽ MUNDIAL 2026
          </Link>
          <p className="text-pitch-400 mt-2">Inicia sesión en tu quiniela</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <div>
            <label className="block text-sm text-pitch-300 mb-2">Correo electrónico</label>
            <input
              type="email"
              className="input w-full"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-pitch-300 mb-2">Contraseña</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-pitch-400 mt-6 text-sm">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-pitch-300 hover:text-white underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  )
}
