import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ['/dashboard', '/admin']
// Rutas de API que modifican picks (bloqueadas cuando quiniela está cerrada)
const PICK_MUTATION_ROUTES = ['/api/picks']
// Rutas exclusivas de admin
const ADMIN_ROUTES = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── 1. Crear cliente Supabase con cookies ───────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── 2. Verificar sesión activa ──────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // Redirigir rutas protegidas sin sesión
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirigir login/register si ya está autenticado
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 3. Check de admin lo maneja cada route handler con createAdminSupabaseClient ──

  // ── 4. BLOQUEO DE QUINIELA — Validación en servidor (UTC) ────────────
  const isPickMutation =
    PICK_MUTATION_ROUTES.some(r => pathname.startsWith(r)) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)

  if (isPickMutation && user) {
    const { data: config } = await supabase
      .from('quiniela_config')
      .select('close_date, is_manually_open')
      .single()

    if (config) {
      const now = new Date()
      const closeDate = new Date(config.close_date)
      const isOpen = config.is_manually_open || now < closeDate

      if (!isOpen) {
        return NextResponse.json(
          {
            error: 'La quiniela está cerrada',
            code: 'QUINIELA_CLOSED',
            close_date: config.close_date,
            message: 'No se pueden realizar modificaciones. La quiniela se cerró el ' +
              closeDate.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })
          },
          { status: 423 } // 423 Locked
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
