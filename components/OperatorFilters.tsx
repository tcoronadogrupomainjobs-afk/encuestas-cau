"use client";
import { useMemo, useState } from "react";
import { ValoracionBars, EvolucionLine } from "./DashboardCharts";
import ObservacionCell from "./ObservacionCell";
import { createClient } from "@/lib/supabase";

type Encuesta = { id: string; chat_nombre: string; fecha: string; hora: string; valoracion: number; observaciones?: string | null; operador_id: string };

export default function OperatorFilters({ encuestas: initial }: { encuestas: Encuesta[] }) {
  const [encuestas, setEncuestas] = useState(initial);
  const [fValor, setFValor] = useState("todos");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fTexto, setFTexto] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editObs, setEditObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const startEdit = (e: Encuesta) => { setEditingId(e.id); setEditObs(e.observaciones || ""); setMsg(""); };
  const cancelEdit = () => { setEditingId(null); setEditObs(""); };
  const saveObs = async (id: string) => {
    if (editObs.length > 2000) { setMsg("Máximo 2000 caracteres"); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("encuestas").update({ observaciones: editObs.trim() || null }).eq("id", id);
    setSaving(false);
    if (error) { setMsg("Error: " + error.message); return; }
    setEncuestas(prev => prev.map(x => x.id === id ? { ...x, observaciones: editObs.trim() || null } : x));
    setEditingId(null);
    setMsg("✓ Observación actualizada");
    setTimeout(()=>setMsg(""),2000);
  };

  const filtradas = useMemo(() => encuestas.filter(e => {
    if (fValor !== "todos" && String(e.valoracion) !== fValor) return false;
    if (fDesde && e.fecha < fDesde) return false;
    if (fHasta && e.fecha > fHasta) return false;
    if (fTexto) {
      const q = fTexto.toLowerCase();
      const hay = e.chat_nombre.toLowerCase().includes(q) || (e.observaciones || "").toLowerCase().includes(q);
      if (!hay) return false;
    }
    return true;
  }), [encuestas, fValor, fDesde, fHasta, fTexto]);

  const total = filtradas.length;
  const media = total ? (filtradas.reduce((a,b)=>a+b.valoracion,0)/total).toFixed(2) : "-";
  const dist = [1,2,3,4,5].map(v => ({ valor: v, count: filtradas.filter(e=>e.valoracion===v).length }));
  const byDate = new Map<string,{sum:number,count:number}>();
  filtradas.forEach(e=>{ const c=byDate.get(e.fecha)??{sum:0,count:0}; c.sum+=e.valoracion; c.count++; byDate.set(e.fecha,c); });
  const evolucion = Array.from(byDate.entries()).sort((a,b)=>a[0].localeCompare(b[0])).slice(-14).map(([fecha,v])=>({ fecha: fecha.slice(5), media: +(v.sum/v.count).toFixed(2), total: v.count }));

  const limpiar = () => { setFValor("todos"); setFDesde(""); setFHasta(""); setFTexto(""); };

  return (
    <>
      <div className="bg-white p-4 rounded-xl border mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">🔍 Filtros</h3>
          <button onClick={limpiar} className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50">Limpiar</button>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <select value={fValor} onChange={e=>setFValor(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="todos">Todas valoraciones</option>
            <option value="5">5 - Muy satisfecho</option><option value="4">4 - Satisfecho</option><option value="3">3 - Normal</option><option value="2">2 - Poco satisfecho</option><option value="1">1 - Nada satisfecho</option>
          </select>
          <input type="date" value={fDesde} onChange={e=>setFDesde(e.target.value)} className="border rounded-lg p-2 text-sm" />
          <input type="date" value={fHasta} onChange={e=>setFHasta(e.target.value)} className="border rounded-lg p-2 text-sm" />
          <input value={fTexto} onChange={e=>setFTexto(e.target.value)} placeholder="Buscar en chat u observaciones..." className="border rounded-lg p-2 text-sm" />
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span>Total filtrado: <b>{total}</b> / {encuestas.length}</span>
          <span>Media: <b>{media}/5</b></span>
          {(fValor!=="todos"||fDesde||fHasta||fTexto) && <span className="text-amber-600 text-xs">● Filtros activos — KPIs y gráficos reflejan lo filtrado</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">Total (filtrado)</div><div className="text-2xl font-bold">{total}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">Media (filtrada)</div><div className="text-2xl font-bold">{media} <span className="text-sm font-normal">/5</span></div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">5★</div><div className="text-2xl font-bold text-emerald-600">{dist[4].count}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">1-2★</div><div className="text-2xl font-bold text-red-600">{dist[0].count + dist[1].count}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ValoracionBars data={dist} />
        <EvolucionLine data={evolucion} />
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold mb-3">Últimas encuestas (filtradas) <span className="text-xs font-normal text-gray-500">— puedes editar tus observaciones</span></h2>
        {msg && <div className={`mb-3 p-2 rounded text-sm ${msg.startsWith("✓") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{msg}</div>}
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b sticky top-0 bg-white"><tr><th className="p-2 text-left">Chat</th><th className="p-2">Fecha</th><th className="p-2">Hora</th><th className="p-2">Valor</th><th className="p-2 text-left">Obs.</th><th className="p-2"></th></tr></thead>
            <tbody>
              {filtradas.slice(0,200).map(e=>(
                <tr key={e.id} className={`border-b hover:bg-gray-50 ${editingId===e.id ? "bg-yellow-50" : ""}`}>
                  <td className="p-2 font-mono">{e.chat_nombre}</td>
                  <td className="p-2 text-center">{new Date(e.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="p-2 text-center">{e.hora.slice(0,5)}</td>
                  <td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${e.valoracion>=4?"bg-emerald-100 text-emerald-700":e.valoracion===3?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}`}>{e.valoracion}★</span></td>
                  <td className="p-2 text-xs max-w-[260px]">
                    {editingId===e.id ? (
                      <textarea value={editObs} onChange={ev=>setEditObs(ev.target.value)} rows={3} maxLength={2000} placeholder="Opcional — ej: cliente molesto..." className="w-full border rounded px-2 py-1 text-xs resize-y min-h-[64px]" />
                    ) : (
                      <ObservacionCell text={e.observaciones} />
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingId===e.id ? (
                      <div className="flex gap-1">
                        <button onClick={()=>saveObs(e.id)} disabled={saving} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs disabled:opacity-50">Guardar</button>
                        <button onClick={cancelEdit} className="px-2 py-1 border rounded text-xs">X</button>
                      </div>
                    ) : (
                      <button onClick={()=>startEdit(e)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">✏️</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length===0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin resultados para esos filtros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
