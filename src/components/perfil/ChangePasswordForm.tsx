'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ChangePasswordForm() {
  const supabase = createClient()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Contraseña actualizada')
      setForm({ password: '', confirm: '' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-pitch-300 mb-2">Nueva contraseña</label>
        <input
          type="password"
          className="input w-full"
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-pitch-300 mb-2">Confirmar contraseña</label>
        <input
          type="password"
          className="input w-full"
          placeholder="••••••••"
          value={form.confirm}
          onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary py-2.5 px-6 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
