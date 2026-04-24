import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "../../components/ImageGallery";
import { StarRating } from "../../components/StarRating";
import { ContactForm } from "../../components/ContactForm";
import { listings } from "../../lib/mock-data";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const listing = listings.find((l) => l.slug === params.slug);
  if (!listing) return { title: "Oferta no encontrada" };
  return {
    title: `${listing.title} — Marketplace Turístico`,
    description: listing.description.slice(0, 160),
  };
}

export default function ListingDetailPage({ params }: { params: { slug: string } }) {
  const listing = listings.find((l) => l.slug === params.slug);
  if (!listing) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/listings" className="hover:text-blue-600">Ofertas</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <ImageGallery images={listing.images || []} />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-2">
              {listing.featured && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                  DESTACADO
                </span>
              )}
              <span className="text-sm text-gray-500">{listing.categoryName}</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>

            <div className="flex items-center gap-4 mb-4">
              <StarRating rating={listing.rating || 0} />
              <span className="text-sm text-gray-500">
                {listing.reviewCount || 0} valoraciones
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">{listing.description}</p>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Destino</p>
                <p className="font-semibold">{listing.destination}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Duración</p>
                <p className="font-semibold">{listing.durationDays} días</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Máx. viajeros</p>
                <p className="font-semibold">{listing.maxTravelers || "No especificado"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Salidas</p>
                <p className="font-semibold">{listing.departureDates?.length || 0} fechas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white border rounded-2xl p-6 sticky top-24">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Precio por persona</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">{listing.price}€</span>
                {listing.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">{listing.originalPrice}€</span>
                )}
              </div>
            </div>

            <Link
              href={`/agencias/${listing.agencySlug}`}
              className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {listing.agencyName?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{listing.agencyName}</p>
                <p className="text-xs text-gray-500">Ver perfil →</p>
              </div>
            </Link>

            <ContactForm listingId={listing.id} />
          </div>
        </aside>
      </div>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TravelAction",
            name: listing.title,
            description: listing.description,
            provider: {
              "@type": "TravelAgency",
              name: listing.agencyName,
            },
            priceSpecification: {
              "@type": "PriceSpecification",
              price: listing.price,
              priceCurrency: "EUR",
            },
          }),
        }}
      />
    </div>
  );
}
