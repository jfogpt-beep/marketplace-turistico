import Link from "next/link";

const stats = [
  { label: "Usuarios MAU", value: "2,847", icon: "👥" },
  { label: "Anuncios activos", value: "1,234", icon: "📋" },
  { label: "Ingresos mensuales", value: "8,420€", icon: "💰" },
  { label: "Agencias verificadas", value: "156", icon: "✅" },
];

const pendingListings = [
  { id: 1, title: "Safari en Kenia 8 días", agency: "Aventura África", submitted: "Hace 2h" },
  { id: 2, title: "Tour por Japón: Tokio, Kioto, Osaka", agency: "Asia Travels", submitted: "Hace 5h" },
  { id: 3, title: "Escapada a los fiordos noruegos", agency: "Nordic Tours", submitted: "Hace 1d" },
];

const recentReports = [
  { id: 1, listing: "Circuito económico Europa", reason: "Precio incorrecto", reporter: "user_123" },
  { id: 2, listing: "Hotel en Cancún", reason: "Agencia no responde", reporter: "user_456" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-xl p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Moderation */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">⏳ Moderación pendiente ({pendingListings.length})</h2>
            <Link href="/dashboard/admin/listings" className="text-sm text-blue-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingListings.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.agency} · {item.submitted}</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                    ✅ Aprobar
                  </button>
                  <button className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 transition">
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">🚨 Reportes recientes</h2>
            <Link href="/dashboard/admin/reports" className="text-sm text-blue-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="font-medium text-sm text-gray-900">{report.listing}</p>
                <p className="text-xs text-red-600">{report.reason}</p>
                <p className="text-xs text-gray-400 mt-1">Reportado por: {report.reporter}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/admin/agencies", label: "Agencias", icon: "🏢" },
          { href: "/dashboard/admin/categories", label: "Categorías", icon: "📁" },
          { href: "/dashboard/admin/payments", label: "Pagos", icon: "💳" },
          { href: "/dashboard/admin/audit", label: "Audit Log", icon: "📜" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border rounded-xl p-4 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">{link.icon}</div>
            <p className="font-medium text-sm text-gray-900">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
