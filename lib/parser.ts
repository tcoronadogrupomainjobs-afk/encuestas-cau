/**
 * Parser para el formato copiado desde WhatsApp
 * Formato esperado (tabulado o con espacios):
 * CAU	31/8/2026	09:15	5
 * CAU 31/08/2026 09:15 5
 * 
 * También soporta pegado múltiple línea a línea
 */

export type ParsedRow = {
  chat_nombre: string;
  fecha: string; // YYYY-MM-DD para DB
  fecha_raw: string; // DD/MM/YYYY original
  hora: string; // HH:MM
  valoracion: number; // 1-5
  observaciones?: string; // opcional, 5ª columna si se pega con obs
  original: string;
  error?: string;
};

export function parseEncuestaInput(input: string): ParsedRow[] {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: ParsedRow[] = [];

  for (const line of lines) {
    // Separar por tab o por 2+ espacios o por |
    // Primero intentamos tab
    let parts: string[];
    if (line.includes("\t")) {
      parts = line.split("\t").map(p => p.trim());
    } else if (line.includes("|")) {
      parts = line.split("|").map(p => p.trim());
    } else {
      // split por múltiples espacios
      parts = line.trim().split(/\s{2,}|\s+/);
      // Si split por espacio simple y tenemos 4 partes con fecha como 31/8/2026, funciona
      // Pero chat_nombre puede tener espacios -> heurística:
      // Si parts.length > 4, unimos los primeros hasta que quede fecha
      if (parts.length > 4) {
        // buscar parte que parece fecha
        const fechaIdx = parts.findIndex(p => p.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/));
        if (fechaIdx > 0) {
          const chat = parts.slice(0, fechaIdx).join(" ");
          const resto = parts.slice(fechaIdx);
          parts = [chat, ...resto];
        }
      }
    }

    if (parts.length < 4) {
      results.push({
        chat_nombre: "",
        fecha: "",
        fecha_raw: "",
        hora: "",
        valoracion: 0,
        original: line,
        error: `Formato inválido. Se esperaban 4 columnas (chat, fecha, hora, valoración) y se recibieron ${parts.length}. Ej: CAU  31/8/2026  09:15  5`,
      });
      continue;
    }

    const [chat_nombre, fecha_raw, hora_raw, valor_raw, ...restObs] = parts;
    const observaciones = restObs.join(" ").trim() || undefined; // 5ª columna opcional para observaciones

    // Validar fecha DD/MM/YYYY o D/M/YYYY
    const fechaMatch = fecha_raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!fechaMatch) {
      results.push({
        chat_nombre, fecha: "", fecha_raw, hora: hora_raw, valoracion: 0, original: line,
        error: `Fecha inválida: "${fecha_raw}". Formato esperado DD/MM/YYYY`,
      });
      continue;
    }
    const [, d, m, y] = fechaMatch;
    const fecha = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;

    // Validar hora HH:MM
    const horaMatch = hora_raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!horaMatch) {
      results.push({
        chat_nombre, fecha, fecha_raw, hora: hora_raw, valoracion: 0, original: line,
        error: `Hora inválida: "${hora_raw}". Formato esperado HH:MM`,
      });
      continue;
    }
    const hora = `${horaMatch[1].padStart(2,"0")}:${horaMatch[2]}`;

    // Validar valoración 1-5
    const valoracion = parseInt(valor_raw, 10);
    if (isNaN(valoracion) || valoracion < 1 || valoracion > 5) {
      results.push({
        chat_nombre, fecha, fecha_raw, hora, valoracion: 0, original: line,
        error: `Valoración inválida: "${valor_raw}". Debe ser 1-5`,
      });
      continue;
    }

    results.push({ chat_nombre, fecha, fecha_raw, hora, valoracion, observaciones, original: line });
  }

  return results;
}

// Detecta duplicados dentro del propio pegado
export function detectDuplicates(rows: ParsedRow[]): Set<number> {
  const seen = new Map<string, number>();
  const dupIndices = new Set<number>();
  rows.forEach((r, idx) => {
    if (r.error) return;
    const key = `${r.chat_nombre}|${r.fecha}|${r.hora}`;
    if (seen.has(key)) {
      dupIndices.add(idx);
      dupIndices.add(seen.get(key)!);
    } else {
      seen.set(key, idx);
    }
  });
  return dupIndices;
}
