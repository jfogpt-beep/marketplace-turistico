import { Context, MiddlewareHandler, Next } from "hono";
import { jwtVerify, SignJWT } from "jose";

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export interface TokenPayload {
  sub: string; // user uuid
  userId: number;
  email: string;
  role: string;
  agencyId?: number;
  iat: number;
  exp: number;
}

async function getSecret(env: Record<string, string>): Promise<Uint8Array> {
  const secret = env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createAccessToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  secret: Uint8Array
): Promise<string> {
  return new SignJWT({ sub: payload.sub, userId: payload.userId, email: payload.email, role: payload.role, agencyId: payload.agencyId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(secret);
}

export async function createRefreshToken(
  userId: number,
  secret: Uint8Array
): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string, secret: Uint8Array): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
  return payload as unknown as TokenPayload;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized: missing token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const secret = await getSecret(c.env as any);
    const payload = await verifyAccessToken(token, secret);
    
    // Check if token is blacklisted in KV (logout)
    const blacklistKey = `blacklist:${payload.sub}:${payload.iat}`;
    const isBlacklisted = await c.env.KV_SESSIONS.get(blacklistKey);
    if (isBlacklisted) {
      return c.json({ success: false, error: "Token revoked" }, 401);
    }

    // Attach user to context
    c.set("user", payload);
    await next();
  } catch (err) {
    return c.json({ success: false, error: "Unauthorized: invalid token" }, 401);
  }
};

// Admin-only middleware
export const adminMiddleware: MiddlewareHandler = async (c, next) => {
  const user = c.get("user") as TokenPayload | undefined;
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return c.json({ success: false, error: "Forbidden: admin access required" }, 403);
  }
  await next();
};

// Agency-only middleware
export const agencyMiddleware: MiddlewareHandler = async (c, next) => {
  const user = c.get("user") as TokenPayload | undefined;
  if (!user || !user.agencyId) {
    return c.json({ success: false, error: "Forbidden: agency access required" }, 403);
  }
  await next();
};
