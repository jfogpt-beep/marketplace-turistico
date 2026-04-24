import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();
app.use("*", authMiddleware);

// POST /uploads/presigned — get presigned URL for R2 upload
app.post("/presigned", async (c) => {
  const { filename, contentType, listingId } = await c.req.json();
  const user = c.get("user");

  if (!filename || !contentType) {
    return c.json({ success: false, error: "filename and contentType required" }, 400);
  }

  // Validate content type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(contentType)) {
    return c.json({ success: false, error: "Invalid file type. Only images allowed." }, 400);
  }

  // Generate unique key
  const key = `listings/${listingId || "temp"}/${Date.now()}-${filename}`;

  // Create presigned URL (valid for 5 minutes)
  const signedUrl = await c.env.R2_BUCKET.createSignedUrl(key, {
    method: "PUT",
    expirySeconds: 300,
    customMetadata: {
      "content-type": contentType,
      uploadedBy: user.userId.toString(),
    },
  });

  return c.json({
    success: true,
    data: {
      presignedUrl: signedUrl,
      publicUrl: `https://${c.env.R2_BUCKET.name}.r2.dev/${key}`,
      key,
    },
  });
});

// POST /uploads/confirm — confirm upload and save to DB
app.post("/confirm", async (c) => {
  const { key, listingId, altText, isPrimary } = await c.req.json();
  const db = createDb(c.env.DB);

  const uuid = crypto.randomUUID();
  const publicUrl = `https://${c.env.R2_BUCKET.name}.r2.dev/${key}`;

  const result = await db.insert(schema.listingImages).values({
    uuid,
    listingId,
    url: publicUrl,
    thumbnailUrl: publicUrl.replace("/full/", "/thumb/"), // Cloudflare Images variants
    altText: altText || null,
    isPrimary: isPrimary ? 1 : 0,
    sortOrder: 0,
  }).returning();

  // If primary, update listing cover
  if (isPrimary) {
    await db.update(schema.listings)
      .set({ coverImage: publicUrl })
      .where(eq(schema.listings.id, listingId));
  }

  return c.json({ success: true, data: result[0] }, 201);
});

export { app as uploadsRouter };
