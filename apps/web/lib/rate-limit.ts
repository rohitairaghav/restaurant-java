import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting configuration for API endpoints
 * Uses Upstash Redis for distributed rate limiting
 *
 * SETUP REQUIRED:
 * 1. Create Upstash Redis database at https://upstash.com
 * 2. Add environment variables to .env.local:
 *    UPSTASH_REDIS_REST_URL=your-redis-url
 *    UPSTASH_REDIS_REST_TOKEN=your-redis-token
 */

// Create Redis client (only if environment variables are set)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory fallback for development (not suitable for production multi-instance)
const memoryStore = new Map<string, { count: number; reset: number }>();

/**
 * Simple in-memory rate limiter for development
 */
function memoryRateLimit(identifier: string, limit: number, window: number): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const key = identifier;
  const record = memoryStore.get(key);

  if (!record || now > record.reset) {
    memoryStore.set(key, { count: 1, reset: now + window });
    return { success: true, limit, remaining: limit - 1, reset: now + window };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.reset };
  }

  record.count++;
  memoryStore.set(key, record);
  return { success: true, limit, remaining: limit - record.count, reset: record.reset };
}

/**
 * Auth rate limiter: 5 requests per 60 seconds per IP
 * Prevents brute force attacks on authentication endpoints
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : {
      limit: async (identifier: string) => memoryRateLimit(identifier, 5, 60000),
    };

/**
 * API rate limiter: 100 requests per 60 seconds per user
 * General API endpoint protection
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : {
      limit: async (identifier: string) => memoryRateLimit(identifier, 100, 60000),
    };

/**
 * Stock transaction rate limiter: 20 requests per 60 seconds per user
 * Prevents rapid stock manipulation
 */
export const stockRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      analytics: true,
      prefix: 'ratelimit:stock',
    })
  : {
      limit: async (identifier: string) => memoryRateLimit(identifier, 20, 60000),
    };

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check various headers for IP address
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 *
 * @example
 * ```typescript
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: Request) {
 *   const { success, remaining } = await rateLimit(request, 'api');
 *
 *   if (!success) {
 *     return new Response('Too many requests', { status: 429 });
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function rateLimit(
  request: Request,
  type: 'auth' | 'api' | 'stock' = 'api'
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const headers = new Headers(request.headers);
  const ip = getClientIp(headers);
  const identifier = ip;

  let limiter;
  switch (type) {
    case 'auth':
      limiter = authRateLimit;
      break;
    case 'stock':
      limiter = stockRateLimit;
      break;
    default:
      limiter = apiRateLimit;
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
