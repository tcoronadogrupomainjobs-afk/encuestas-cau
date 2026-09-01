# Guía SIN INSTALAR NADA - Para ti y tus operadores

> **Nadie necesita instalar Node, npm, ni nada.** Todo se hace desde el navegador. Los operadores solo necesitan abrir un enlace y loguearse.

## Opción A (RECOMENDADA): Despliegue en 10 min sin instalar, solo con navegador

Esta es la que ya tienes preparada en la carpeta, pero sin usar tu PC para compilar.

### Paso 1: Crear base de datos (2 min, solo navegador)
1. Ve a https://supabase.com → Regístrate con Google / email → `New Project`
2. Pon nombre `encuestas-cau`, pon contraseña, elige región `EU (Frankfurt)` → `Create project` (tarda ~1 min)
3. Ve a `SQL Editor` → `New query` → copia TODO el contenido de `supabase/schema.sql` (de esta carpeta) → pega → `Run`
4. Ve a `Project Settings` → `API` → copia: `Project URL` y `anon public key` → guárdalos en un bloc de notas

### Paso 2: Subir el código a GitHub SIN instalar Git (3 min, solo navegador)
1. Ve a https://github.com → Crea cuenta si no tienes → `Create new repository` → nombre `encuestas-cau` → `Public` → `Create`
2. Haz clic en `uploading an existing file` (o `Add file` → `Upload files`)
3. Arrastra TODA la carpeta `Encuestas CAU` (o comprímela en ZIP y arrastra el ZIP) → `Commit changes`
   - *Truco: puedes subir solo arrastrando desde el Explorador de Windows, no necesitas git*

### Paso 3: Ponerla online con Vercel SIN instalar (3 min, solo navegador)
1. Ve a https://vercel.com → `Sign up` con tu cuenta de GitHub
2. `Add New` → `Project` → `Import` el repo `encuestas-cau`
3. En `Environment Variables` añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. `Deploy` → en 1-2 min te da un enlace tipo `https://encuestas-cau.vercel.app`
5. **¡Listo!** Ese enlace es tu app. Pásalo a los operadores. Funciona en móvil, PC, sin instalar.

> Vercel compila en la nube, tu PC no hace nada.

### Paso 4: Crear usuarios (sin que ellos se registren solos)
1. Supabase → `Authentication` → `Users` → `Add user` → `Create new user`
   - Email: `operador1@tuempresa.com` → contraseña que tú elijas → `Create`
   - Repite para cada operador
2. Ve a `Table Editor` → `profiles` → verás los usuarios creados → edita `nombre` (ej: "María") y deja `role` = `operador`
3. Para ti: edita tu usuario y pon `role` = `admin`
4. Pasa a cada operador su email + contraseña. Entran en `https://tu-app.vercel.app/login`

**Los operadores NUNCA instalan nada. Solo abren el enlace.**

---

## Opción B: Aún más simple, sin Vercel ni GitHub - Solo arrastrar un archivo

Si la Opción A te parece mucho, he creado una **versión sin build** en `version-sin-build/index.html`.

Es un único archivo HTML que ya incluye todo (usa Supabase por CDN). No necesita Next.js ni compilar.

### Cómo ponerla online en 1 minuto:
1. Ve a https://app.netlify.com/drop (o https://tiiny.host o https://www.netlify.com con drag & drop)
2. Arrastra el archivo `version-sin-build/index.html` (o la carpeta `version-sin-build`)
3. Te da un enlace público instantáneo. ¡Ya está online!
4. Antes de arrastrar, abre `index.html` con bloc de notas y cambia arriba:
   ```js
   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   const SUPABASE_ANON_KEY = "eyJ...";
   ```
   Pon los mismos de Supabase del Paso 1.

**Ventaja:** No necesitas GitHub ni Vercel. **Desventaja:** Es una versión simplificada (funciona, pero el diseño es más básico que la de Next.js).

---

## Preguntas frecuentes

**¿Los operadores necesitan instalar algo?**
NO. Nunca. Solo Chrome / Edge / Firefox y el enlace.

**¿Necesito instalar algo yo?**
NO, si sigues esta guía. Todo es web.

**¿Y si no quiero ni crear Supabase?**
Podría usar Google Sheets + tu Excel actual, pero perderías control de roles y anti-duplicado robusto. Supabase es gratis y es lo que te da el control real.

**¿Puedo probarla sin desplegar?**
Sí: abre `version-sin-build/index.html` haciendo doble clic en tu PC. Funciona en local sin servidor, solo necesitas internet para conectar a Supabase.

**¿Y si quiero que la despliegues tú?**
Si me das (por privado) el Project URL + anon key, puedo desplegarla y pasarte el enlace final sin que hagas nada.

---

## ¿Qué hago ahora?
1. Elige Opción A (pro) o B (ultra-rápida)
2. Sigue los pasos 1-4 con el navegador
3. Si te atascas, dime en qué paso y te guío con capturas

No necesitas pedir permiso de IT para instalar nada.
