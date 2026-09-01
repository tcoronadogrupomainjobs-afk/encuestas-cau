import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-8 border text-center">
        <h1 className="text-2xl font-bold">Encuestas CAU</h1>
        <p className="text-gray-500 mt-2">Gestión de satisfacción del servicio de atención por WhatsApp (1-5)</p>
        <div className="grid grid-cols-2 gap-3 mt-8">
          <Link href="/login" className="py-3 bg-gray-900 text-white rounded-xl hover:bg-black">Iniciar sesión</Link>
          <Link href="/dashboard" className="py-3 border rounded-xl hover:bg-gray-50">Ir al dashboard</Link>
        </div>
        <div className="mt-6 text-xs text-gray-400">
          Roles: <b>admin</b> (gestión total) y <b>operador</b> (solo sus datos). Control anti-duplicado por fecha+hora.
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-6">Hecho para pegar directo desde WhatsApp: CAU 31/8/2026 09:15 5</p>
    </main>
  );
}
