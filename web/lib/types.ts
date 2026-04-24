export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Agency {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  verified: boolean;
  licenseNumber?: string;
  website?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  totalListings?: number;
  averageRating?: number;
  yearsActive?: number;
}

export interface ListingImage {
  id: number;
  listingId: number;
  url: string;
  alt?: string;
  order: number;
}

export interface Listing {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  durationDays: number;
  departureDates: string[]; // ISO dates
  destination: string;
  categoryId: number;
  agencyId: number;
  featured: boolean;
  featuredUntil?: string;
  status: "active" | "inactive" | "pending" | "rejected";
  createdAt: string;
  updatedAt: string;
  category?: Category;
  agency?: Agency;
  images?: ListingImage[];
  rating?: number;
  reviewCount?: number;
}

export interface Review {
  id: number;
  listingId: number;
  userId: number;
  rating: number;
  comment?: string;
  verified: boolean;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface SearchFilters {
  destination?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  departureFrom?: string;
  departureTo?: string;
  minRating?: number;
  featured?: boolean;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "rating" | "date";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  interestedDates?: string;
}
