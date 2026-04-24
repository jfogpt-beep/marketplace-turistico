import Link from "next/link";

const stats = [
  { label: "Visitas totales", value: "12,847", change: "+23%", color: "text-blue-600" },
  { label: "Clicks", value: "3,421", change: "+15%", color: "text-green-600" },
  { label: "Leads generados", value: "89", change: "+8%", color: "text-purple-600" },
  { label: "Conversiones", value: "24", change: "+12%", color: "text-orange-600" },
];

const recentLeads = [
  { name: "María García", email: "maria@example.com", listing: "Circuito Italia 7 días", date: "Hace 2h" },
  { name: "Carlos López", email: "carlos@example.com", listing: "Escapada París", date: "Hace 5h" },
  { name: "Ana Martínez", email: "ana@example.com", listing: "Crucero Caribe", date: "Hace 1d" },
];

const listingsUsed = 8;
const listingsLimit = 20;

export default function DashboardOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className={`text-xs font-medium ${stat.color}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listing Usage */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Anuncios activos</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-900">{listingsUsed}</span>
            <span className="text-sm text-gray-500">de {listingsLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${(listingsUsed / listingsLimit) * 100}%` }}
            />
          </div>
          <Link
            href="/dashboard/listings/new"
            className="inline-block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            ➕ Publicar nueva oferta
          </Link>
        </div>

        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Últimos leads</h2>
          <div className="space-y-3">
            {recentLeads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                  <p className="text-xs text-blue-600 mt-1">{lead.listing}</p>
                </div>
                <span className="text-xs text-gray-400">{lead.date}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/messages" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
            Ver todos los mensajes →
          </Link>
        </div>
      </div>
    </div>
  );
}
