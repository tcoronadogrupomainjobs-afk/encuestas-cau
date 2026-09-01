import { createServerSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
  const { data: encuestas } = await supabase.from("encuestas").select("*, profiles!encuestas_operador_id_fkey(nombre, email)").order("fecha", { ascending: false }).limit(1000);

  return <AdminClient profiles={profiles ?? []} encuestas={encuestas ?? []} />;
}
