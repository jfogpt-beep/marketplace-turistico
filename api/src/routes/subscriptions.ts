import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware, agencyMiddleware } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();
app.use("*", authMiddleware, agencyMiddleware);

// GET /subscriptions/me — current subscription
app.get("/me", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const subs = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.agencyId, user.agencyId!))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(1);

  const agency = await db
    .select()
    .from(schema.agencies)
    .where(eq(schema.agencies.id, user.agencyId!))
    .limit(1);

  return c.json({
    success: true,
    data: {
      subscription: subs[0] || null,
      plan: agency[0]?.subscriptionPlan || "basic",
      listingsUsed: agency[0]?.listingsUsed || 0,
      listingsLimit: agency[0]?.listingsLimit || 5,
      featuredUsed: agency[0]?.featuredUsed || 0,
      featuredLimit: agency[0]?.featuredLimit || 0,
    },
  });
});

export { app as subscriptionsRouter };
