import { createServerSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import PasteZone from "@/components/PasteZone";
import AdminDashboardFilters from "@/components/AdminDashboardFilters";
import OperatorFilters from "@/components/OperatorFilters";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  // Datos
  let query = supabase.from("encuestas").select("*").order("fecha", { ascending: false }).order("hora", { ascending: false }).limit(500);
  if (!isAdmin) query = query.eq("operador_id", user.id);
  const { data: encuestas } = await query;
  const { data: allProfiles } = isAdmin ? await supabase.from("profiles").select("id,nombre,email,role").order("nombre") : { data: [] };

  // Para operador los KPIs los calcula OperatorFilters con filtros

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Hola, {profile?.nombre ?? user.email} <span className="text-xs font-normal bg-gray-900 text-white px-2 py-1 rounded-full ml-2">{profile?.role}</span></h1>
          <p className="text-sm text-gray-500">{isAdmin ? "Vista global (admin) — solo lectura y análisis" : "Vista de operador - solo tus encuestas"} • {(encuestas?.length ?? 0)} encuestas</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Link href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Panel Admin</Link>}
          <form action={async () => { "use server"; const s = await createServerSupabase(); await s.auth.signOut(); redirect("/login"); }}>
            <button className="px-4 py-2 border rounded-lg text-sm">Salir</button>
          </form>
        </div>
      </header>

      {/* OPERADOR: ZONA PEGADO AL PRINCIPIO Y MUY VISIBLE */}
      {!isAdmin && (
        <div className="mb-6">
          <PasteZone operadorId={user.id} />
        </div>
      )}

      {/* ADMIN: Filtros en sección principal */}
      {isAdmin ? (
        <AdminDashboardFilters encuestas={encuestas ?? []} profiles={allProfiles ?? []} />
      ) : (
        <OperatorFilters encuestas={encuestas ?? []} />
      )}

      {/* Mensaje admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-500">
          ℹ️ Como admin no añades encuestas. Solo los operadores pegan sus valoraciones. Usa los filtros de arriba para analizar y exportar.
        </div>
      )}
    </main>
  );
}
