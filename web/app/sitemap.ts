import { MetadataRoute } from "next";
import { listings, agencies } from "../lib/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://marketplace-turistico.pages.dev";

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/listings/`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
  ];

  const listingRoutes = listings.map((listing) => ({
    url: `${baseUrl}/listings/${listing.slug}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const agencyRoutes = agencies.map((agency) => ({
    url: `${baseUrl}/agencies/${agency.slug}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...listingRoutes, ...agencyRoutes];
}