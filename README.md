# Encuestas CAU — App web de gestión de satisfacción

App para reemplazar el Excel manual que usáis al copiar `CAU  31/8/2026  09:15  5` desde WhatsApp.

## Funcionalidades implementadas

### Autenticación y roles
- **Login con email + contraseña** (Supabase Auth)
- Roles: `admin` (ve todo, gestiona usuarios, informes globales) y `operador` (solo sus datos)
- RLS en Postgres garantiza que un operador no pueda ver/editar datos de otro
- Middleware protege `/dashboard` y `/admin`

### Operador
- **Zona de pegado**: pega una o varias líneas tal cual las copia WhatsApp (tab, espacios, `|`)
  - Parser robusto: detecta `chat_nombre`, `fecha DD/MM/YYYY`, `hora HH:MM`, `valoración 1-5`
  - Previsualización con validación fila a fila
  - **Anti-duplicado**: constraint único `(chat_nombre, fecha, hora)` en BBDD → si intentas meter dos veces `CAU 31/8/2026 09:15 5` da error y te dice cuál está duplicado. También detecta duplicados dentro del mismo pegado.
- **Dashboard personal**: KPIs (total, media, 5★, 1-2★), gráfico de distribución, evolución por día, tabla últimas 200

### Admin
- Ver actividad global y por operador
- Filtros combinables: operador, valoración, rango de fechas, nombre de chat
- **Resumen por operador** (total y media)
- **Exportar a Excel** (`.xlsx` con 2 hojas: datos filtrados + resumen) usando `xlsx`
- Gestión de usuarios: listado de `profiles` (nombre, email, rol, activo). Creación vía Supabase Auth.

### Tiempo real y online
- Supabase es el backend en la nube → acceso simultáneo desde cualquier dispositivo
- Realtime listo (puedes activar Realtime en tabla encuestas para ver inserts sin recargar)

## Stack elegido (por qué)

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend | **Next.js 15 + Tailwind** | Deploy instantáneo en Vercel, SSR, SEO, estándar del mercado |
| Backend/BBDD | **Supabase (Postgres + Auth + RLS)** | Gratis para empezar, Auth integrado, RLS para roles, API lista, Realtime |
| Gráficos | **Recharts** | Ligero, React-native |
| Export | **xlsx (SheetJS)** | Genera Excel en cliente sin servidor |

Alternativas descartadas: Firebase (RLS menos expresivo), Prisma + VPS (más mantenimiento).

## Puesta en marcha (5 min)

### 1. Crear proyecto Supabase
1. Ve a https://supabase.com → New project
2. Copia `Project URL` y `anon key` en `.env.local` (usa `.env.example` como plantilla)
3. Ve a **SQL Editor** → pega y ejecuta `supabase/schema.sql` (crea tablas, RLS, trigger)

### 2. Crear primer admin
1. En Supabase → **Authentication → Add user** → crea `admin@tuempresa.com` con contraseña
2. En **Table Editor → profiles** → busca ese usuario → cambia `role` de `operador` a `admin` y pon `nombre`
3. Crea el resto de operadores igual (quedan como `operador` por defecto)

### 3. Correr en local
```bash
npm install
npm run dev
# abre http://localhost:3000
```

### 4. Desplegar online (gratis)
1. Sube el código a GitHub
2. Ve a https://vercel.com → Import project → conecta repo
3. Añade variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy → ya está online y accesible para todos los operadores en tiempo real

## Esquema de BBDD

```sql
profiles(id uuid FK auth.users, email, nombre, role admin|operador, activo, created_at)
encuestas(id uuid, chat_nombre text, fecha date, hora time, valoracion 1-5, operador_id FK profiles, created_at)
UNIQUE(chat_nombre, fecha, hora)  -- evita duplicados
```

## Flujo operador (día a día)
1. Login → `/dashboard`
2. Pega en el textarea lo copiado de WhatsApp (una o N líneas)
3. Pulsa **Previsualizar** → revisa validación
4. **Guardar** → si es duplicado, la app te avisa y no lo inserta
5. Ves al instante tus KPIs actualizados

## Próximas mejoras sugeridas
- Edición/borrado de encuestas con auditoría
- Import masivo desde Excel antiguo para migrar histórico
- Notificaciones si media < 3.5
- Informe PDF automatizado semanal por email
- Activar Supabase Realtime para que el dashboard admin se actualice sin recargar

## Soporte
Cualquier duda sobre el despliegue, dime y te guío paso a paso. Instala Node.js 20+ desde https://nodejs.org para poder ejecutar `npm install`.
