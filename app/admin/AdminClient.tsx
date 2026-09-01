"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

type Profile = { id: string; email: string; nombre: string; role: string; activo: boolean; created_at: string };

export default function AdminClient({ profiles, encuestas: _encuestas }: { profiles: Profile[], encuestas: any[] }) {
  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Panel Admin — Gestión de usuarios</h1>
          <p className="text-sm text-gray-500">Solo gestión de usuarios. Los filtros e informes están ahora en la sección principal del dashboard.</p>
        </div>
        <a href="/dashboard" className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50">← Volver al dashboard</a>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-4">
        💡 <b>Filtros movidos:</b> Para filtrar por operador, valoración, fecha o chat y exportar Excel, ve al <b>Dashboard principal</b> (arriba verás “🔍 Filtros principales”). Este panel queda solo para usuarios.
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold">👥 Usuarios</h2>
        <p className="text-sm text-gray-500 mb-3">Crea usuarios con contraseña y gestiona los existentes. Solo admins pueden crear.</p>
        <UserManager profiles={profiles} />
      </div>
    </main>
  );
}

function UserManager({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", role: "operador", activo: true });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  // Crear usuario
  const [newUser, setNewUser] = useState({ nombre: "", email: "", password: "", role: "operador" });
  const [creating, setCreating] = useState(false);

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setForm({ nombre: p.nombre, role: p.role, activo: p.activo });
    setMsg("");
  };
  const cancel = () => setEditingId(null);

  const save = async (id: string) => {
    if (!form.nombre.trim()) { setMsg("Nombre obligatorio"); return; }
    setSaving(true);
    const supabase = createClient();
    const { error, data } = await supabase.from("profiles").update({ nombre: form.nombre.trim(), role: form.role, activo: form.activo }).eq("id", id).select().single();
    setSaving(false);
    if (error) { setMsg("Error: " + error.message); return; }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setEditingId(null);
    setMsg("✓ Usuario actualizado");
    setTimeout(()=>setMsg(""),2000);
  };

  const toggleActivo = async (p: Profile) => {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ activo: !p.activo }).eq("id", p.id);
    if (!error) setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x));
  };

  const remove = async (id: string) => {
    if (!confirm("¿Desactivar usuario? (No se borra el login, solo se desactiva. Para borrar definitivo ve a Supabase Auth)")) return;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ activo: false }).eq("id", id);
    if (!error) setProfiles(prev => prev.map(x => x.id === id ? { ...x, activo: false } : x));
  };

  // Reset contraseña
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const resetPassword = async (id: string) => {
    if (!newPass || newPass.length < 6) { setMsg("Nueva contraseña mínimo 6 caracteres"); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(`✓ Contraseña reseteada. Pásale la nueva al usuario: ${newPass}`);
      setResetId(null); setNewPass("");
      setTimeout(()=>setMsg(""),4000);
    } catch (e:any) { setMsg(e.message); }
    finally { setSaving(false); }
  };

  const createUser = async () => {
    if (!newUser.nombre.trim() || !newUser.email.trim() || !newUser.password) { setMsg("Nombre, email y contraseña obligatorios"); return; }
    if (newUser.password.length < 6) { setMsg("Contraseña mínimo 6 caracteres"); return; }
    setCreating(true); setMsg("");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUser.email.trim(), password: newUser.password, nombre: newUser.nombre.trim(), role: newUser.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");
      setMsg(`✓ Usuario creado: ${newUser.email} (contraseña asignada)`);
      // recargar lista: añadir optimistamente
      setProfiles(prev => [...prev, { id: data.userId || Math.random().toString(), email: newUser.email.trim().toLowerCase(), nombre: newUser.nombre.trim(), role: newUser.role, activo: true, created_at: new Date().toISOString() }]);
      setNewUser({ nombre: "", email: "", password: "", role: "operador" });
      setTimeout(()=>setMsg(""),3000);
    } catch (e:any) {
      setMsg(e.message);
    } finally { setCreating(false); }
  };

  return (
    <>
      {/* FORM CREAR USUARIO CON CONTRASEÑA */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-4">
        <h3 className="font-medium text-sm mb-2">➕ Crear nuevo usuario con contraseña</h3>
        <p className="text-xs text-gray-500 mb-3">El usuario entrará con este email y esta contraseña en <code>/login</code>. Se crea confirmado, sin email de verificación.</p>
        <div className="grid md:grid-cols-5 gap-2">
          <input placeholder="Nombre (ej: Ana)" value={newUser.nombre} onChange={e=>setNewUser({...newUser, nombre:e.target.value})} className="border rounded-lg p-2 text-sm" />
          <input placeholder="email@empresa.com" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} className="border rounded-lg p-2 text-sm" />
          <input placeholder="Contraseña (mín 6)" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} className="border rounded-lg p-2 text-sm" />
          <select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})} className="border rounded-lg p-2 text-sm"><option value="operador">operador</option><option value="admin">admin</option></select>
          <button onClick={createUser} disabled={creating} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-black disabled:opacity-50">{creating ? "Creando..." : "Crear usuario"}</button>
        </div>
      </div>

      {msg && <div className={`mb-3 p-2 rounded text-sm ${msg.startsWith("✓") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{msg}</div>}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500"><tr><th className="p-2 text-left">Nombre</th><th className="p-2 text-left">Email</th><th className="p-2">Rol</th><th className="p-2">Activo</th><th className="p-2">Alta</th><th className="p-2 text-right">Acciones</th></tr></thead>
          <tbody>
            {profiles.map(p=>(
              <tr key={p.id} className={`border-t ${editingId===p.id ? "bg-yellow-50" : "hover:bg-gray-50"}`}>
                <td className="p-2">
                  {editingId===p.id ? <input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="border rounded px-2 py-1 text-sm w-full" /> : <span className="font-medium">{p.nombre}</span>}
                </td>
                <td className="p-2 text-gray-600">{p.email}</td>
                <td className="p-2 text-center">
                  {editingId===p.id ? <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="border rounded px-2 py-1 text-sm"><option value="operador">operador</option><option value="admin">admin</option></select> : <span className={`px-2 py-1 rounded-full text-xs ${p.role==="admin"?"bg-blue-100 text-blue-700":"bg-gray-100"}`}>{p.role}</span>}
                </td>
                <td className="p-2 text-center">
                  {editingId===p.id ? <label className="text-xs flex items-center justify-center gap-1"><input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo:e.target.checked})} /> Activo</label> : <button onClick={()=>toggleActivo(p)} className={`text-xs px-2 py-1 rounded ${p.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{p.activo ? "✓ Activo" : "✗ Inactivo"}</button>}
                </td>
                <td className="p-2 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString("es-ES")}</td>
                <td className="p-2 text-right">
                  {editingId===p.id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={()=>save(p.id)} disabled={saving} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs disabled:opacity-50">{saving?"Guardando...":"Guardar"}</button>
                      <button onClick={cancel} className="px-3 py-1 border rounded text-xs">Cancelar</button>
                    </div>
                  ) : resetId===p.id ? (
                    <div className="flex gap-1 justify-end items-center">
                      <input autoFocus placeholder="Nueva pass" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="border rounded px-2 py-1 text-xs w-28" />
                      <button onClick={()=>resetPassword(p.id)} disabled={saving} className="px-2 py-1 bg-amber-600 text-white rounded text-xs disabled:opacity-50">Guardar</button>
                      <button onClick={()=>{setResetId(null); setNewPass("");}} className="px-2 py-1 border rounded text-xs">X</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={()=>startEdit(p)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">✏️ Editar</button>
                      <button onClick={()=>{setResetId(p.id); setNewPass(""); setMsg("");}} className="px-2 py-1 bg-amber-500 text-white rounded text-xs">🔑 Reset</button>
                      <button onClick={()=>remove(p.id)} className="px-2 py-1 text-red-600 hover:underline text-xs">Desact.</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">Tip: Usa 🔑 Reset para ponerle una nueva contraseña al usuario sin ir a Supabase. Se la comunicas tú y él entra con ella en /login.</p>
    </>
  );
}
