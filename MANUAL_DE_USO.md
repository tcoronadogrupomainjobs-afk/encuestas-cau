# MANUAL DE USO — Encuestas CAU (versión estática Netlify + Supabase)

> **Para despistados, paso a paso y sin tecnicismos.** Guarda este archivo y consúltalo cada vez que dudes.

---

## 1. Qué es y cómo funciona (en 30 segundos)

- **Operadores** pegan lo copiado de WhatsApp (`CAU 31/8/2026 09:15 5 + observación opcional hasta 2000 caracteres`) y lo ven en su dashboard. Solo ven **sus** encuestas, pueden filtrar y editar **solo su observación** con ✏️.
- **Admin** ve **todo** en el dashboard principal: resumen rápido por operador (arriba), filtros que buscan en chat **y** observaciones, gráficos, tabla con `🗑️ Eliminar` por fila y botón `📥 Exportar filtrado` a Excel. En `👥 Gestión usuarios` solo ve/edita usuarios (nombre/rol/activo).
- **Usuario = email**. La contraseña la pones tú. Todo online en `https://tu-app.netlify.app` — sin instalar nada en ningún PC.

---

## 2. Puesta en marcha inicial (solo una vez)

### A. Crear la base de datos (Supabase)
1. Ve a https://supabase.com → Entra → `New Project` → nombre `encuestas-cau` → `Create` (1 min).
2. `SQL Editor` → `New query` → abre en tu PC `supabase/schema.sql` → `Ctrl+A` → `Ctrl+C` → pega en Supabase → `Run` → debe poner `Success`.
   - Si ya lo hiciste y solo quieres actualizar observaciones/límites: ejecuta `alter table public.encuestas add column if not exists observaciones text;`
3. `Project Settings` → `General` → copia `Project URL` (ej: `https://mjetcvrynlnfpayjramz.supabase.co`)
   `Project Settings` → `API Keys` → `Reveal` → copia `anon public` (empieza por `eyJ...`). Guárdalas en un bloc de notas.

### B. Preparar el HTML
1. En tu PC abre `version-sin-build/index.html` con **Bloc de notas**.
2. Arriba verás:
   ```js
   const SUPABASE_URL = "https://mjetcvrynlnfpayjramz.supabase.co";
   const SUPABASE_ANON_KEY = "eyJ...";
   ```
   Pega tu URL y tu anon key, guarda.

### C. Poner online (Netlify Drop, sin GitHub ni Vercel)
1. Ve a https://app.netlify.com/drop
2. Arrastra **la carpeta `version-sin-build`** o solo el `index.html` ya editado.
3. Te da un enlace `https://encuestas-cau-xxxxx.netlify.app` → **esa es tu app**. Pulsa `Make public` si sale la banda negra `Private` abajo.
4. Guarda ese enlace en favoritos y pásalo a los operadores.

> **Actualizar la app cuando yo te mande cambios:** vuelve a editar `index.html` si te doy nuevas keys, y vuelve a arrastrar la carpeta a https://app.netlify.com/drop (sobrescribe). Recarga con `Ctrl+F5`.

---

## 3. Gestión de usuarios (solo Admin)

**Todo se hace en Supabase (no en la app, por seguridad). La app es solo para editar nombre/rol/activo.**

### Crear usuario + contraseña + rol
1. Supabase → `Authentication` → `Users` → `Add user` → `Create new user`
   - `Email`: `maria@tuempresa.com`
   - `Password`: `Cau2026!` (mín 6, anótala para pasársela)
   - Marca `Auto Confirm User` → `Create`
2. `Table Editor` → `profiles` → verás la fila creada → `Edit`
   - `nombre`: `María`
   - `role`: `operador` (o `admin`)
   - `activo`: `true` → `Save`
3. Pásale al operador: enlace + email + contraseña.

**Primer admin:** haz los mismos pasos con `admin@tuempresa.com` y en `profiles` pon `role = admin`.

### Editar nombre/rol/activo después
- `Table Editor` → `profiles` → `Edit` → cambia y `Save`. O desde la app: `Panel Admin → 👥 Gestión usuarios` (solo edita nombre/rol/activo, el email no).

### Resetear contraseña
- `Authentication` → `Users` → en la fila → `...` → `Reset password` / `Send reset` o borra y crea de nuevo con nueva pass. En la app el botón `🔑 Reset` solo funciona en la versión Next.js con `service_role`, en la estática hazlo aquí.

### Desactivar sin borrar
- `profiles` → `activo = false` o en la app `Desact.` → ya no puede entrar aunque sepa la pass.

---

## 4. Uso diario OPERADOR

1. Entra en `https://tu-app.netlify.app` → `email + contraseña` → `Entrar`
2. **Arriba del todo** verás `📋 Añadir encuestas` (fondo azul, muy visible):
   - Pega lo copiado de WhatsApp: `CAU 31/8/2026 09:15 5` o `CAU 31/8/2026 09:15 5 Cliente enfadado...` (5ª columna = observación)
   - Botones `Ej: 1 línea` para probar. Pulsa `👁️ Previsualizar` → ves tabla con estado `✓` o `Ya existe` (anti-duplicado por chat+fecha+hora) y un `textarea` grande por fila para **observaciones (hasta 2000, 3 líneas, redimensionable)`.
   - `💾 Guardar X válidas` → se guardan y ves `Guardadas X` y la tabla se actualiza. Si es duplicada verás `Duplicadas: ...`
3. Debajo: **Filtros (tus encuestas)**: valoración, fechas, `Buscar en chat u observaciones...` (ej: escribe `hostil` y filtra tu observación larga). Pulsa `Limpiar` para quitar.
4. **KPIs + gráficos** se recalculan con lo filtrado.
5. **Tabla `Últimas encuestas`**: verás `Obs.` con `▼ Ver más` si es larga, y `✏️` al lado para **editar solo tu observación** → `Guardar`/`X`. Admin no te ve editar.

> **Observación larga de ejemplo (480 caracteres):**
> `El usuario contacta mostrando una actitud altamente hostil...` cabe entera (ahora 2000). Si te salió cortada antes (`se ni...`) era el límite viejo de 300: edita con `✏️`, pega el texto completo y guarda.

---

## 5. Uso diario ADMIN

1. Entra como `admin@...` → verás:
   - **`📊 Resumen rápido por operador (global, sin filtrar)`** arriba: tarjetas con `Total / 5★ / 1-2★ / Última` y media.
   - **`🔍 Filtros principales`** (operador, valoración, fechas, `Buscar en chat u observaciones...`) + `📥 Exportar filtrado` → baja Excel con lo filtrado (columna Observaciones incluida) + hoja Resumen.
   - `👥 Gestión usuarios` (botón azul arriba) → solo tabla de usuarios, para ver/editar.

2. **Tabla filtrada**: `Obs.` con `▼ Ver más`, `Operador` y `🗑️ Eliminar` por fila (solo admin). Confirma y se borra al instante (KPIs se actualizan).

3. **No verás `Añadir encuestas`**: los admins no añaden, solo analizan.

---

## 6. Exportar a Excel

- Filtra lo que quieres (ej: María + 5★ + agosto) → `📥 Exportar filtrado` → se descarga `encuestas-cau-2026-09-01.xlsx` con 2 hojas si usas la versión Next, o 1 hoja con `Observaciones` en la estática.

---

## 7. Solución de problemas (checklist rápido)

| Problema | Causa | Solución |
|----------|-------|----------|
| Al pulsar `Entrar` no pasa nada + `F12` Console `supabase is not defined` / `SUPABASE_URL` | `SUPABASE_URL` con `/rest/v1/` o `supabase` mal declarado | Abre `index.html`, deja `https://xxx.supabase.co` **sin** `/rest/v1/` y usa `supabaseClient` (ya corregido, re-arrastra) |
| `Invalid API key` | Anon key mal pegada | Copia de nuevo `API Keys` → `anon public` |
| `Viendo 0/0 (filtrado)` y tabla vacía | Filtro activo sin resultados o sin datos | Pulsa `Limpiar` en filtros. Supabase `Table Editor → encuestas` ¿hay filas? |
| Observación sale cortada `se ni...` | Dato viejo guardado con límite 300 | Edita con `✏️`, pega texto completo (ahora 2000) y guarda. Recarga `Ctrl+F5` |
| Sale banda negra `Private / Make public` abajo | Netlify en privado | Pulsa `Make public` |
| `E_RESOLVE react 19` en Vercel | Solo pasa en Next/Vercel | Usa la versión estática por `Drop` (recomendado) o actualiza `package.json` a React 18.3.1 |
| No veo `Paso 1` | Se quitó a petición | Normal, ahora solo `📋 Añadir encuestas` |

**Siempre después de re-arrastrar a Netlify:** recarga la app con `Ctrl+F5` y si es demo borra `Reset demo` o `localStorage`.

---

## 8. Mantenimiento

- **Actualizar app:** te paso nuevo `index.html` → edita URL/keys si hace falta → arrastra a Netlify Drop → listo (2 min).
- **Backup:** Supabase → `Database` → `Backups` (automático) o `Table Editor` → `encuestas` → `Export` CSV.
- **Añadir campo nuevo:** avísame y te preparo el `alter table` + HTML actualizado.

---

## 9. Contacto / Soporte

Si algo falla: abre `F12` → pestaña `Console` → haz captura del error en rojo y mándamela junto con qué usuario/acción hacías.

¡Listo! Guarda este archivo en el escritorio y lo tienes todo.
