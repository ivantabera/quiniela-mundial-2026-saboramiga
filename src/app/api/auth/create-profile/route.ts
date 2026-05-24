import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

const AVATARS = [
  '/avatars/mascota-1.png',
  '/avatars/mascota-2.png',
  '/avatars/mascota-cafe.png',
  '/avatars/mascota-rol.png',
  '/avatars/mascota-rol-cafe.png',
  '/avatars/mascota.png',
]

export async function POST(request: Request) {
  try {
    const { id, username, full_name } = await request.json()
    if (!id || !username) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()
    const avatar_url = AVATARS[Math.floor(Math.random() * AVATARS.length)]

    const { error } = await admin.from('profiles').upsert({
      id,
      username,
      full_name: full_name ?? '',
      avatar_url,
    }, { onConflict: 'id', ignoreDuplicates: false })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
