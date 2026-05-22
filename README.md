# ⚽ Quiniela Mundial 2026 — Sabor a Miga

Aplicación web completa para la quiniela del Mundial 2026. Construida con Next.js 14, Supabase y Tailwind CSS.

---

## 🚀 Setup Local (5 pasos)

### 1. Clonar e instalar dependencias

```bash
# Si clonaste el repo
cd quiniela-mundial-2026
npm install

# Si empiezas desde cero
npx create-next-app@latest quiniela-mundial-2026 --typescript --tailwind --app --no-src-dir
# (luego copia todos los archivos de este proyecto)
```

---

### 2. Crear proyecto en Supabase

1. Ir a [https://app.supabase.com](https://app.supabase.com)
2. Click en **New project**
3. Nombre: `quiniela-mundial-2026`
4. Elegir contraseña segura para la DB
5. Región: **South America (São Paulo)** — más cercana a México
6. Esperar ~2 minutos a que se cree

---

### 3. Ejecutar el schema SQL

1. En tu proyecto Supabase → **SQL Editor** → **New query**
2. Pegar el contenido de `/supabase/schema.sql`
3. Click **Run** (▶)
4. ✅ Se crearán todas las tablas, funciones y datos iniciales

---

### 4. Configurar variables de entorno

```bash
# Copiar el template
cp .env.local.example .env.local
```

Editar `.env.local` con tus valores de Supabase:

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role ⚠️ |

> ⚠️ **NUNCA subas `.env.local` a Git**. El `.gitignore` ya lo excluye.

---

### 5. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 👤 Crear el primer administrador

1. Regístrate en la app normalmente
2. En Supabase → **Table Editor** → tabla `profiles`
3. Encuentra tu usuario y cambia `is_admin` a `TRUE`
4. ¡Listo! Ya puedes acceder a `/admin`

---

## 🏗️ Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   └── register/page.tsx       # Registro
│   ├── dashboard/
│   │   ├── layout.tsx              # Layout con navbar
│   │   ├── page.tsx                # Dashboard principal
│   │   ├── quiniela/page.tsx       # Llenar predicciones
│   │   ├── rankings/page.tsx       # Tabla de posiciones
│   │   └── perfil/page.tsx         # Estadísticas personales
│   ├── admin/
│   │   └── page.tsx                # Panel administrador
│   └── api/
│       ├── picks/route.ts           # API picks (con bloqueo doble)
│       └── admin/
│           ├── config/route.ts      # Configurar quiniela
│           └── matches/
│               ├── route.ts         # Listar partidos
│               └── [id]/route.ts    # Guardar resultado
├── components/
│   ├── shared/
│   │   ├── NavBar.tsx              # Navegación principal
│   │   ├── CountdownBanner.tsx     # Contador regresivo en vivo
│   │   ├── StatusBadge.tsx         # Badge: Abierta/Cerrando/Cerrada
│   │   └── PoolDisplay.tsx         # Bolsa acumulada
│   ├── quiniela/
│   │   ├── MatchCard.tsx           # Tarjeta de partido editable
│   │   └── QuinielaLocked.tsx      # Pantalla de quiniela cerrada
│   └── admin/
│       ├── AdminConfigForm.tsx     # Formulario de configuración
│       └── AdminMatchResults.tsx   # Ingresar resultados reales
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente para browser
│   │   └── server.ts               # Cliente para SSR/API
│   └── utils/
│       └── quiniela-status.ts      # Lógica de estado de quiniela
├── middleware.ts                   # Bloqueo de quiniela + auth
└── types/
    └── database.ts                 # Tipos TypeScript de la DB
supabase/
└── schema.sql                      # Schema completo de PostgreSQL
```

---

## 🔒 Sistema de bloqueo de quiniela

El sistema implementa **validación doble**:

### Frontend (UX)
- `CountdownBanner` muestra el tiempo restante en tiempo real
- `StatusBadge` muestra el estado visual (Abierta / Próxima a cerrar / Cerrada)
- Los inputs de marcador se deshabilitan cuando la quiniela está cerrada
- Advertencia cuando faltan < 72 horas
- Alerta urgente cuando falta < 1 hora

### Backend (Seguridad real)
1. **Middleware Next.js** (`src/middleware.ts`): Intercepta TODAS las peticiones PATCH/POST/PUT/DELETE a `/api/picks` y verifica la fecha de cierre contra el timestamp UTC del servidor
2. **API Route** (`/api/picks`): Segunda validación independiente en el handler
3. **Row Level Security en Supabase**: Las políticas de Supabase también verifican `is_quiniela_open()` a nivel de base de datos

### Estados
| Estado | Condición | Color | Edición |
|---|---|---|---|
| `open` | > 72h al cierre | 🟢 Verde | ✅ Permitida |
| `warning` | < 72h al cierre | 🟡 Naranja | ✅ Permitida |
| `closing_soon` | < 1h al cierre | 🔴 Rojo | ✅ Permitida |
| `closed` | Fecha pasada | ⚫ Gris | ❌ Bloqueada |

---

## 💰 Sistema de premiación

- La bolsa se configura desde el **Panel Admin**
- El ganador es el usuario con **más puntos al final del torneo**
- En caso de empate: la bolsa se **divide en partes iguales** entre todos los ganadores
- El cálculo es automático y auditable
- Vista previa del reparto disponible en el panel admin

### Sistema de puntuación (configurable)
| Acierto | Fase de grupos | Eliminatorias |
|---|---|---|
| Marcador exacto | 3 pts | 3 pts |
| Resultado correcto | 1 pt | — |
| Ganador correcto | — | 2 pts |

---

## 🚀 Deploy a Producción (Vercel)

```bash
# 1. Subir a GitHub
git init
git add .
git commit -m "feat: quiniela mundial 2026"
git push origin main

# 2. Conectar en Vercel
# Ir a https://vercel.com → New Project → importar repo de GitHub

# 3. Agregar variables de entorno en Vercel
# Project Settings → Environment Variables → agregar las mismas de .env.local

# 4. Deploy automático con cada git push ✅
```

---

## 📋 Comandos útiles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run start        # Servidor de producción local
npm run lint         # Verificar errores
npm run db:types     # Regenerar tipos TypeScript desde Supabase
```

---

## 🛠️ Tecnologías

| Tech | Versión | Uso |
|---|---|---|
| Next.js | 14 | Framework full-stack |
| React | 18 | UI |
| Supabase | v2 | DB + Auth + Realtime |
| Tailwind CSS | 3 | Estilos |
| TypeScript | 5 | Tipado |
| Zod | 3 | Validación de datos |
| date-fns | 3 | Manejo de fechas UTC |

---

## 📞 Soporte

Proyecto desarrollado para **Sabor a Miga** · Mundial 2026
