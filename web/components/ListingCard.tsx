"use client";

import Link from "next/link";
import { StarRating } from "./StarRating";

interface ListingCardProps {
  listing: any;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={listing.coverImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {listing.featured && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            DESTACADO
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded">
          {listing.durationDays} días
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{listing.categoryName || "Viaje"}</span>
          <StarRating rating={listing.rating || 0} size="sm" />
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
          {listing.title}
        </h3>

        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          📍 {listing.destination}
        </p>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-lg font-bold text-blue-600">{listing.price}€</span>
            {listing.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">{listing.originalPrice}€</span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {listing.agencyName}
          </span>
        </div>
      </div>
    </Link>
  );
}
