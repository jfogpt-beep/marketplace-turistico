import Link from "next/link";

const listings = [
  { id: 1, title: "Circuito Roma, Florencia y Venecia 7 días", status: "published", featured: true, price: 899, views: 1240, leads: 12 },
  { id: 2, title: "Escapada fin de semana a París", status: "published", featured: false, price: 299, views: 856, leads: 8 },
  { id: 3, title: "Crucero por el Caribe 10 días", status: "pending", featured: false, price: 1299, views: 0, leads: 0 },
  { id: 4, title: "Tour gastronómico por San Sebastián", status: "paused", featured: false, price: 450, views: 320, leads: 3 },
];

const statusBadge: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  paused: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

export default function ListingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Ofertas</h1>
        <Link
          href="/dashboard/listings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          ➕ Nueva oferta
        </Link>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Oferta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Visitas</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Leads</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{listing.title}</div>
                  {listing.featured && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      DESTACADO
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge[listing.status]}`}>
                    {listing.status === "published" ? "Publicado" : listing.status === "pending" ? "Pendiente" : listing.status === "paused" ? "Pausado" : "Rechazado"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{listing.price}€</td>
                <td className="px-4 py-3 text-gray-500">{listing.views}</td>
                <td className="px-4 py-3 text-gray-500">{listing.leads}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    {listing.status === "published" ? (
                      <button className="text-gray-500 hover:text-gray-700 text-xs font-medium">Pausar</button>
                    ) : listing.status === "paused" ? (
                      <button className="text-green-600 hover:text-green-800 text-xs font-medium">Activar</button>
                    ) : null}
                    <button className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
