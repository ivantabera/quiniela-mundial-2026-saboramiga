'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

async function saveAvatar(url: string) {
  const res = await fetch('/api/profile/avatar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar_url: url }),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Error')
}

const PRESET_AVATARS = [
  '/avatars/mascota-1.png',
  '/avatars/mascota-2.png',
  '/avatars/mascota-cafe.png',
  '/avatars/mascota-rol.png',
  '/avatars/mascota-rol-cafe.png',
  '/avatars/mascota.png',
]

interface Props {
  userId: string
  currentAvatar: string | null
}

export default function AvatarEditor({ userId, currentAvatar }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(currentAvatar)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { setAvatar(currentAvatar) }, [currentAvatar])

  async function selectPreset(url: string) {
    setSaving(true)
    try {
      await saveAvatar(url)
      setAvatar(url)
      toast.success('Avatar actualizado')
      router.refresh()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('Error al subir imagen. Verifica que el bucket "avatars" exista en Supabase Storage.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = data.publicUrl + `?t=${Date.now()}`

    try {
      await saveAvatar(publicUrl)
      setAvatar(publicUrl)
      toast.success('Foto actualizada')
      router.refresh()
    } catch {
      toast.error('Error al guardar')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-5">
      {/* Avatar actual */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-pitch-800 flex-shrink-0 ring-2 ring-brand-500">
          {avatar ? (
            <Image src={avatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-display text-pitch-400">?</div>
          )}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Tu avatar actual</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-1 text-xs text-brand-400 hover:text-brand-300 underline transition-colors"
          >
            {uploading ? 'Subiendo...' : 'Subir foto propia'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={uploadPhoto}
          />
        </div>
      </div>

      {/* Selector de conejitos */}
      <div>
        <p className="text-pitch-400 text-xs uppercase tracking-wider mb-3">Elige tu conejito</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {PRESET_AVATARS.map(url => (
            <button
              key={url}
              onClick={() => selectPreset(url)}
              disabled={saving}
              className={`rounded-xl overflow-hidden transition-all border-2 ${
                avatar === url
                  ? 'border-brand-500 scale-105 shadow-lg shadow-brand-900/40'
                  : 'border-transparent hover:border-pitch-500 hover:scale-105'
              }`}
            >
              <Image src={url} alt="Avatar" width={80} height={80} className="w-full h-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
