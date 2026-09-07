/** Tiny in-memory rate limiter for auth endpoints (prototype-grade). */

export interface RateLimiter {
  /** Returns an error message when the caller is over budget, else null. */
  check(key: string): string | null;
}

export function createRateLimiter(windowMs: number, maxAttempts: number): RateLimiter {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): string | null {
      const now = Date.now();
      const entry = attempts.get(key);
      if (!entry || entry.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return null;
      }
      entry.count += 1;
      return entry.count > maxAttempts ? 'Too many attempts. Try again later.' : null;
    },
  };
}
