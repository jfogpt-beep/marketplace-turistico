import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../lib/db";
import { createAccessToken, createRefreshToken, verifyAccessToken } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validation";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

const app = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["traveler", "agency_admin"]).default("traveler"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Utility: hash password using Web Crypto
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const key = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(key);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hash));
  return `${saltB64}$${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split("$");
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const key = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(key);
  const storedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));
  if (hash.length !== storedHash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hash.length; i++) {
    mismatch |= hash[i] ^ storedHash[i];
  }
  return mismatch === 0;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

// POST /auth/register
app.post("/register", validationMiddleware(registerSchema), async (c) => {
  const data = c.get("validated");
  const db = createDb(c.env.DB);
  
  // Check email exists
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
  if (existing.length > 0) {
    return c.json({ success: false, error: "Email already registered" }, 409);
  }
  
  const passwordHash = await hashPassword(data.password);
  const uuid = generateUUID();
  
  const result = await db.insert(schema.users).values({
    uuid,
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    phone: data.phone || null,
    role: data.role,
    isActive: 1,
    emailVerified: 0,
    preferences: JSON.stringify({ lang: "es", currency: "EUR", newsletter: false }),
  }).returning();
  
  const user = result[0];
  
  // Generate tokens
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const accessToken = await createAccessToken({
    sub: user.uuid,
    userId: user.id,
    email: user.email,
    role: user.role,
  }, secret);
  
  const refreshToken = await createRefreshToken(user.id, secret);
  await c.env.KV_SESSIONS.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 7 * 24 * 60 * 60 });
  
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  }, 201);
});

// POST /auth/login
app.post("/login", validationMiddleware(loginSchema), async (c) => {
  const data = c.get("validated");
  const db = createDb(c.env.DB);
  
  const users = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
  if (users.length === 0) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }
  
  const user = users[0];
  if (!user.isActive) {
    return c.json({ success: false, error: "Account suspended" }, 403);
  }
  
  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }
  
  // Update last login
  await db.update(schema.users).set({ lastLoginAt: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  
  // Get agency info if applicable
  let agencyId: number | undefined;
  if (user.role === "agency_admin") {
    const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.ownerUserId, user.id)).limit(1);
    if (agencies.length > 0) agencyId = agencies[0].id;
  }
  
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const accessToken = await createAccessToken({
    sub: user.uuid,
    userId: user.id,
    email: user.email,
    role: user.role,
    agencyId,
  }, secret);
  
  const refreshToken = await createRefreshToken(user.id, secret);
  await c.env.KV_SESSIONS.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 7 * 24 * 60 * 60 });
  
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        agencyId,
      },
      accessToken,
      refreshToken,
    },
  });
});

// POST /auth/refresh
app.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) {
    return c.json({ success: false, error: "Refresh token required" }, 400);
  }
  
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const payload = await verifyAccessToken(refreshToken, secret);
    
    // Verify refresh token in KV
    const stored = await c.env.KV_SESSIONS.get(`refresh:${payload.userId}`);
    if (!stored || stored !== refreshToken) {
      return c.json({ success: false, error: "Invalid refresh token" }, 401);
    }
    
    const db = createDb(c.env.DB);
    const users = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId)).limit(1);
    if (users.length === 0) {
      return c.json({ success: false, error: "User not found" }, 401);
    }
    
    const user = users[0];
    if (!user.isActive) {
      return c.json({ success: false, error: "Account suspended" }, 403);
    }
    
    let agencyId: number | undefined;
    if (user.role === "agency_admin") {
      const agencies = await db.select().from(schema.agencies).where(eq(schema.agencies.ownerUserId, user.id)).limit(1);
      if (agencies.length > 0) agencyId = agencies[0].id;
    }
    
    const newAccessToken = await createAccessToken({
      sub: user.uuid,
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId,
    }, secret);
    
    return c.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch {
    return c.json({ success: false, error: "Invalid refresh token" }, 401);
  }
});

// POST /auth/logout
app.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const payload = await verifyAccessToken(token, secret);
      // Blacklist token in KV (until its natural expiration)
      const ttl = Math.max(0, payload.exp * 1000 - Date.now());
      if (ttl > 0) {
        await c.env.KV_SESSIONS.put(`blacklist:${payload.sub}:${payload.iat}`, "1", { expirationTtl: Math.ceil(ttl / 1000) });
      }
      // Delete refresh token
      await c.env.KV_SESSIONS.delete(`refresh:${payload.userId}`);
    } catch {
      // ignore invalid token on logout
    }
  }
  return c.json({ success: true, message: "Logged out successfully" });
});

export { app as authRouter };
