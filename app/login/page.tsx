"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onLogin} className="w-full max-w-sm bg-white p-6 rounded-xl border shadow">
        <h1 className="text-xl font-bold">Acceso</h1>
        <p className="text-sm text-gray-500 mb-4">Usuario y contraseña asignados por el administrador</p>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@empresa.com" type="email" required className="w-full border rounded-lg p-2.5 mb-3" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" required className="w-full border rounded-lg p-2.5 mb-3" />
        <button type="submit" className="w-full bg-gray-900 text-white py-2.5 rounded-lg hover:bg-black">Entrar</button>
        {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        <p className="text-xs text-gray-400 mt-4">¿Primer admin? Créalo en Supabase Auth y asigna role='admin' en tabla profiles.</p>
      </form>
    </main>
  );
}
