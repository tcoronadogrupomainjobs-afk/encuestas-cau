import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Encuestas CAU - Gestión de Satisfacción",
  description: "Control de valoraciones de atención al cliente por WhatsApp",
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2316a34a%22/><text x=%2250%22 y=%2258%22 text-anchor=%22middle%22 font-size=%2260%22>📋</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>{children}</body>
    </html>
  );
}
