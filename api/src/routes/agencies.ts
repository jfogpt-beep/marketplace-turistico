import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// Public: GET /agencies — list
app.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const agencies = await db
    .select({
      id: schema.agencies.id,
      uuid: schema.agencies.uuid,
      businessName: schema.agencies.businessName,
      slug: schema.agencies.slug,
      logoUrl: schema.agencies.logoUrl,
      description: schema.agencies.description,
      country: schema.agencies.country,
      city: schema.agencies.city,
      isVerified: schema.agencies.isVerified,
      listingsUsed: schema.agencies.listingsUsed,
      subscriptionPlan: schema.agencies.subscriptionPlan,
    })
    .from(schema.agencies)
    .where(eq(schema.agencies.isActive, 1))
    .orderBy(desc(schema.agencies.isVerified));

  return c.json({ success: true, data: agencies });
});

// Public: GET /agencies/:slug — detail
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);

  const agencies = await db
    .select()
    .from(schema.agencies)
    .where(eq(schema.agencies.slug, slug))
    .limit(1);

  if (agencies.length === 0) {
    return c.json({ success: false, error: "Agency not found" }, 404);
  }

  const agency = agencies[0];

  // Get listings
  const listings = await db
    .select({
      id: schema.listings.id,
      title: schema.listings.title,
      slug: schema.listings.slug,
      price: schema.listings.price,
      coverImage: schema.listings.coverImage,
      durationDays: schema.listings.durationDays,
      isFeatured: schema.listings.isFeatured,
      avgRating: schema.listings.avgRating,
      reviewCount: schema.listings.reviewCount,
    })
    .from(schema.listings)
    .where(eq(schema.listings.agencyId, agency.id))
    .orderBy(desc(schema.listings.isFeatured));

  // Get average rating from all listings
  const totalReviews = listings.reduce((sum, l) => sum + (l.reviewCount || 0), 0);
  const avgRating = listings.length > 0 && totalReviews > 0
    ? listings.reduce((sum, l) => sum + ((l.avgRating || 0) * (l.reviewCount || 0)), 0) / totalReviews
    : null;

  return c.json({
    success: true,
    data: {
      ...agency,
      listings,
      stats: {
        totalListings: listings.length,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        totalReviews,
      },
    },
  });
});

// Protected: POST /agencies/register — create agency
app.post("/register", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);

  // Check if user already has agency
  const existing = await db
    .select()
    .from(schema.agencies)
    .where(eq(schema.agencies.ownerUserId, user.userId))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ success: false, error: "User already has an agency" }, 409);
  }

  const uuid = crypto.randomUUID();
  const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const result = await db.insert(schema.agencies).values({
    uuid,
    ownerUserId: user.userId,
    businessName: data.businessName,
    slug,
    description: data.description || null,
    website: data.website || null,
    phone: data.phone || null,
    email: data.email || user.email,
    licenseNumber: data.licenseNumber,
    country: data.country || null,
    city: data.city || null,
    address: data.address || null,
    socialLinks: JSON.stringify(data.socialLinks || {}),
    listingsLimit: 5, // basic plan default
    featuredLimit: 0,
  }).returning();

  // Update user role
  await db.update(schema.users)
    .set({ role: "agency_admin" })
    .where(eq(schema.users.id, user.userId));

  return c.json({ success: true, data: result[0] }, 201);
});

// Protected: PUT /agencies/:id — update
app.put("/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);

  const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.id, id)).limit(1);
  if (agencies.length === 0) {
    return c.json({ success: false, error: "Agency not found" }, 404);
  }

  if (user.role !== "admin" && agencies[0].ownerUserId !== user.userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  const updateData: any = { updatedAt: new Date().toISOString() };
  if (data.businessName) updateData.businessName = data.businessName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl) updateData.logoUrl = data.logoUrl;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.socialLinks) updateData.socialLinks = JSON.stringify(data.socialLinks);

  await db.update(schema.agencies).set(updateData).where(eq(schema.agencies.id, id));

  return c.json({ success: true, message: "Agency updated" });
});

export { app as agenciesRouter };
