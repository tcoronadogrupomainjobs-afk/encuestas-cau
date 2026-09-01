"use client";
import { useState } from "react";
import { parseEncuestaInput, detectDuplicates, ParsedRow } from "@/lib/parser";
import { createClient } from "@/lib/supabase";

export default function PasteZone({ operadorId }: { operadorId: string }) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onParse = () => {
    const rows = parseEncuestaInput(input);
    setPreview(rows);
    setMsg(null);
  };

  const updateObs = (idx: number, val: string) => {
    setPreview(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: val } : r));
  };

  const onSave = async () => {
    const valid = preview.filter(r => !r.error);
    if (valid.length === 0) {
      setMsg({ type: "err", text: "No hay filas válidas para guardar." });
      return;
    }
    const dupsInBatch = detectDuplicates(preview);
    if (dupsInBatch.size > 0) {
      setMsg({ type: "err", text: `Hay ${dupsInBatch.size} filas duplicadas dentro del lote (misma fecha+hora). Corrige antes de guardar.` });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    // Insert una a una para reportar duplicados por constraint
    let ok = 0, dups = 0, errs = 0;
    const dupDetails: string[] = [];
    
    for (const r of valid) {
      const { error } = await supabase.from("encuestas").insert({
        chat_nombre: r.chat_nombre,
        fecha: r.fecha,
        hora: r.hora,
        valoracion: r.valoracion,
        observaciones: r.observaciones?.trim() || null,
        operador_id: operadorId,
      });
      if (!error) ok++;
      else if (error.code === "23505") { // unique violation
        dups++;
        dupDetails.push(`${r.fecha_raw} ${r.hora} (${r.chat_nombre})`);
      } else {
        errs++;
      }
    }
    
    setLoading(false);
    if (ok > 0) setMsg({ type: "ok", text: `Guardadas ${ok} encuestas. ${dups > 0 ? ` Duplicadas ignoradas: ${dups} (${dupDetails.join(", ")})` : ""} ${errs > 0 ? ` Errores: ${errs}` : ""}` });
    else if (dups > 0) setMsg({ type: "err", text: `Todas duplicadas (control fecha+hora activo). Ya existen: ${dupDetails.join(", ")}` });
    else setMsg({ type: "err", text: `Error al guardar. Revisa permisos.` });

    if (ok > 0) {
      setInput("");
      setPreview([]);
      // refresh dashboard - recarga
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200 p-6 shadow-md">
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-600 text-white rounded-xl p-2.5 text-lg leading-none">📋</div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Añadir encuestas</h2>
          <p className="text-sm text-gray-600">
            Pega aquí lo copiado del botón de WhatsApp. Formato: <code className="bg-white border px-1.5 py-0.5 rounded">CAU  31/8/2026  09:15  5</code> — puedes pegar varias líneas. Añade observación por fila si quieres.
          </p>
        </div>
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={`CAU\t31/8/2026\t09:15\t5\nCAU\t31/8/2026\t09:22\t4`}
        rows={5}
        className="w-full border-2 border-blue-200 rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none bg-white"
        autoFocus
      />

      <div className="flex gap-2 mt-4">
        <button onClick={onParse} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow">
          👁️ Previsualizar
        </button>
        <button onClick={() => { setInput(""); setPreview([]); setMsg(null); }} className="px-4 py-2.5 border bg-white rounded-xl text-sm">
          Limpiar
        </button>
        {preview.length > 0 && (
          <button onClick={onSave} disabled={loading} className="ml-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow">
            {loading ? "Guardando..." : `💾 Guardar ${preview.filter(r=>!r.error).length} válidas`}
          </button>
        )}
      </div>

      {msg && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4 overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Chat</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Hora</th>
                <th className="p-2 text-left">Valor</th>
                <th className="p-2 text-left">Observaciones</th>
                <th className="p-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className={r.error ? "bg-red-50" : "hover:bg-gray-50"}>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2 font-mono">{r.chat_nombre || "-"}</td>
                  <td className="p-2">{r.fecha_raw || r.fecha || "-"}</td>
                  <td className="p-2">{r.hora || "-"}</td>
                  <td className="p-2">{r.valoracion || "-"}</td>
                  <td className="p-1 min-w-[220px]">
                    {!r.error ? (
                      <textarea
                        value={r.observaciones || ""}
                        onChange={e=>updateObs(i, e.target.value)}
                        placeholder="Opcional — ej: cliente molesto, incidencia..."
                        maxLength={2000}
                        rows={3}
                        className="w-full border rounded px-2 py-1 text-xs resize-y min-h-[64px]"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    {r.error ? <span className="text-red-600">{r.error}</span> : <span className="text-emerald-600">✓ Válida</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-2 text-xs text-gray-500">Control anti-duplicado: no se permite repetir mismo chat+fecha+hora. Observaciones opcionales (hasta 1000).</p>
        </div>
      )}
    </div>
  );
}
