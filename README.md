# Quiniela Mundial 2026 — Sabor a Miga

Plataforma web completa para gestionar una quiniela del Mundial FIFA 2026. Permite a participantes registrarse, llenar predicciones para los 104 partidos del torneo, seguir el ranking en tiempo real y gestionar inscripciones y pagos. Construida con Next.js 14, Supabase y Tailwind CSS.

---

## Tabla de contenidos

- [Arquitectura general](#arquitectura-general)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos](#base-de-datos)
- [Sistema de bloqueo de quiniela](#sistema-de-bloqueo-de-quiniela)
- [Sistema de pagos](#sistema-de-pagos)
- [Sistema de puntuación y premios](#sistema-de-puntuación-y-premios)
- [API Routes](#api-routes)
- [Panel de administración](#panel-de-administración)
- [Setup local](#setup-local)
- [Deploy a producción (Vercel)](#deploy-a-producción-vercel)
- [Comandos útiles](#comandos-útiles)

---

## Arquitectura general

```
Vercel (Next.js 14 App Router)
    │
    ├── Middleware (auth + bloqueo de quiniela)
    ├── Server Components (SSR, fetch de datos)
    ├── Client Components (interactividad)
    └── API Routes (mutations protegidas)
           │
    Supabase (PostgreSQL + Auth + RLS)
           │
    ├── Auth (email/password, sesiones con cookies)
    ├── Row Level Security en todas las tablas
    └── Funciones y triggers en PostgreSQL
```

El proyecto usa el **App Router** de Next.js 14 con arquitectura server-first: las páginas son Server Components que hacen fetch directo a Supabase, y solo delegan al cliente lo que requiere estado interactivo (formularios, countdown, toasts).

---

## Funcionalidades

### Para participantes

| Módulo | Descripción |
|---|---|
| **Registro / Login** | Registro con username, nombre completo, email y contraseña. Redirección automática al dashboard si ya está autenticado. |
| **Dashboard** | Vista general: estado de la quiniela, countdown en tiempo real, puntos actuales, posición en ranking, progreso de picks y bolsa acumulada. |
| **Mi Quiniela** | Predicciones para los 104 partidos del Mundial (fase de grupos + eliminatorias). Agrupados por etapa. Marcador exacto en grupos, resultado y ganador en eliminatorias. Editable mientras esté abierta. |
| **Rankings** | Vista pre-torneo (participantes ordenados por % de picks completados) y vista en vivo durante el torneo (puntos, aciertos exactos, % completado, premio estimado). Podio visual con los 3 primeros. |
| **Pago de inscripción** | Ficha de depósito con CLABE, banco y beneficiario. Botón para notificar al admin vía WhatsApp. Estados del pago visibles en banner persistente. |
| **Perfil** | Cambio de avatar (mascotas predefinidas), cambio de contraseña. |
| **Exportar quiniela** | Descarga en PDF (jsPDF) y Excel (xlsx) con todas las predicciones del usuario. |

### Para administradores

| Módulo | Descripción |
|---|---|
| **Panel admin** (`/admin`) | Resumen de participantes, bolsa total, fecha de cierre y logs recientes. |
| **Gestión de pagos** (`/admin/pagos`) | Tabla completa de todos los participantes con su estado de pago. Confirmar o rechazar pagos. Resumen por estado. Bolsa calculada automáticamente. |
| **Configuración de quiniela** | Fecha de cierre, nombre del torneo, monto de inscripción, datos bancarios (beneficiario, banco, CLABE), número de WhatsApp, apertura manual forzada. |
| **Cargar resultados** | Ingresar el marcador real de cada partido. Al marcar como terminado se dispara automáticamente el recálculo de standings. |
| **Participantes** | Lista de participantes con estado de inscripción, posibilidad de resetear contraseña. |
| **Registro de cambios** | Audit log de las últimas 20 acciones en el sistema. |

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 14.2.16 | Framework full-stack (App Router, SSR, API Routes, Middleware) |
| **React** | 18 | UI |
| **TypeScript** | 5 | Tipado estático |
| **Supabase** | v2 (`@supabase/ssr`) | PostgreSQL + Auth + RLS + Storage |
| **Tailwind CSS** | 3.4 | Estilos utility-first |
| **date-fns + date-fns-tz** | 3.x | Manejo de fechas UTC |
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
│   ├── page.tsx                         # Landing page
│   ├── layout.tsx                       # Layout raíz (fuentes, globals)
│   ├── globals.css                      # Variables CSS + clases base
│   │
│   ├── auth/
│   │   ├── login/page.tsx               # Login (email + contraseña)
│   │   └── register/page.tsx            # Registro (username + nombre + email)
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                   # Layout con NavBar (auth guard)
│   │   ├── page.tsx                     # Dashboard: stats, countdown, picks progress
│   │   ├── quiniela/page.tsx            # Predicciones por partido y etapa
│   │   ├── rankings/page.tsx            # Tabla de posiciones + podio
│   │   ├── pago/page.tsx                # Instrucciones de pago + ficha
│   │   └── perfil/page.tsx             # Avatar + cambio de contraseña
│   │
│   ├── admin/
│   │   ├── page.tsx                     # Panel principal (admin guard)
│   │   └── pagos/page.tsx               # Gestión de pagos
│   │
│   └── api/
│       ├── picks/route.ts               # GET picks + POST/PATCH upsert (bloqueado si cerrada)
│       ├── payments/
│       │   └── mark-submitted/route.ts  # Marcar pago como enviado
│       ├── profile/
│       │   └── avatar/route.ts          # Actualizar avatar
│       ├── export/
│       │   └── spreadsheet/route.ts     # Exportar datos (para PDF/Excel)
│       ├── auth/
│       │   └── create-profile/route.ts  # Crear perfil post-registro
│       └── admin/
│           ├── config/route.ts          # GET/PUT configuración
│           ├── matches/
│           │   ├── route.ts             # GET todos los partidos
│           │   └── [id]/route.ts        # PATCH resultado de partido
│           ├── participants/
│           │   ├── route.ts             # GET participantes
│           │   └── [id]/route.ts        # PATCH participante (activar/desactivar)
│           ├── payments/
│           │   ├── route.ts             # GET todos los pagos
│           │   ├── [user_id]/confirm/   # POST confirmar pago
│           │   └── [user_id]/reject/    # POST rechazar pago
│           └── users/
│               └── [user_id]/reset-password/route.ts  # POST reset contraseña
│
├── components/
│   ├── shared/
│   │   ├── NavBar.tsx                   # Barra de navegación principal
│   │   ├── CountdownBanner.tsx          # Reloj regresivo en tiempo real (client)
│   │   ├── StatusBadge.tsx              # Badge: Abierta / Cerrando / Cerrada
│   │   ├── PaymentStatusBanner.tsx      # Banner de estado de pago del usuario
│   │   └── PoolDisplay.tsx              # Monto de la bolsa acumulada
│   ├── quiniela/
│   │   ├── MatchCard.tsx                # Tarjeta de partido con inputs editables
│   │   ├── QuinielaLocked.tsx           # Pantalla cuando la quiniela está cerrada
│   │   └── QuinielaExportButtons.tsx    # Botones PDF y Excel
│   ├── payment/
│   │   ├── DepositSlip.tsx              # Ficha de depósito con datos bancarios
│   │   └── PaymentActions.tsx           # Botón "Ya pagué" + manejo de estado
│   ├── perfil/
│   │   ├── AvatarEditor.tsx             # Selección de avatar (mascotas)
│   │   └── ChangePasswordForm.tsx       # Formulario cambio de contraseña
│   └── admin/
│       ├── AdminConfigForm.tsx          # Formulario configuración de quiniela
│       ├── AdminMatchResults.tsx        # Ingreso de resultados de partidos
│       ├── AdminParticipants.tsx        # Lista de participantes
│       └── PagosAdminClient.tsx         # Tabla de gestión de pagos (client)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # createBrowserClient (para componentes client)
│   │   └── server.ts                    # createServerClient + createAdminClient (SSR/API)
│   └── utils/
│       └── quiniela-status.ts           # Lógica de estados y countdown
│
├── middleware.ts                        # Auth guard + bloqueo de quiniela
└── types/
    └── database.ts                      # Tipos TypeScript para todas las tablas

supabase/
├── schema.sql                           # Schema completo (tablas, funciones, triggers, RLS)
├── matches_group_stage.sql              # Partidos de fase de grupos
├── teams_48_oficial.sql                 # 48 selecciones con sorteo oficial
├── email-confirm.html                   # Template email confirmación
└── email-reset-password.html            # Template email reset contraseña
```

---

## Base de datos

### Tablas

| Tabla | Descripción |
|---|---|
| `profiles` | Extiende `auth.users`. Almacena username, nombre, avatar, rol admin, estado de pago (`sin_iniciar` / `pendiente_verificacion` / `confirmado` / `rechazado` / `reembolsado`) e `inscription_paid`. |
| `quiniela_config` | Singleton (una sola fila). Fecha de cierre, apertura manual, monto de inscripción, datos bancarios, configuración del torneo. |
| `teams` | 48 selecciones clasificadas, organizadas en 12 grupos (A–L) con emoji de bandera. |
| `matches` | 104 partidos: fase de grupos + fase eliminatoria. Almacena marcador real, resultado y ganador cuando se carga. |
| `picks` | Predicciones del usuario por partido. Un registro por (user_id, match_id). Incluye `predicted_result` calculado automáticamente por trigger. |
| `scoring_rules` | Reglas de puntuación por etapa. Dos registros: `group` y `knockout`. |
| `standings` | Tabla de posiciones calculada automáticamente. Se actualiza via trigger cuando se marca un partido como terminado. |
| `prize_distribution` | Distribución de premios calculada desde standings. Se divide equitativamente en caso de empate. |
| `prize_claims` | Registro de reclamación de premio (CLABE del ganador, autorización de publicación, comprobante de transferencia). |
| `change_logs` | Audit trail: cada acción admin queda registrada con datos antes/después. |

### Funciones PostgreSQL

| Función | Descripción |
|---|---|
| `is_quiniela_open()` | Retorna `TRUE` si `is_manually_open = true` o si `NOW() < close_date`. Usada en RLS y en el middleware. |
| `calculate_pick_result(home, away)` | Retorna `'home'`, `'away'` o `'draw'` según el marcador predicho. |
| `calculate_pick_points(pick_id)` | Calcula puntos para un pick comparando con el resultado real. Actualiza `points_earned`, `is_exact`, `is_correct`. |
| `refresh_standings()` | Recalcula toda la tabla de posiciones y asigna rankings. Se llama automáticamente al terminar un partido. |
| `calculate_prize_distribution()` | Calcula y guarda la distribución de premios. Divide la bolsa entre empatados en primer lugar. |
| `archive_unpaid_picks()` | Marca como no oficiales (`is_official = false`) los picks de usuarios sin pago iniciado. |

### Triggers

| Trigger | Cuándo se ejecuta | Qué hace |
|---|---|---|
| `picks_set_predicted_result` | BEFORE INSERT/UPDATE en `picks` | Calcula automáticamente `predicted_result` desde el marcador predicho. |
| `matches_refresh_standings` | AFTER UPDATE en `matches` | Si `is_finished` cambia de `FALSE` a `TRUE`, llama a `refresh_standings()`. |
| `profiles_sync_inscription_paid` | BEFORE UPDATE en `profiles` (cuando cambia `payment_status`) | Si el estado es `confirmado`, activa `inscription_paid = true` y registra la fecha. Si es `rechazado` o `reembolsado`, lo pone en `false`. |
| `profiles_update_pool_amount` | AFTER UPDATE OF `inscription_paid` en `profiles` | Recalcula `pool_amount` en `quiniela_config` (participantes confirmados × monto de inscripción). |

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas clave:

- **profiles:** cada usuario solo ve y edita su propio perfil. Los admins pueden ver todos.
- **picks:** cada usuario solo opera sobre sus propios picks. Las inserciones y updates requieren `is_quiniela_open() = TRUE` a nivel de base de datos.
- **standings, matches, teams:** lectura para todos los usuarios autenticados.
- **quiniela_config:** lectura para todos; escritura solo para admins.
- **change_logs:** solo admins pueden leer; todos los autenticados pueden insertar.
- **prize_claims:** cada usuario ve y crea su propio registro; admins tienen acceso total.

---

## Sistema de bloqueo de quiniela

El sistema implementa **validación triple** para garantizar que no se puedan enviar picks después del cierre, incluso si el cliente manipula la UI.

### 1. Frontend (UX)
- `CountdownBanner` muestra el tiempo restante en tiempo real (días, horas, minutos, segundos).
- `StatusBadge` muestra el estado visual de la quiniela.
- Los inputs del `MatchCard` se deshabilitan cuando `canEdit = false`.

### 2. Middleware Next.js (`src/middleware.ts`)
Intercepta **todas** las peticiones `POST/PATCH/PUT/DELETE` a `/api/picks`. Consulta `quiniela_config` directamente desde el servidor y retorna `HTTP 423 Locked` si la quiniela está cerrada.

### 3. API Route (`/api/picks`)
Segunda validación independiente en el handler, antes de ejecutar el upsert en Supabase.

### 4. Row Level Security en Supabase
Las políticas `picks_insert_own` y `picks_update_own` incluyen `is_quiniela_open()` en el `WITH CHECK`. Aunque llegara una petición directa a la API de Supabase, sería rechazada a nivel de base de datos.

### Estados de la quiniela

| Estado | Condición | Color | Edición |
|---|---|---|---|
| `open` | > 72h al cierre | Verde | Permitida |
| `warning` | < 72h al cierre | Naranja | Permitida |
| `closing_soon` | < 1h al cierre | Rojo | Permitida |
| `closed` | Fecha pasada | Gris | Bloqueada (HTTP 423) |
| *(manual)* | `is_manually_open = true` | Verde | Siempre permitida |

---

## Sistema de pagos

El flujo de inscripción es manual vía transferencia bancaria, con confirmación por WhatsApp.

### Flujo del participante

1. El usuario accede a `/dashboard/pago`.
2. Ve la ficha de depósito con: beneficiario, banco, CLABE y monto.
3. Realiza la transferencia y hace clic en **"Ya pagué — Notificar por WhatsApp"**.
4. Se genera un mensaje prefabricado con username y monto, abre WhatsApp.
5. El estado cambia a `pendiente_verificacion`.

### Flujo del administrador (`/admin/pagos`)

1. Ve la lista de todos los participantes ordenada por fecha de envío.
2. Confirma o rechaza cada pago con un botón.
3. Al confirmar: `payment_status = 'confirmado'`, `inscription_paid = true` (vía trigger), y `pool_amount` se recalcula automáticamente.
4. Al rechazar: `payment_status = 'rechazado'`, `inscription_paid = false`.

### Estados de pago

| Estado | Descripción |
|---|---|
| `sin_iniciar` | El usuario no ha iniciado el proceso |
| `pendiente_verificacion` | El usuario notificó el pago, pendiente de confirmar |
| `confirmado` | Pago verificado por el admin |
| `rechazado` | Comprobante inválido o fondos no recibidos |
| `reembolsado` | Pago revertido |

Un banner persistente en el dashboard y en la quiniela muestra siempre el estado actual del pago.

---

## Sistema de puntuación y premios

### Reglas de puntuación (configurables)

| Acierto | Fase de grupos | Eliminatorias |
|---|---|---|
| Marcador exacto | 3 pts | 3 pts |
| Resultado correcto (L/E/V) | 1 pt | — |
| Ganador correcto | — | 2 pts |

Los puntos se calculan automáticamente en PostgreSQL via `calculate_pick_points()` cuando se marca un partido como terminado. El trigger `matches_refresh_standings` llama a `refresh_standings()` para actualizar el ranking completo.

### Distribución de premios

- La bolsa = número de participantes con `inscription_paid = true` × monto de inscripción.
- El ganador es el usuario con mayor `total_points`.
- En caso de empate: la bolsa se divide en partes iguales entre todos los empatados.
- La función `calculate_prize_distribution()` genera la tabla de distribución y maneja el caso de empate.
- Solo participantes con `inscription_paid = true` son elegibles para el premio.

---

## API Routes

Todas las rutas de admin validan que el usuario sea admin usando `createAdminSupabaseClient` (con `SUPABASE_SERVICE_ROLE_KEY`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET/POST` | `/api/picks` | Obtener o guardar predicciones del usuario |
| `POST` | `/api/payments/mark-submitted` | Marcar pago como enviado por el usuario |
| `PATCH` | `/api/profile/avatar` | Actualizar avatar del perfil |
| `GET` | `/api/export/spreadsheet` | Retorna JSON con todos los picks para exportar |
| `POST` | `/api/auth/create-profile` | Crear perfil al completar registro |
| `GET/PUT` | `/api/admin/config` | Leer o actualizar configuración de la quiniela |
| `GET` | `/api/admin/matches` | Listar todos los partidos |
| `PATCH` | `/api/admin/matches/[id]` | Cargar resultado de un partido |
| `GET` | `/api/admin/participants` | Listar participantes |
| `PATCH` | `/api/admin/participants/[id]` | Actualizar estado de participante |
| `GET` | `/api/admin/payments` | Listar todos los pagos |
| `POST` | `/api/admin/payments/[user_id]/confirm` | Confirmar pago |
| `POST` | `/api/admin/payments/[user_id]/reject` | Rechazar pago |
| `POST` | `/api/admin/users/[user_id]/reset-password` | Resetear contraseña de un usuario |

---

## Panel de administración

El acceso a `/admin` y `/admin/pagos` está protegido: la página verifica `is_admin = true` en el perfil del usuario antes de renderizar. Si no es admin, redirige a `/dashboard`.

Las operaciones sensibles (confirmar pagos, cargar resultados, cambiar configuración) usan `createAdminSupabaseClient` que opera con `SUPABASE_SERVICE_ROLE_KEY` y omite RLS. Esta clave nunca se expone al cliente.

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
4. Esperar ~2 minutos

### 3. Ejecutar el schema SQL

En Supabase → **SQL Editor** → **New query**, pegar el contenido de `/supabase/schema.sql` y ejecutar. Se crearán todas las tablas, funciones, triggers, políticas RLS y los 48 equipos.

Opcionalmente, ejecutar `supabase/matches_group_stage.sql` para cargar los partidos de la fase de grupos.

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

# 4. Deploy automático con cada git push
```

El proyecto usa `export const dynamic = 'force-dynamic'` en las páginas con datos en tiempo real para garantizar que no sean cacheadas en Vercel.

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción local
npm run lint         # Verificar errores de linting
npm run db:types     # Regenerar tipos TypeScript desde Supabase
```

---

Desarrollado para **Sabor a Miga** · Mundial 2026
