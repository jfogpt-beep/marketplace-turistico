import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../lib/db";
import { authMiddleware, agencyMiddleware } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validation";
import { eq, and, like, gte, lte, desc, asc, sql, count } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// Public: GET /listings — search & filter
const listingsQuerySchema = z.object({
  category: z.string().optional(),
  destination: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "rating", "date"]).default("relevance"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

app.get("/", validationMiddleware(listingsQuerySchema, "query"), async (c) => {
  const filters = c.get("validated");
  const db = createDb(c.env.DB);
  
  const page = filters.page;
  const limit = filters.limit;
  const offset = (page - 1) * limit;
  
  // Build conditions
  const conditions = [
    eq(schema.listings.status, "published"),
  ];
  
  if (filters.category) {
    const cat = await db.select().from(schema.categories).where(eq(schema.categories.slug, filters.category)).limit(1);
    if (cat.length > 0) {
      conditions.push(eq(schema.listings.categoryId, cat[0].id));
    }
  }
  
  if (filters.destination) {
    conditions.push(
      sql`${schema.listings.destinationCountry} LIKE ${"%" + filters.destination + "%"} OR ${schema.listings.destinationCity} LIKE ${"%" + filters.destination + "%"}`
    );
  }
  
  if (filters.minPrice !== undefined) {
    conditions.push(gte(schema.listings.price, filters.minPrice));
  }
  
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(schema.listings.price, filters.maxPrice));
  }
  
  if (filters.duration) {
    conditions.push(eq(schema.listings.durationDays, filters.duration));
  }
  
  if (filters.featured) {
    conditions.push(eq(schema.listings.isFeatured, 1));
  }
  
  const whereClause = and(...conditions);
  
  // Sort
  let orderBy;
  switch (filters.sortBy) {
    case "price_asc": orderBy = asc(schema.listings.price); break;
    case "price_desc": orderBy = desc(schema.listings.price); break;
    case "rating": orderBy = desc(schema.listings.avgRating); break;
    case "date": orderBy = desc(schema.listings.publishedAt); break;
    default: orderBy = desc(schema.listings.isFeatured); break;
  }
  
  // Query
  const listings = await db
    .select({
      id: schema.listings.id,
      uuid: schema.listings.uuid,
      title: schema.listings.title,
      slug: schema.listings.slug,
      shortDescription: schema.listings.shortDescription,
      price: schema.listings.price,
      originalPrice: schema.listings.originalPrice,
      currency: schema.listings.currency,
      durationDays: schema.listings.durationDays,
      destinationCountry: schema.listings.destinationCountry,
      destinationCity: schema.listings.destinationCity,
      isFeatured: schema.listings.isFeatured,
      featuredUntil: schema.listings.featuredUntil,
      coverImage: schema.listings.coverImage,
      avgRating: schema.listings.avgRating,
      reviewCount: schema.listings.reviewCount,
      agencyId: schema.listings.agencyId,
      categoryId: schema.listings.categoryId,
      publishedAt: schema.listings.publishedAt,
    })
    .from(schema.listings)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
  
  // Count total
  const totalResult = await db
    .select({ count: count() })
    .from(schema.listings)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);
  
  // Get agency and category names
  const enriched = await Promise.all(
    listings.map(async (listing) => {
      const agency = await db.select({ name: schema.agencies.businessName, slug: schema.agencies.slug, logo: schema.agencies.logoUrl })
        .from(schema.agencies).where(eq(schema.agencies.id, listing.agencyId)).limit(1);
      const category = await db.select({ name: schema.categories.nameEs })
        .from(schema.categories).where(eq(schema.categories.id, listing.categoryId)).limit(1);
      return {
        ...listing,
        agencyName: agency[0]?.name || null,
        agencySlug: agency[0]?.slug || null,
        agencyLogo: agency[0]?.logo || null,
        categoryName: category[0]?.name || null,
      };
    })
  );
  
  return c.json({
    success: true,
    data: enriched,
    meta: { page, limit, total, totalPages },
  });
});

// Public: GET /listings/:slug — detail
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);
  
  const listings = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.slug, slug))
    .limit(1);
  
  if (listings.length === 0) {
    return c.json({ success: false, error: "Listing not found" }, 404);
  }
  
  const listing = listings[0];
  
  // Get images
  const images = await db
    .select()
    .from(schema.listingImages)
    .where(eq(schema.listingImages.listingId, listing.id))
    .orderBy(asc(schema.listingImages.sortOrder));
  
  // Get agency
  const agencies = await db
    .select()
    .from(schema.agencies)
    .where(eq(schema.agencies.id, listing.agencyId))
    .limit(1);
  
  // Get reviews
  const reviews = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.listingId, listing.id))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(10);
  
  // Increment view count
  await db.update(schema.listings)
    .set({ viewCount: sql`${schema.listings.viewCount} + 1` })
    .where(eq(schema.listings.id, listing.id));
  
  return c.json({
    success: true,
    data: {
      ...listing,
      images,
      agency: agencies[0] || null,
      reviews,
    },
  });
});

// Protected: POST /listings — create (agency only)
app.post("/", authMiddleware, agencyMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);
  
  // Check listing limits
  const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.id, user.agencyId!)).limit(1);
  if (agencies.length === 0) {
    return c.json({ success: false, error: "Agency not found" }, 404);
  }
  
  const agency = agencies[0];
  if (agency.listingsUsed >= agency.listingsLimit) {
    return c.json({ success: false, error: "Listing limit reached for your plan" }, 403);
  }
  
  // Create listing
  const uuid = crypto.randomUUID();
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
  
  const result = await db.insert(schema.listings).values({
    uuid,
    agencyId: agency.id,
    categoryId: data.categoryId,
    title: data.title,
    slug,
    description: data.description,
    shortDescription: data.shortDescription || data.description.slice(0, 200),
    destinationCountry: data.destinationCountry,
    destinationCity: data.destinationCity || null,
    durationDays: data.durationDays || null,
    departureDates: JSON.stringify(data.departureDates || []),
    price: data.price,
    currency: data.currency || "EUR",
    originalPrice: data.originalPrice || null,
    maxTravelers: data.maxTravelers || null,
    includes: JSON.stringify(data.includes || []),
    excludes: JSON.stringify(data.excludes || []),
    itinerary: JSON.stringify(data.itinerary || []),
    tags: JSON.stringify(data.tags || []),
    coverImage: data.coverImage || null,
    status: "pending", // requires moderation
    seoTitle: data.seoTitle || data.title,
    seoDescription: data.seoDescription || data.description.slice(0, 160),
  }).returning();
  
  // Update agency listing count
  await db.update(schema.agencies)
    .set({ listingsUsed: agency.listingsUsed + 1 })
    .where(eq(schema.agencies.id, agency.id));
  
  return c.json({ success: true, data: result[0] }, 201);
});

// Protected: PUT /listings/:id — update (agency owner or admin)
app.put("/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);
  
  // Verify ownership
  const listings = await db.select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
  if (listings.length === 0) {
    return c.json({ success: false, error: "Listing not found" }, 404);
  }
  
  const listing = listings[0];
  if (user.role !== "admin" && user.role !== "moderator") {
    const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.id, listing.agencyId)).limit(1);
    if (agencies.length === 0 || agencies[0].ownerUserId !== user.userId) {
      return c.json({ success: false, error: "Not authorized to edit this listing" }, 403);
    }
  }
  
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.shortDescription) updateData.shortDescription = data.shortDescription;
  if (data.price) updateData.price = data.price;
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
  if (data.categoryId) updateData.categoryId = data.categoryId;
  if (data.destinationCountry) updateData.destinationCountry = data.destinationCountry;
  if (data.destinationCity !== undefined) updateData.destinationCity = data.destinationCity;
  if (data.durationDays !== undefined) updateData.durationDays = data.durationDays;
  if (data.departureDates) updateData.departureDates = JSON.stringify(data.departureDates);
  if (data.maxTravelers !== undefined) updateData.maxTravelers = data.maxTravelers;
  if (data.includes) updateData.includes = JSON.stringify(data.includes);
  if (data.excludes) updateData.excludes = JSON.stringify(data.excludes);
  if (data.itinerary) updateData.itinerary = JSON.stringify(data.itinerary);
  if (data.tags) updateData.tags = JSON.stringify(data.tags);
  if (data.coverImage) updateData.coverImage = data.coverImage;
  if (data.seoTitle) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription) updateData.seoDescription = data.seoDescription;
  updateData.updatedAt = new Date().toISOString();
  
  await db.update(schema.listings).set(updateData).where(eq(schema.listings.id, id));
  
  return c.json({ success: true, message: "Listing updated" });
});

// Protected: PATCH /listings/:id/status — change status (admin/moderator only)
app.patch("/:id/status", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const { status, moderationNotes } = await c.req.json();
  
  if (!["published", "rejected", "paused"].includes(status)) {
    return c.json({ success: false, error: "Invalid status" }, 400);
  }
  
  if (user.role !== "admin" && user.role !== "moderator") {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }
  
  const db = createDb(c.env.DB);
  const updateData: any = { status, updatedAt: new Date().toISOString() };
  if (status === "published") updateData.publishedAt = new Date().toISOString();
  if (moderationNotes) updateData.moderationNotes = moderationNotes;
  
  await db.update(schema.listings).set(updateData).where(eq(schema.listings.id, id));
  
  return c.json({ success: true, message: `Listing status updated to ${status}` });
});

// Protected: DELETE /listings/:id (agency owner or admin)
app.delete("/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const db = createDb(c.env.DB);
  
  const listings = await db.select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
  if (listings.length === 0) {
    return c.json({ success: false, error: "Listing not found" }, 404);
  }
  
  const listing = listings[0];
  if (user.role !== "admin") {
    const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.id, listing.agencyId)).limit(1);
    if (agencies.length === 0 || agencies[0].ownerUserId !== user.userId) {
      return c.json({ success: false, error: "Not authorized" }, 403);
    }
  }
  
  await db.delete(schema.listings).where(eq(schema.listings.id, id));
  
  return c.json({ success: true, message: "Listing deleted" });
});

export { app as listingsRouter };
