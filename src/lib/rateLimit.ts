import { NextRequest } from 'next/server';

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitTracker>();

export function rateLimit(
  request: NextRequest,
  routePrefix: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
  
  const key = `${routePrefix}:${ip}`;
  const now = Date.now();
  const tracker = cache.get(key);

  // Periodic cache cleanup to avoid memory leak
  if (cache.size > 1000) {
    for (const [k, v] of cache.entries()) {
      if (now > v.resetTime) {
        cache.delete(k);
      }
    }
  }

  if (!tracker) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (now > tracker.resetTime) {
    tracker.count = 1;
    tracker.resetTime = now + windowMs;
    return { success: true, limit, remaining: limit - 1, reset: tracker.resetTime };
  }

  if (tracker.count >= limit) {
    return { success: false, limit, remaining: 0, reset: tracker.resetTime };
  }

  tracker.count++;
  return { success: true, limit, remaining: limit - tracker.count, reset: tracker.resetTime };
}
