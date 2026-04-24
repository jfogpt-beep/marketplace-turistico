import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketplace Turístico — Encuentra las mejores ofertas de viaje",
  description: "Descubre paquetes turísticos, hoteles, cruceros y escapadas de las mejores agencias de viajes. Compara precios, lee reseñas y reserva tu próximo viaje.",
  keywords: "viajes, ofertas turísticas, hoteles, cruceros, escapadas, agencias de viajes",
  openGraph: {
    title: "Marketplace Turístico",
    description: "Las mejores ofertas de viaje en un solo lugar",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-blue-600">🌍 Marketplace</a>
            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <a href="/listings" className="text-gray-600 hover:text-blue-600 transition">Ofertas</a>
              <a href="/agencias" className="text-gray-600 hover:text-blue-600 transition">Agencias</a>
              <a href="/dashboard" className="text-gray-600 hover:text-blue-600 transition">Mi cuenta</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-lg font-semibold text-white mb-2">Marketplace Turístico</p>
            <p className="text-sm">Las mejores ofertas de viaje, de las mejores agencias.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
