"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#16a34a"]; // 1..5

export function ValoracionBars({ data }: { data: { valor: number, count: number }[] }) {
  return (
    <div className="bg-white p-4 rounded-xl border">
      <h3 className="font-medium mb-3">Distribución de valoraciones</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="valor" tickFormatter={v => `${v}★`} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[6,6,0,0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EvolucionLine({ data }: { data: { fecha: string, media: number, total: number }[] }) {
  return (
    <div className="bg-white p-4 rounded-xl border">
      <h3 className="font-medium mb-3">Evolución de satisfacción media</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="fecha" />
            <YAxis domain={[1,5]} />
            <Tooltip />
            <Line type="monotone" dataKey="media" stroke="#16a34a" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
