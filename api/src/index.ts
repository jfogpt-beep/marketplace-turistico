import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";

import { authRouter } from "./routes/auth";
import { listingsRouter } from "./routes/listings";
import { agenciesRouter } from "./routes/agencies";
import { usersRouter } from "./routes/users";
import { messagesRouter } from "./routes/messages";
import { reviewsRouter } from "./routes/reviews";
import { subscriptionsRouter } from "./routes/subscriptions";
import { paymentsRouter } from "./routes/payments";
import { adminRouter } from "./routes/admin";
import { uploadsRouter } from "./routes/uploads";
import { searchRouter } from "./routes/search";

export type Env = {
  Bindings: {
    DB: D1Database;
    KV_SESSIONS: KVNamespace;
    R2_BUCKET: R2Bucket;
    EMAIL_QUEUE: Queue;
    NOTIFICATION_QUEUE: Queue;
    VECTORIZE_INDEX: VectorizeIndex;
    AI: Ai;
    JWT_SECRET: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    RESEND_API_KEY: string;
  };
};

const app = new Hono<Env>();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: ["https://marketplace-turistico.pages.dev", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Public routes
app.route("/auth", authRouter);
app.route("/listings", listingsRouter);
app.route("/agencies", agenciesRouter);
app.route("/search", searchRouter);
app.route("/uploads", uploadsRouter);

// Protected routes (require JWT)
app.use("/users/*", authMiddleware);
app.route("/users", usersRouter);

app.use("/messages/*", authMiddleware);
app.route("/messages", messagesRouter);

app.use("/reviews/*", authMiddleware);
app.route("/reviews", reviewsRouter);

app.use("/subscriptions/*", authMiddleware);
app.route("/subscriptions", subscriptionsRouter);

app.use("/payments/*", authMiddleware);
app.route("/payments", paymentsRouter);

// Admin routes (require admin role)
app.use("/admin/*", authMiddleware);
app.route("/admin", adminRouter);

// Stripe webhooks (special route — no auth, signature verification instead)
app.post("/webhooks/stripe", async (c) => {
  const { handleStripeWebhook, verifyWebhookSignature } = await import("./integrations/stripe/webhooks");
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature") || "";
  
  try {
    const event = await verifyWebhookSignature(payload, signature, c.env.STRIPE_WEBHOOK_SECRET);
    const result = await handleStripeWebhook(event, {
      db: c.env.DB,
      stripeSecretKey: c.env.STRIPE_SECRET_KEY,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: "Webhook verification failed" }, 400);
  }
});

// Error handler (must be last)
app.onError(errorHandler);

export default app;
