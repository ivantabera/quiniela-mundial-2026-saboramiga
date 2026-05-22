'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const AVATARS = [
  '/avatars/mascota-1.png',
  '/avatars/mascota-2.png',
  '/avatars/mascota-cafe.png',
  '/avatars/mascota-rol.png',
  '/avatars/mascota-rol-cafe.png',
  '/avatars/mascota.png',
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)

    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username, full_name: form.full_name }
      }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 2. Crear perfil con avatar aleatorio
    if (data.user) {
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: form.username,
        full_name: form.full_name,
        avatar_url: randomAvatar,
      })
      if (profileError) {
        toast.error('Error al crear perfil: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    toast.success('¡Cuenta creada! Revisa tu correo para confirmar.')
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-azul-crema.png" alt="Sabor a Miga" width={120} height={120} className="rounded-2xl" />
            <span className="font-display text-3xl text-white tracking-widest">MUNDIAL 2026</span>
          </Link>
          <p className="text-pitch-400 mt-2">Crea tu cuenta y participa</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-pitch-300 mb-2">Nombre completo</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Juan García"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-pitch-300 mb-2">Apodo (usuario)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="juancho10"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g,'') }))}
                required
              />
            </div>
          </div>
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
            <label className="block text-sm text-pitch-300 mb-2">Contraseña (mín. 8 caracteres)</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full text-lg py-4" disabled={loading}>
            {loading ? 'Creando cuenta...' : '🚀 Unirme a la quiniela'}
          </button>
        </form>

        <p className="text-center text-pitch-400 mt-6 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-pitch-300 hover:text-white underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
