const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  
  // Lazy cleanup of stale entries
  for (const [k, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(k);
  }

  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  return { allowed: true, remaining: maxAttempts - entry.count, resetIn: entry.resetAt - now };
}
