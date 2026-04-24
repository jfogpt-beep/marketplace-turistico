import Link from "next/link";
import { notFound } from "next/navigation";
import { StarRating } from "../../components/StarRating";
import { ListingCard } from "../../components/ListingCard";
import { agencies } from "../../lib/mock-data";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const agency = agencies.find((a) => a.slug === params.slug);
  if (!agency) return { title: "Agencia no encontrada" };
  return {
    title: `${agency.name} — Agencia de Viajes`,
    description: agency.description?.slice(0, 160),
  };
}

export default function AgencyPage({ params }: { params: { slug: string } }) {
  const agency = agencies.find((a) => a.slug === params.slug);
  if (!agency) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white border rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl text-blue-600 font-bold">
            {agency.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{agency.name}</h1>
              {agency.verified && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                  ✓ VERIFICADA
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{agency.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>📍 {agency.country}{agency.city ? `, ${agency.city}` : ""}</span>
              {agency.website && (
                <a href={agency.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                  🌐 Sitio web
                </a>
              )}
              {agency.phone && <span>📞 {agency.phone}</span>}
            </div>
          </div>
          <div className="text-right">
            <StarRating rating={agency.averageRating || 0} />
            <p className="text-sm text-gray-500 mt-1">
              {agency.totalListings} ofertas · {agency.yearsActive} años activa
            </p>
          </div>
        </div>
      </div>

      {/* Listings */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Ofertas de {agency.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agency.listings?.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        )) || <p className="text-gray-500 col-span-full">No hay ofertas activas.</p>}
      </div>
    </div>
  );
}
