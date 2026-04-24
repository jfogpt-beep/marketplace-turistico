import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware, agencyMiddleware } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();
app.use("*", authMiddleware, agencyMiddleware);

// GET /payments/history
app.get("/history", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const payments = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.agencyId, user.agencyId!))
    .orderBy(desc(schema.payments.createdAt));

  return c.json({ success: true, data: payments });
});

export { app as paymentsRouter };
