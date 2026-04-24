import Link from "next/link";
import { FilterSidebar } from "../components/FilterSidebar";
import { ListingCard } from "../components/ListingCard";
import { listings } from "../lib/mock-data";

export const metadata = {
  title: "Ofertas de viaje — Marketplace Turístico",
  description: "Busca y filtra las mejores ofertas de viaje. Paquetes, hoteles, cruceros y más.",
};

export default function ListingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ofertas de viaje</h1>
      <p className="text-gray-600 mb-8">{listings.length} resultados encontrados</p>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="relevance">Relevancia</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-10">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`w-10 h-10 rounded-lg font-medium ${
                  page === 1
                    ? "bg-blue-600 text-white"
                    : "bg-white border text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
