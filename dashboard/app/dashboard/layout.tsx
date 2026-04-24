import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard — Marketplace Turístico",
};

const navItems = [
  { href: "/dashboard", label: "📊 Resumen", icon: "📊" },
  { href: "/dashboard/listings", label: "📝 Mis Ofertas", icon: "📝" },
  { href: "/dashboard/listings/new", label: "➕ Nueva Oferta", icon: "➕" },
  { href: "/dashboard/messages", label: "💬 Mensajes", icon: "💬" },
  { href: "/dashboard/subscription", label: "💳 Suscripción", icon: "💳" },
  { href: "/dashboard/settings", label: "⚙️ Configuración", icon: "⚙️" },
];

const adminNav = [
  { href: "/dashboard/admin", label: "🛡️ Admin", icon: "🛡️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-600">🌍 Marketplace</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Viajes Europa</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              V
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl border overflow-hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition border-b last:border-b-0"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t" />
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
