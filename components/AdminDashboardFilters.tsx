"use client";
import { useMemo, useState } from "react";
import { ValoracionBars, EvolucionLine } from "./DashboardCharts";
import ObservacionCell from "./ObservacionCell";
import { createClient } from "@/lib/supabase";
import * as XLSX from "xlsx";

type Encuesta = { id: string; chat_nombre: string; fecha: string; hora: string; valoracion: number; observaciones?: string | null; operador_id: string; created_at?: string; profiles?: { nombre: string } };
type Profile = { id: string; nombre: string; email: string; role: string };

export default function AdminDashboardFilters({ encuestas, profiles }: { encuestas: Encuesta[], profiles: Profile[] }) {
  const [fOperador, setFOperador] = useState("todos");
  const [fValor, setFValor] = useState("todos");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fChat, setFChat] = useState("");
  const [rango, setRango] = useState<7|14|30|90>(30);

  const [localEncuestas, setLocalEncuestas] = useState(encuestas);
  useMemo(()=> setLocalEncuestas(encuestas), [encuestas]);

  const filtradas = useMemo(() => localEncuestas.filter(e => {
    if (fOperador !== "todos" && e.operador_id !== fOperador) return false;
    if (fValor !== "todos" && String(e.valoracion) !== fValor) return false;
    if (fDesde && e.fecha < fDesde) return false;
    if (fHasta && e.fecha > fHasta) return false;
    if (fChat) {
      const q = fChat.toLowerCase();
      const hay = e.chat_nombre.toLowerCase().includes(q) || (e.observaciones || "").toLowerCase().includes(q);
      if (!hay) return false;
    }
    return true;
  }), [localEncuestas, fOperador, fValor, fDesde, fHasta, fChat]);

  const total = filtradas.length;
  const media = total ? (filtradas.reduce((a,b)=>a+b.valoracion,0)/total).toFixed(2) : "-";
  const dist = [1,2,3,4,5].map(v => ({ valor: v, count: filtradas.filter(e=>e.valoracion===v).length }));
  const byDate = new Map<string,{sum:number,count:number}>();
  filtradas.forEach(e=>{ const c=byDate.get(e.fecha)??{sum:0,count:0}; c.sum+=e.valoracion; c.count++; byDate.set(e.fecha,c); });
  const evolucion = Array.from(byDate.entries()).sort((a,b)=>a[0].localeCompare(b[0])).slice(-rango).map(([fecha,v])=>({ fecha: fecha.slice(5), media: +(v.sum/v.count).toFixed(2), total: v.count }));

  const resumenGlobal = useMemo(()=> profiles.filter(p=> (p.role||"").trim().toLowerCase()==="operador").map(p=>{
    const arr=localEncuestas.filter(e=>e.operador_id===p.id);
    const totalG=arr.length;
    const mediaG=totalG ? (arr.reduce((a,b)=>a+b.valoracion,0)/totalG).toFixed(2) : "-";
    const c5=arr.filter(e=>e.valoracion===5).length;
    const c12=arr.filter(e=>e.valoracion<=2).length;
    const ult=arr.length ? arr.slice().sort((a,b)=> (b.fecha+b.hora).localeCompare(a.fecha+a.hora))[0] : null;
    return { ...p, totalG, mediaG, c5, c12, ult };
  }), [localEncuestas, profiles]);

  const porOp = profiles.filter(p=> (p.role||"").trim().toLowerCase()==="operador").map(p=>{
    const arr=filtradas.filter(e=>e.operador_id===p.id);
    return { ...p, total: arr.length, media: arr.length ? (arr.reduce((a,b)=>a+b.valoracion,0)/arr.length).toFixed(2) : "-" };
  });

  const exportar = async () => {
    // Asegurar mapa de nombres: si 'profiles' no llegó (RLS/consulta), lo recuperamos del cliente
    let listaProfiles = profiles;
    if(!listaProfiles || listaProfiles.length===0){
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("id,nombre,email,role");
      if(data) listaProfiles = data;
    }
    const nombreDe = (id:string) => listaProfiles.find(p=>p.id===id)?.nombre || `Desconocido (${String(id).slice(0,8)})`;
    const rows = filtradas.map(e=>({ Chat:e.chat_nombre, Fecha:e.fecha, Hora:e.hora, Valoracion:e.valoracion, Observaciones: e.observaciones || "", Operador: nombreDe(e.operador_id) }));
    const ws=XLSX.utils.json_to_sheet(rows);
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Encuestas");
    const resumen=[{Métrica:"Total filtrado",Valor:total},{Métrica:"Media",Valor:media},...porOp.map(o=>({Métrica:`Total ${o.nombre}`,Valor:o.total}))];
    const ws2=XLSX.utils.json_to_sheet(resumen); XLSX.utils.book_append_sheet(wb,ws2,"Resumen");
    XLSX.writeFile(wb,`encuestas-cau-dashboard-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const limpiar = () => { setFOperador("todos"); setFValor("todos"); setFDesde(""); setFHasta(""); setFChat(""); };
  const nombreOperador = (id:string) => profiles.find(p=>p.id===id)?.nombre || `Desconocido (${id.slice(0,8)})`;

  const borrar = async (id: string) => {
    if (!confirm("¿Eliminar esta encuesta? No se puede deshacer.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("encuestas").delete().eq("id", id);
    if (error) { alert("Error: " + error.message); return; }
    setLocalEncuestas(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2">📊 Resumen rápido por operador <span className="font-normal text-gray-500">(global, sin filtrar)</span></h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {resumenGlobal.map(o=>(
            <div key={o.id} className="bg-white p-3 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm truncate">{o.nombre}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${Number(o.mediaG)>=4.5?"bg-emerald-100 text-emerald-700": Number(o.mediaG)>=3.5?"bg-yellow-100 text-yellow-700": Number(o.mediaG)>=1?"bg-red-100 text-red-700":"bg-gray-100"}`}>{o.mediaG}★</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{o.email}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div><div className="text-gray-500">Total</div><div className="font-bold text-sm">{o.totalG}</div></div>
                <div><div className="text-gray-500">5★</div><div className="font-bold text-emerald-600 text-sm">{o.c5}</div></div>
                <div><div className="text-gray-500">1-2★</div><div className="font-bold text-red-600 text-sm">{o.c12}</div></div>
              </div>
              <div className="mt-1 text-xs text-gray-400">{o.ult ? `Últ: ${new Date(o.ult.fecha).toLocaleDateString("es-ES")} ${o.ult.hora.slice(0,5)} (${o.ult.valoracion}★)` : "Sin datos"}</div>
            </div>
          ))}
          {resumenGlobal.length===0 && <div className="text-sm text-gray-400">Sin operadores</div>}
        </div>
        <div className="mt-2 text-xs text-gray-400">Este resumen es global. Debajo puedes filtrar para ver detalle por fechas/valoraciones.</div>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">🔍 Filtros principales</h3>
          <div className="flex gap-2">
            <button onClick={limpiar} className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50">Limpiar</button>
            <button onClick={exportar} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700">📥 Exportar filtrado</button>
          </div>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          <select value={fOperador} onChange={e=>setFOperador(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="todos">Todos operadores</option>
            {profiles.filter(p=>p.role==="operador").map(p=> <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={fValor} onChange={e=>setFValor(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="todos">Todas valoraciones</option>
            <option value="5">5 - Muy satisfecho</option><option value="4">4 - Satisfecho</option><option value="3">3 - Normal</option><option value="2">2 - Poco satisfecho</option><option value="1">1 - Nada satisfecho</option>
          </select>
          <input type="date" value={fDesde} onChange={e=>setFDesde(e.target.value)} className="border rounded-lg p-2 text-sm" />
          <input type="date" value={fHasta} onChange={e=>setFHasta(e.target.value)} className="border rounded-lg p-2 text-sm" />
          <input value={fChat} onChange={e=>setFChat(e.target.value)} placeholder="Buscar en chat u observaciones..." className="border rounded-lg p-2 text-sm" />
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span>Total filtrado: <b>{total}</b> / {localEncuestas.length}</span>
          <span>Media: <b>{media}/5</b></span>
          { (fOperador!=="todos"||fValor!=="todos"||fDesde||fHasta||fChat) && <span className="text-amber-600 text-xs">● Filtros activos — KPIs, gráficos y tabla reflejan lo filtrado</span> }
        </div>
      </div>

      {porOp.length>0 && (
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {porOp.map(o=>(
            <div key={o.id} className="bg-white p-3 rounded-xl border">
              <div className="font-medium text-sm">{o.nombre}</div>
              <div className="text-xs text-gray-500">{o.email}</div>
              <div className="mt-1 flex gap-3 text-sm"><span>Total: <b>{o.total}</b></span><span>Media: <b>{o.media}</b></span></div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">Total (filtrado)</div><div className="text-2xl font-bold">{total}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">Media (filtrada)</div><div className="text-2xl font-bold">{media} <span className="text-sm font-normal">/5</span></div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">5★ (filtrado)</div><div className="text-2xl font-bold text-emerald-600">{dist[4].count}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500">1-2★ (filtrado)</div><div className="text-2xl font-bold text-red-600">{dist[0].count + dist[1].count}</div></div>
      </div>

      <div className="flex justify-end mb-2">
        <label className="text-xs flex items-center gap-2">Rango evolución:
          <select value={rango} onChange={e=>setRango(Number(e.target.value) as any)} className="border rounded-lg px-2 py-1 text-xs">
            <option value={7}>7 días</option><option value={14}>14 días</option><option value={30}>30 días</option><option value={90}>90 días</option>
          </select>
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ValoracionBars data={dist} />
        <EvolucionLine data={evolucion} />
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold mb-3">Últimas encuestas (filtradas) <span className="text-xs font-normal text-gray-500">— admin puede eliminar</span></h2>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b sticky top-0 bg-white"><tr><th className="p-2 text-left">Chat</th><th className="p-2">Fecha</th><th className="p-2">Hora</th><th className="p-2">Valor</th><th className="p-2 text-left">Obs.</th><th className="p-2 text-left">Operador</th><th className="p-2"></th></tr></thead>
            <tbody>
              {filtradas.slice(0,200).map(e=>(
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono">{e.chat_nombre}</td>
                  <td className="p-2 text-center">{new Date(e.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="p-2 text-center">{e.hora.slice(0,5)}</td>
                  <td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${e.valoracion>=4?"bg-emerald-100 text-emerald-700":e.valoracion===3?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}`}>{e.valoracion}★</span></td>
                  <td className="p-2 text-xs max-w-[220px]"><ObservacionCell text={e.observaciones} /></td>
                  <td className="p-2 text-xs">{nombreOperador(e.operador_id)}</td>
                  <td className="p-2 text-right"><button onClick={()=>borrar(e.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">🗑️ Eliminar</button></td>
                </tr>
              ))}
              {filtradas.length===0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Sin resultados para esos filtros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
