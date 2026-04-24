import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// GET /users/me — current user profile
app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const users = await db.select().from(schema.users).where(eq(schema.users.id, user.userId)).limit(1);
  if (users.length === 0) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  const u = users[0];
  return c.json({
    success: true,
    data: {
      id: u.id,
      uuid: u.uuid,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      preferences: JSON.parse(u.preferences || "{}"),
    },
  });
});

// PUT /users/me — update profile
app.put("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);

  const updateData: any = { updatedAt: new Date().toISOString() };
  if (data.fullName) updateData.fullName = data.fullName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.preferences) updateData.preferences = JSON.stringify(data.preferences);

  await db.update(schema.users).set(updateData).where(eq(schema.users.id, user.userId));

  return c.json({ success: true, message: "Profile updated" });
});

// GET /users/bookmarks — user's saved listings
app.get("/bookmarks", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const bookmarks = await db
    .select({
      id: schema.bookmarks.id,
      listingId: schema.bookmarks.listingId,
      createdAt: schema.bookmarks.createdAt,
    })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.userId))
    .orderBy(desc(schema.bookmarks.createdAt));

  // Get listing details
  const enriched = await Promise.all(
    bookmarks.map(async (b) => {
      const listings = await db
        .select({
          id: schema.listings.id,
          title: schema.listings.title,
          slug: schema.listings.slug,
          price: schema.listings.price,
          coverImage: schema.listings.coverImage,
          durationDays: schema.listings.durationDays,
          destinationCountry: schema.listings.destinationCountry,
        })
        .from(schema.listings)
        .where(eq(schema.listings.id, b.listingId))
        .limit(1);
      return { ...b, listing: listings[0] || null };
    })
  );

  return c.json({ success: true, data: enriched });
});

// POST /users/bookmarks — save listing
app.post("/bookmarks", authMiddleware, async (c) => {
  const user = c.get("user");
  const { listingId } = await c.req.json();
  const db = createDb(c.env.DB);

  try {
    await db.insert(schema.bookmarks).values({
      userId: user.userId,
      listingId,
    });
    return c.json({ success: true, message: "Bookmark added" }, 201);
  } catch {
    return c.json({ success: false, error: "Already bookmarked" }, 409);
  }
});

// DELETE /users/bookmarks/:listingId — remove bookmark
app.delete("/bookmarks/:listingId", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = parseInt(c.req.param("listingId"));
  const db = createDb(c.env.DB);

  await db.delete(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.userId) && eq(schema.bookmarks.listingId, listingId));

  return c.json({ success: true, message: "Bookmark removed" });
});

export { app as usersRouter };
