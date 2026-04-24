import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { eq, and, desc, count, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();
app.use("*", authMiddleware, adminMiddleware);

// GET /admin/stats — dashboard metrics
app.get("/stats", async (c) => {
  const db = createDb(c.env.DB);

  const [usersCount, agenciesCount, listingsCount, activeListings, reviewsCount, paymentsSum] = await Promise.all([
    db.select({ count: count() }).from(schema.users),
    db.select({ count: count() }).from(schema.agencies),
    db.select({ count: count() }).from(schema.listings),
    db.select({ count: count() }).from(schema.listings).where(eq(schema.listings.status, "published")),
    db.select({ count: count() }).from(schema.reviews),
    db.select({ total: sql`COALESCE(SUM(${schema.payments.amount}), 0)` }).from(schema.payments).where(eq(schema.payments.status, "completed")),
  ]);

  return c.json({
    success: true,
    data: {
      totalUsers: usersCount[0]?.count || 0,
      totalAgencies: agenciesCount[0]?.count || 0,
      totalListings: listingsCount[0]?.count || 0,
      activeListings: activeListings[0]?.count || 0,
      totalReviews: reviewsCount[0]?.count || 0,
      totalRevenue: paymentsSum[0]?.total || 0,
    },
  });
});

// GET /admin/listings/pending — moderation queue
app.get("/listings/pending", async (c) => {
  const db = createDb(c.env.DB);
  const listings = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.status, "pending"))
    .orderBy(desc(schema.listings.createdAt));

  return c.json({ success: true, data: listings });
});

// PATCH /admin/listings/:id/moderate — approve/reject
app.patch("/listings/:id/moderate", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { status, notes } = await c.req.json();
  const db = createDb(c.env.DB);

  const updateData: any = { status, moderationNotes: notes || null, updatedAt: new Date().toISOString() };
  if (status === "published") updateData.publishedAt = new Date().toISOString();

  await db.update(schema.listings).set(updateData).where(eq(schema.listings.id, id));

  return c.json({ success: true, message: `Listing ${status}` });
});

// GET /admin/agencies/pending — agencies needing license verification
app.get("/agencies/pending", async (c) => {
  const db = createDb(c.env.DB);
  const agencies = await db
    .select()
    .from(schema.agencies)
    .where(eq(schema.agencies.licenseVerified, 0))
    .orderBy(desc(schema.agencies.createdAt));

  return c.json({ success: true, data: agencies });
});

// PATCH /admin/agencies/:id/verify
app.patch("/agencies/:id/verify", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { verified } = await c.req.json();
  const db = createDb(c.env.DB);

  await db.update(schema.agencies).set({
    licenseVerified: verified ? 1 : 0,
    licenseVerifiedAt: verified ? new Date().toISOString() : null,
    isVerified: verified ? 1 : 0,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.agencies.id, id));

  return c.json({ success: true, message: `Agency ${verified ? "verified" : "unverified"}` });
});

// PATCH /admin/agencies/:id/suspend
app.patch("/agencies/:id/suspend", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { suspended } = await c.req.json();
  const db = createDb(c.env.DB);

  await db.update(schema.agencies).set({
    isActive: suspended ? 0 : 1,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.agencies.id, id));

  return c.json({ success: true, message: `Agency ${suspended ? "suspended" : "activated"}` });
});

// GET /admin/payments — all payments
app.get("/payments", async (c) => {
  const db = createDb(c.env.DB);
  const payments = await db
    .select()
    .from(schema.payments)
    .orderBy(desc(schema.payments.createdAt));

  return c.json({ success: true, data: payments });
});

// GET /admin/audit-log
app.get("/audit-log", async (c) => {
  const db = createDb(c.env.DB);
  const limit = parseInt(c.req.query("limit") || "50");

  const logs = await db
    .select()
    .from(schema.auditLog)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(limit);

  return c.json({ success: true, data: logs });
});

export { app as adminRouter };
