# Quiniela Mundial 2026 — Sabor a Miga

Plataforma web completa para gestionar una quiniela del Mundial FIFA 2026. Permite a participantes registrarse, llenar predicciones para los 104 partidos del torneo, seguir el ranking en tiempo real y gestionar inscripciones y pagos. Construida con Next.js 14, Supabase y Tailwind CSS.

---

## Tabla de contenidos

- [Arquitectura general](#arquitectura-general)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos](#base-de-datos)
- [Sistema de bloqueo de picks](#sistema-de-bloqueo-de-picks)
- [Sistema de pagos](#sistema-de-pagos)
- [Sistema de puntuación y premios](#sistema-de-puntuación-y-premios)
- [API Routes](#api-routes)
- [Panel de administración](#panel-de-administración)
- [Tests](#tests)
- [Setup local](#setup-local)
- [Deploy a producción (Vercel)](#deploy-a-producción-vercel)
- [Comandos útiles](#comandos-útiles)

---

## Arquitectura general

```
Vercel (Next.js 14 App Router)
    │
    ├── Middleware (auth guard + refresh de sesión)
    ├── Server Components (SSR, fetch directo a Supabase)
    ├── Client Components (interactividad: formularios, countdown, toasts)
    └── API Routes (mutations protegidas con Service Role Key)
           │
    Supabase (PostgreSQL + Auth + RLS)
           │
    ├── Auth (email/password, sesiones con cookies SSR)
    ├── Row Level Security en todas las tablas
    └── Funciones, triggers y RPCs en PostgreSQL
```

El proyecto usa el **App Router** de Next.js 14 con arquitectura server-first: las páginas son Server Components que hacen fetch directo a Supabase, y solo delegan al cliente lo que requiere estado interactivo (formularios, countdown, toasts, toggle de vistas).

---

## Funcionalidades

### Para participantes

| Módulo | Descripción |
|---|---|
| **Landing page** | Visible sin sesión. Muestra estado de la quiniela, bolsa asegurada (participantes con pago confirmado × inscripción), bolsa potencial estimada y countdown al cierre. |
| **Registro / Login** | Registro con username, nombre completo, email y contraseña. Redirección automática al dashboard si ya está autenticado. |
| **Dashboard** | Vista general: estado de la quiniela, countdown en tiempo real, puntos actuales, posición en ranking, progreso de picks y bolsa acumulada. |
| **Mi Quiniela** | Predicciones para los 104 partidos. Vista **Por Día** (default) o **Por Grupo** seleccionable con toggle. En vista Por Día, los partidos próximos aparecen primero y los días pasados al fondo con opacidad reducida. Cada partido se bloquea individualmente 10 minutos antes de su kickoff. Solo accesible para participantes con `inscription_paid = true`. |
| **Rankings** | Vista pre-torneo (participantes con % de picks completados) y vista en vivo (puntos, aciertos, completado, premio). Sección **Ganadores** que agrupa automáticamente a *todos* los participantes con el puntaje más alto, sin jerarquía entre empatados. En caso de empate, el premio se divide de forma equitativa. |
| **Pago de inscripción** | Ficha de depósito con CLABE, banco y beneficiario. Botón para notificar al admin vía WhatsApp con mensaje prefabricado. Banner persistente con el estado actual del pago. |
| **Perfil** | Cambio de avatar (mascotas predefinidas), cambio de contraseña. |
| **Exportar quiniela** | Descarga en PDF (jsPDF) con todas las predicciones del usuario. PDF grupal con todos los participantes disponible para el admin. |

### Para administradores

| Módulo | Descripción |
|---|---|
| **Panel admin** (`/admin`) | Resumen de participantes, bolsa total, fecha de cierre y logs recientes de cambios. |
| **Gestión de pagos** (`/admin/pagos`) | Tabla completa de todos los participantes con su estado de pago. Confirmar o rechazar con un clic. Resumen por estado. Bolsa se recalcula automáticamente al confirmar. |
| **Configuración** (`/admin/config`) | Fecha de cierre, monto de inscripción, datos bancarios (beneficiario, banco, CLABE), número de WhatsApp, apertura manual forzada. |
| **Cargar resultados** (`/admin/resultados`) | Ingresar el marcador real de cada partido. Al marcar como terminado se dispara automáticamente el recálculo de standings via trigger PostgreSQL. |
| **Participantes** (`/admin/participantes`) | Lista de participantes con estado de inscripción y posibilidad de resetear contraseña. |
| **Actividad de picks** | Vista de los últimos picks guardados por todos los participantes en tiempo real. |
| **Recalcular standings** | Botón para forzar el recálculo manual de la tabla de posiciones y distribución de premios. |
| **Registro de cambios** | Audit log de las últimas acciones en el sistema (tabla `change_logs`). |

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 14.2.16 | Framework full-stack (App Router, SSR, API Routes, Middleware) |
| **React** | 18 | UI |
| **TypeScript** | 5 | Tipado estático |
| **Supabase** | v2 (`@supabase/ssr`) | PostgreSQL + Auth + RLS + Storage |
| **Tailwind CSS** | 3.4 | Estilos utility-first |
| **date-fns + date-fns-tz** | 3.x | Manejo de fechas y zonas horarias |
| **jsPDF + jsPDF-autotable** | 4.x / 5.x | Exportación a PDF |
| **xlsx** | 0.18 | Exportación a Excel |
| **lucide-react** | 0.454 | Iconografía |
| **react-hot-toast** | 2.4 | Notificaciones |
| **zod** | 3.23 | Validación de datos en API routes |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                          # Landing page pública
│   ├── layout.tsx                        # Layout raíz (fuentes, globals, Toaster)
│   │
│   ├── auth/
│   │   ├── login/page.tsx                # Login (email + contraseña)
│   │   └── register/page.tsx             # Registro (username + nombre + email)
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                    # Layout con NavBar (auth guard en middleware)
│   │   ├── page.tsx                      # Dashboard: stats, countdown, picks progress, bolsa
│   │   ├── quiniela/page.tsx             # Predicciones — toggle Por Día / Por Grupo
│   │   ├── rankings/page.tsx             # Tabla de posiciones + sección Ganadores
│   │   ├── pago/page.tsx                 # Instrucciones de pago + ficha de depósito
│   │   └── perfil/page.tsx              # Avatar + cambio de contraseña
│   │
│   ├── admin/
│   │   ├── layout.tsx                    # Layout de admin (guard is_admin)
│   │   ├── page.tsx                      # Panel principal
│   │   ├── config/page.tsx               # Configuración de quiniela
│   │   ├── pagos/page.tsx                # Gestión de pagos
│   │   ├── participantes/page.tsx        # Lista de participantes
│   │   └── resultados/page.tsx           # Carga de resultados por partido
│   │
│   └── api/
│       ├── picks/route.ts                # POST upsert de pick — valida lock por partido
│       ├── payments/
│       │   └── mark-submitted/route.ts   # Marcar pago como enviado por el usuario
│       ├── profile/
│       │   └── avatar/route.ts           # Actualizar avatar del perfil
│       ├── export/
│       │   └── spreadsheet/route.ts      # JSON con todos los picks para PDF grupal
│       ├── auth/
│       │   └── create-profile/route.ts   # Crear perfil al completar registro
│       └── admin/
│           ├── config/route.ts           # GET/PUT configuración de quiniela
│           ├── matches/
│           │   ├── route.ts              # GET todos los partidos
│           │   └── [id]/route.ts         # PATCH resultado de un partido
│           ├── participants/
│           │   ├── route.ts              # GET participantes
│           │   └── [id]/route.ts         # PATCH estado de participante
│           ├── payments/
│           │   ├── route.ts              # GET todos los pagos
│           │   ├── [user_id]/confirm/    # POST confirmar pago
│           │   └── [user_id]/reject/     # POST rechazar pago
│           ├── picks-activity/route.ts   # GET últimos picks guardados (todos los usuarios)
│           ├── recalculate/route.ts      # POST recálculo manual de standings
│           └── users/
│               └── [user_id]/reset-password/route.ts  # POST reset de contraseña
│
├── components/
│   ├── shared/
│   │   ├── NavBar.tsx                    # Barra de navegación con links y logout
│   │   ├── CountdownBanner.tsx           # Reloj regresivo en tiempo real (client)
│   │   ├── StatusBadge.tsx               # Badge: Abierta / Próxima a cerrar / Cerrada
│   │   ├── PaymentStatusBanner.tsx       # Banner de estado de pago del usuario
│   │   ├── PoolDisplay.tsx               # Monto de la bolsa acumulada + reparto estimado
│   │   └── QuinielaInfoStrip.tsx         # Bolsa + countdown en login/registro (client)
│   │
│   ├── quiniela/
│   │   ├── MatchCard.tsx                 # Tarjeta de partido: selección L/E/V, guardar pick
│   │   ├── QuinielaMatchList.tsx         # Toggle Por Día / Por Grupo + agrupación (client)
│   │   ├── QuinielaLocked.tsx            # Pantalla informativa cuando la quiniela está cerrada
│   │   └── QuinielaExportButtons.tsx     # Botones PDF individual y PDF grupal
│   │
│   ├── payment/
│   │   ├── DepositSlip.tsx               # Ficha de depósito con datos bancarios
│   │   └── PaymentActions.tsx            # Botón "Ya pagué" + manejo de estados de pago
│   │
│   ├── perfil/
│   │   ├── AvatarEditor.tsx              # Selección de avatar (galería de mascotas)
│   │   └── ChangePasswordForm.tsx        # Formulario cambio de contraseña
│   │
│   └── admin/
│       ├── AdminConfigForm.tsx           # Formulario de configuración de quiniela
│       ├── AdminMatchResults.tsx         # Ingreso de resultados de partidos
│       ├── AdminParticipants.tsx         # Lista y gestión de participantes
│       ├── AdminPicksActivity.tsx        # Actividad reciente de picks en tiempo real
│       ├── AdminRecalculate.tsx          # Botón de recálculo manual de standings
│       └── PagosAdminClient.tsx          # Tabla de gestión de pagos (client)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient (componentes client)
│   │   └── server.ts                     # createServerClient + createAdminClient (SSR/API)
│   └── utils/
│       └── quiniela-status.ts            # Estados de quiniela, lock por partido, countdown
│
├── middleware.ts                         # Auth guard + refresh de cookies de sesión
└── types/
    └── database.ts                       # Tipos TypeScript para todas las tablas y vistas

supabase/
├── schema.sql                            # Schema completo (tablas, funciones, triggers, RLS)
├── matches_group_stage.sql               # 96 partidos de fase de grupos
├── teams_48_oficial.sql                  # 48 selecciones con sorteo oficial
├── email-confirm.html                    # Template email de confirmación
└── email-reset-password.html             # Template email de reset de contraseña
```

---

## Base de datos

### Tablas

| Tabla | Descripción |
|---|---|
| `profiles` | Extiende `auth.users`. Almacena username, nombre, avatar, rol admin, estado de pago (`sin_iniciar` / `pendiente_verificacion` / `confirmado` / `rechazado` / `reembolsado`), `inscription_paid` y `payment_confirmed_by`. |
| `quiniela_config` | Singleton (una sola fila). Fecha de cierre global, apertura manual forzada, monto de inscripción, datos bancarios, nombre del torneo y fechas. |
| `teams` | 48 selecciones clasificadas en 12 grupos (A–L) con emoji de bandera. |
| `matches` | 104 partidos: 96 de fase de grupos + 8 de eliminatoria. Almacena fecha/hora de kickoff, sede, marcador real y resultado cuando se carga. |
| `picks` | Predicciones del usuario por partido. Un registro por `(user_id, match_id)`. Incluye `predicted_result` calculado por trigger. |
| `scoring_rules` | Reglas de puntuación por etapa. Dos registros: `group` y `knockout`. |
| `standings` | Tabla de posiciones calculada automáticamente via trigger cuando se termina un partido. |
| `prize_distribution` | Distribución de premios calculada desde standings. Se divide equitativamente entre empatados en primer lugar. |
| `prize_claims` | Reclamación de premio: CLABE del ganador, autorización de publicación, comprobante de transferencia. |
| `change_logs` | Audit trail de acciones admin: acción, tabla afectada, datos antes/después. |

### Funciones PostgreSQL

| Función | Descripción |
|---|---|
| `is_quiniela_open()` | Retorna `TRUE` si `is_manually_open = true` o si `NOW() < close_date`. Usada en políticas RLS de `picks`. |
| `calculate_pick_result(home, away)` | Retorna `'home'`, `'away'` o `'draw'` según el marcador predicho. |
| `calculate_pick_points(pick_id)` | Calcula puntos para un pick comparando con el resultado real. Actualiza `points_earned`, `is_exact`, `is_correct`. |
| `refresh_standings()` | Recalcula la tabla de posiciones completa y asigna rankings usando `DENSE_RANK`. Se llama automáticamente al terminar un partido. |
| `calculate_prize_distribution()` | Calcula y guarda la distribución de premios. Divide la bolsa en partes iguales entre todos los empatados en primer lugar. |
| `archive_unpaid_picks()` | Marca como no oficiales los picks de usuarios sin pago iniciado. |

### Triggers

| Trigger | Cuándo se ejecuta | Qué hace |
|---|---|---|
| `picks_set_predicted_result` | BEFORE INSERT/UPDATE en `picks` | Calcula `predicted_result` automáticamente desde el marcador predicho. |
| `matches_refresh_standings` | AFTER UPDATE en `matches` | Si `is_finished` cambia a `TRUE`, ejecuta `refresh_standings()`. |
| `profiles_sync_inscription_paid` | BEFORE UPDATE en `profiles` | Si `payment_status = 'confirmado'`, activa `inscription_paid = true`. Si es `rechazado` o `reembolsado`, lo pone en `false`. |
| `profiles_update_pool_amount` | AFTER UPDATE OF `inscription_paid` en `profiles` | Recalcula `pool_amount` en `quiniela_config` (participantes confirmados × monto de inscripción). |
| `profiles_update_pool_on_delete` | AFTER DELETE en `profiles` | Recalcula `pool_amount` al eliminar un participante. |

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas clave:

- **profiles:** cada usuario solo ve y edita su propio perfil. Admins pueden ver todos via `service_role`.
- **picks:** cada usuario solo opera sobre sus propios picks. Las inserciones y updates requieren `is_quiniela_open() = TRUE` — el bloqueo se aplica a nivel de base de datos aunque se evite el frontend.
- **standings, matches, teams:** lectura para todos los usuarios autenticados.
- **quiniela_config:** lectura para todos los autenticados; escritura solo via `service_role`.
- **change_logs:** solo admins pueden leer; todos los autenticados pueden insertar.
- **prize_claims:** cada usuario ve y crea su propio registro; admins tienen acceso total.

---

## Sistema de bloqueo de picks

El sistema implementa **doble validación** para garantizar que no se puedan enviar picks después del cierre, incluso si el cliente manipula la UI.

### Cómo funciona el lock por partido

Cada partido tiene su propia fecha de kickoff (`match_date`). Un pick para ese partido se bloquea **10 minutos antes** del inicio del partido, independientemente del cierre global de la quiniela. La función `isMatchOpen(matchDate, config)` en `quiniela-status.ts` aplica esta lógica:

```
lockTime = match_date − 10 minutos
pick habilitado si: NOW < lockTime  AND  (is_manually_open OR NOW < close_date)
```

El `MatchCard` muestra la hora de cierre del pick y una advertencia animada cuando faltan menos de 60 minutos.

### 1. Frontend (UX)

- El `MatchCard` deshabilita los botones L/E/V y el botón Guardar cuando el pick está cerrado.
- Muestra `🔒 cierra a las HH:MM` o `⏳ cierra en Xmin` (animado).
- Solo participantes con `inscription_paid = true` pueden ver y editar picks.

### 2. API Route (`/api/picks` — POST)

El handler verifica `isMatchOpen()` antes de ejecutar el upsert en Supabase. Si el partido ya cerró, retorna `HTTP 423 Locked`. Esta validación es independiente del cliente.

### 3. Row Level Security en Supabase

Las políticas `picks_insert_own` y `picks_update_own` incluyen `is_quiniela_open()` en el `WITH CHECK`. Aunque llegara una petición directa a la API de Supabase saltándose Next.js, sería rechazada a nivel de base de datos.

### Estados globales de la quiniela

| Estado | Condición | Color | Edición |
|---|---|---|---|
| `open` | > 72h al cierre global | Verde | Permitida por partido |
| `warning` | < 72h al cierre global | Naranja | Permitida por partido |
| `closing_soon` | < 1h al cierre global | Rojo | Permitida por partido |
| `closed` | Fecha de cierre pasada | Gris | Bloqueada globalmente |
| *(manual)* | `is_manually_open = true` | Verde | Siempre permitida |

---

## Sistema de pagos

El flujo de inscripción es manual vía transferencia bancaria, con confirmación por WhatsApp.

### Flujo del participante

1. El usuario accede a `/dashboard/pago`.
2. Ve la ficha de depósito con: beneficiario, banco, CLABE y monto de inscripción.
3. Realiza la transferencia y hace clic en **"Ya pagué — Notificar por WhatsApp"**.
4. Se genera un mensaje prefabricado con username y monto. Se abre WhatsApp Web/app.
5. Su estado cambia a `pendiente_verificacion`.

### Flujo del administrador (`/admin/pagos`)

1. Ve la lista de todos los participantes ordenada por fecha de envío de comprobante.
2. Confirma o rechaza cada pago con un botón.
3. Al confirmar: `payment_status = 'confirmado'` → trigger activa `inscription_paid = true` → trigger recalcula `pool_amount` automáticamente.
4. Al rechazar: `payment_status = 'rechazado'` → `inscription_paid = false`.

### Estados de pago

| Estado | Descripción |
|---|---|
| `sin_iniciar` | El usuario no ha iniciado el proceso |
| `pendiente_verificacion` | El usuario notificó el pago, pendiente de confirmar |
| `confirmado` | Pago verificado por el admin — activa acceso a picks y rankings |
| `rechazado` | Comprobante inválido o fondos no recibidos |
| `reembolsado` | Pago revertido |

Un banner persistente en el dashboard y en la quiniela muestra siempre el estado actual del pago. Si el pago no está confirmado, la vista de quiniela muestra "Acceso restringido" en lugar de los picks.

---

## Sistema de puntuación y premios

### Reglas de puntuación (configurables en `scoring_rules`)

| Acierto | Fase de grupos | Eliminatorias |
|---|---|---|
| Marcador exacto | 3 pts | 3 pts |
| Resultado correcto (L/E/V) | 1 pt | — |
| Ganador correcto | — | 2 pts |

Los puntos se calculan automáticamente en PostgreSQL via `calculate_pick_points()` cuando se marca un partido como terminado. El trigger `matches_refresh_standings` actualiza el ranking completo con `DENSE_RANK`, garantizando que los empatados compartan el mismo número de posición.

### Distribución de premios y empates

- La bolsa = participantes con `inscription_paid = true` × monto de inscripción.
- El ganador es el usuario con mayor `total_points`.
- **En caso de empate:** la bolsa se divide en partes iguales entre *todos* los empatados en primer lugar, sin importar cuántos sean. Puede haber desde 1 hasta todos los participantes como ganadores.
- La función `calculate_prize_distribution()` genera la distribución y maneja cualquier escenario de empate.
- Solo participantes con `inscription_paid = true` son elegibles para el premio.
- La sección **Ganadores** en `/dashboard/rankings` refleja este comportamiento: agrupa automáticamente a todos los participantes con el puntaje más alto, mostrándolos al mismo nivel sin jerarquía entre ellos.

---

## API Routes

Las rutas de admin validan que el usuario sea admin via `createAdminSupabaseClient` (con `SUPABASE_SERVICE_ROLE_KEY`), que opera por fuera de RLS.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/picks` | Upsert de predicción — valida lock por partido antes de guardar |
| `POST` | `/api/payments/mark-submitted` | Marcar pago como enviado por el usuario |
| `PATCH` | `/api/profile/avatar` | Actualizar avatar del perfil |
| `GET` | `/api/export/spreadsheet` | JSON con todos los picks y participantes para PDF grupal |
| `POST` | `/api/auth/create-profile` | Crear perfil al completar el registro |
| `GET/PUT` | `/api/admin/config` | Leer o actualizar configuración de la quiniela |
| `GET` | `/api/admin/matches` | Listar todos los partidos |
| `PATCH` | `/api/admin/matches/[id]` | Cargar resultado de un partido (dispara recálculo via trigger) |
| `GET` | `/api/admin/participants` | Listar participantes activos |
| `PATCH` | `/api/admin/participants/[id]` | Actualizar estado de participante |
| `GET` | `/api/admin/payments` | Listar todos los pagos con estado |
| `POST` | `/api/admin/payments/[user_id]/confirm` | Confirmar pago de un participante |
| `POST` | `/api/admin/payments/[user_id]/reject` | Rechazar pago de un participante |
| `GET` | `/api/admin/picks-activity` | Últimos picks guardados por todos los usuarios |
| `POST` | `/api/admin/recalculate` | Forzar recálculo manual de standings y premios |
| `POST` | `/api/admin/users/[user_id]/reset-password` | Resetear contraseña de un usuario |

---

## Panel de administración

El acceso a `/admin` y todas sus subrutas está protegido: cada página verifica `is_admin = true` en el perfil antes de renderizar. Si el usuario no es admin, redirige a `/dashboard`.

Las operaciones sensibles (confirmar pagos, cargar resultados, cambiar configuración, resetear contraseñas) usan `createAdminSupabaseClient()` con `SUPABASE_SERVICE_ROLE_KEY`, que opera con permisos completos y omite RLS. Esta clave **nunca se expone al cliente** — solo se usa en Server Components y API Routes.

---

## Tests

El proyecto usa **Vitest** con `@testing-library/react` y `jsdom`.

```bash
npm test             # Corre todos los tests una vez
npm run test:watch   # Modo interactivo (re-ejecuta al guardar)
```

Los tests están en `src/test/` y cubren:

| Archivo | Qué cubre |
|---|---|
| `quiniela-status.test.ts` | `getQuinielaState` (todos los estados, apertura manual, campos retornados) y `formatCountdown` (ceros, negativos, valores compuestos) |
| `StatusBadge.test.tsx` | Labels por status, animación del dot, prop `large` |
| `PoolDisplay.test.tsx` | Formateo de monto, label personalizado, sublabel, reparto por ganadores, tiebreak |
| `MatchCard.test.tsx` | Render de equipos y botones, INSERT en primer guardado, UPDATE en guardados posteriores (regresión: clave duplicada), UPDATE con pick previo del servidor, toasts de éxito / error genérico / error RLS |

---

## Setup local

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd quiniela-mundial-2026
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [https://app.supabase.com](https://app.supabase.com)
2. **New project** → nombre: `quiniela-mundial-2026`
3. Región: **South America (São Paulo)** — más cercana a México
4. Esperar ~2 minutos a que el proyecto quede activo

### 3. Ejecutar el schema SQL

En Supabase → **SQL Editor** → **New query**, pegar el contenido de `/supabase/schema.sql` y ejecutar. Se crearán todas las tablas, funciones, triggers, políticas RLS y los 48 equipos.

Opcionalmente, ejecutar `supabase/matches_group_stage.sql` para cargar los 96 partidos de la fase de grupos.

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role ⚠️ |

> **NUNCA subas `.env.local` a Git.** El `.gitignore` ya lo excluye.

### 5. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 6. Crear el primer administrador

1. Regístrate en la app normalmente.
2. En Supabase → **Table Editor** → tabla `profiles`.
3. Encuentra tu usuario y cambia `is_admin` a `TRUE`.
4. Accede a `/admin`.

---

## Deploy a producción (Vercel)

```bash
# 1. Subir a GitHub
git add .
git commit -m "feat: quiniela mundial 2026"
git push origin main

# 2. Conectar en Vercel
# vercel.com → New Project → importar desde GitHub

# 3. Agregar variables de entorno en Vercel
# Project Settings → Environment Variables → las mismas de .env.local

# 4. Deploy automático con cada git push a main
```

Las páginas con datos en tiempo real usan `export const dynamic = 'force-dynamic'` para garantizar que no sean cacheadas en Vercel Edge.

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo (hot reload)
npm run build        # Build de producción
npm run start        # Servidor de producción local
npm run lint         # Verificar errores de linting
npm test             # Correr suite de tests unitarios
npm run test:watch   # Tests en modo interactivo
npm run db:types     # Regenerar tipos TypeScript desde el schema de Supabase
```

---

Desarrollado para **Sabor a Miga** · Mundial 2026
