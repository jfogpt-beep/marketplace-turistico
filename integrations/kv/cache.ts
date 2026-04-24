/**
 * Cloudflare KV — Caché de queries frecuentes y rate limiting
 */

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Guarda en caché con TTL
 */
export async function cacheSet(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}

/**
 * Lee de caché
 */
export async function cacheGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const data = await kv.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Invalida una key de caché
 */
export async function cacheDelete(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Verifica si un IP/user ha excedido el rate limit
 * Window: 1 minuto, Max: 100 requests
 */
export async function checkRateLimit(
  kv: KVNamespace,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${identifier}`;
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowKey = `${key}:${windowStart}`;

  const current = await kv.get(windowKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + windowMs,
    };
  }

  await kv.put(windowKey, String(count + 1), { expirationTtl: 60 });

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt: windowStart + windowMs,
  };
}
