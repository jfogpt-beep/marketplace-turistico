import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { eq, and, desc, avg, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// GET /reviews?listingId=X — listing reviews
app.get("/", async (c) => {
  const listingId = c.req.query("listingId");
  if (!listingId) return c.json({ success: false, error: "listingId required" }, 400);

  const db = createDb(c.env.DB);
  const reviews = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.listingId, parseInt(listingId)))
    .orderBy(desc(schema.reviews.createdAt));

  return c.json({ success: true, data: reviews });
});

// POST /reviews — create review
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);

  // Check if user already reviewed this listing
  const existing = await db
    .select()
    .from(schema.reviews)
    .where(and(eq(schema.reviews.listingId, data.listingId), eq(schema.reviews.authorUserId, user.userId)))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ success: false, error: "You already reviewed this listing" }, 409);
  }

  const uuid = crypto.randomUUID();
  const result = await db.insert(schema.reviews).values({
    uuid,
    listingId: data.listingId,
    authorUserId: user.userId,
    rating: data.rating,
    title: data.title || null,
    comment: data.comment,
    isVerified: 0, // requires admin verification
  }).returning();

  // Update listing avg rating
  const avgResult = await db
    .select({ avg: avg(schema.reviews.rating) })
    .from(schema.reviews)
    .where(eq(schema.reviews.listingId, data.listingId));

  const countResult = await db
    .select({ count: sql`count(*)` })
    .from(schema.reviews)
    .where(eq(schema.reviews.listingId, data.listingId));

  await db.update(schema.listings)
    .set({ avgRating: avgResult[0]?.avg || null, reviewCount: countResult[0]?.count || 0 })
    .where(eq(schema.listings.id, data.listingId));

  return c.json({ success: true, data: result[0] }, 201);
});

export { app as reviewsRouter };
