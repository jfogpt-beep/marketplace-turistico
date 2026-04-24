import { Hono } from "hono";
import { createDb } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

// GET /messages — inbox
app.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const messages = await db
    .select()
    .from(schema.messages)
    .where(sql`${schema.messages.senderUserId} = ${user.userId} OR ${schema.messages.recipientUserId} = ${user.userId}`)
    .orderBy(desc(schema.messages.createdAt));

  const conversations = new Map();
  for (const msg of messages) {
    const otherId = msg.senderUserId === user.userId ? msg.recipientUserId : msg.senderUserId;
    const key = msg.listingId ? `${msg.listingId}-${otherId}` : `direct-${otherId}`;
    if (!conversations.has(key)) {
      conversations.set(key, {
        listingId: msg.listingId,
        otherUserId: otherId,
        latestMessage: msg,
        unreadCount: msg.recipientUserId === user.userId && !msg.isRead ? 1 : 0,
      });
    } else if (msg.recipientUserId === user.userId && !msg.isRead) {
      conversations.get(key).unreadCount++;
    }
  }

  return c.json({ success: true, data: Array.from(conversations.values()) });
});

// GET /messages/:listingId/:userId — thread
app.get("/:listingId/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = parseInt(c.req.param("listingId"));
  const otherUserId = parseInt(c.req.param("userId"));
  const db = createDb(c.env.DB);

  const messages = await db
    .select()
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.listingId, listingId),
        sql`(${schema.messages.senderUserId} = ${user.userId} AND ${schema.messages.recipientUserId} = ${otherUserId}) OR (${schema.messages.senderUserId} = ${otherUserId} AND ${schema.messages.recipientUserId} = ${user.userId})`
      )
    )
    .orderBy(asc(schema.messages.createdAt));

  // Mark as read
  for (const msg of messages) {
    if (msg.recipientUserId === user.userId && !msg.isRead) {
      await db.update(schema.messages).set({ isRead: 1, readAt: new Date().toISOString() }).where(eq(schema.messages.id, msg.id));
    }
  }

  return c.json({ success: true, data: messages });
});

// POST /messages
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();
  const db = createDb(c.env.DB);

  const uuid = crypto.randomUUID();
  const result = await db.insert(schema.messages).values({
    uuid,
    listingId: data.listingId || null,
    senderUserId: user.userId,
    recipientUserId: data.recipientUserId,
    type: data.type || "inquiry",
    subject: data.subject || null,
    body: data.body,
    metadata: JSON.stringify(data.metadata || {}),
  }).returning();

  // Queue notification (non-blocking)
  try {
    await c.env.NOTIFICATION_QUEUE.send({ type: "new_message", recipientId: data.recipientUserId, messageId: result[0].id });
  } catch { /* ignore */ }

  return c.json({ success: true, data: result[0] }, 201);
});

export { app as messagesRouter };
