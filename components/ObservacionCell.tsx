"use client";
import { useState } from "react";

export default function ObservacionCell({ text }: { text: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-400">-</span>;
  const isLong = text.length > 40;
  if (!isLong) return <span className="text-xs break-words whitespace-normal">{text}</span>;
  return (
    <div className="text-xs">
      <div className={`${expanded ? "whitespace-normal break-words" : "truncate max-w-[180px]"}`} title={text}>
        {text}
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-blue-600 hover:underline mt-0.5">
        {expanded ? "▲ Ver menos" : "▼ Ver más"}
      </button>
    </div>
  );
}
