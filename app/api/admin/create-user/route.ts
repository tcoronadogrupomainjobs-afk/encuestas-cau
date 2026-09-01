import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // 1. Verificar que quien llama es admin
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabaseAuth.from("profiles").select("role,activo").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || profile.activo === false) {
    return NextResponse.json({ error: "Solo admins activos pueden crear usuarios" }, { status: 403 });
  }

  // 2. Validar payload
  const body = await req.json();
  const { email, password, nombre, role } = body as { email: string; password: string; nombre: string; role: string };
  if (!email || !password || !nombre) return NextResponse.json({ error: "Email, contraseña y nombre obligatorios" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Contraseña mínimo 6 caracteres" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  if (!["admin","operador"].includes(role)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  // 3. Crear usuario con service_role
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true, // no requiere confirmar email
    user_metadata: { nombre: nombre.trim(), role },
  });

  if (error) {
    // traducir duplicado
    if (error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 4. Asegurar profile con nombre/role correcto (el trigger ya lo crea, pero lo actualizamos por si acaso)
  if (data.user) {
    await supabaseAdmin.from("profiles").update({
      nombre: nombre.trim(),
      role,
      activo: true,
      email: email.trim().toLowerCase(),
    }).eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
