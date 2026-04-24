export type KVNamespace = KVNamespace;

export const KV_KEYS = {
  refreshToken: (token: string) => `refresh:${token}`,
  userSessions: (userId: number) => `sessions:${userId}`,
  rateLimit: (key: string) => `ratelimit:${key}`,
  emailVerify: (token: string) => `email_verify:${token}`,
  passwordReset: (token: string) => `password_reset:${token}`,
  cache: (key: string) => `cache:${key}`,
} as const;

export async function getRefreshToken(kv: KVNamespace, token: string): Promise<{ userId: number; expiresAt: number } | null> {
  const data = await kv.get(KV_KEYS.refreshToken(token), 'json');
  if (!data) return null;
  const parsed = data as { userId: number; expiresAt: number };
  if (parsed.expiresAt < Date.now()) {
    await kv.delete(KV_KEYS.refreshToken(token));
    return null;
  }
  return parsed;
}

export async function setRefreshToken(kv: KVNamespace, token: string, userId: number, ttlSeconds: number): Promise<void> {
  await kv.put(
    KV_KEYS.refreshToken(token),
    JSON.stringify({ userId, expiresAt: Date.now() + ttlSeconds * 1000 }),
    { expirationTtl: ttlSeconds }
  );
}

export async function deleteRefreshToken(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(KV_KEYS.refreshToken(token));
}

export async function revokeAllUserSessions(kv: KVNamespace, userId: number): Promise<void> {
  await kv.delete(KV_KEYS.userSessions(userId));
}

export async function getCached<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const data = await kv.get(KV_KEYS.cache(key), 'json');
  return data as T | null;
}

export async function setCached<T>(kv: KVNamespace, key: string, value: T, ttlSeconds: number): Promise<void> {
  await kv.put(KV_KEYS.cache(key), JSON.stringify(value), { expirationTtl: ttlSeconds });
}
