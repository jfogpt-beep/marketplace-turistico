import Link from "next/link";
import { SearchBar } from "../components/SearchBar";
import { CategoryCard } from "../components/CategoryCard";
import { ListingCard } from "../components/ListingCard";
import { categories, featuredListings } from "../lib/mock-data";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Tu próximo viaje empieza aquí
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Descubre las mejores ofertas de viaje de agencias verificadas. 
            Paquetes, hoteles, cruceros y escapadas al mejor precio.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Explora por categoría
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 py-16 bg-gray-100 rounded-3xl mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Ofertas destacadas</h2>
          <Link href="/listings" className="text-blue-600 font-medium hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* CTA Agencies */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¿Eres una agencia de viajes?
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Publica tus ofertas, recibe leads calificados y haz crecer tu negocio.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Registra tu agencia →
        </Link>
      </section>
    </div>
  );
}
