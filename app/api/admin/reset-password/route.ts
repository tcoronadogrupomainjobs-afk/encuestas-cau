import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Solo admins activos pueden resetear contraseñas" }, { status: 403 });
  }

  const { userId, newPassword } = await req.json() as { userId: string; newPassword: string };
  if (!userId || !newPassword) return NextResponse.json({ error: "userId y newPassword obligatorios" }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: "Contraseña mínimo 6 caracteres" }, { status: 400 });
  if (userId === user.id) return NextResponse.json({ error: "No puedes resetear tu propia contraseña desde aquí. Usa tu perfil." }, { status: 400 });

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
