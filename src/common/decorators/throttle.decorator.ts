import { SkipThrottle, Throttle } from '@nestjs/throttler';

/**
 * Skip rate limiting for this endpoint
 */
export const NoThrottle = () => SkipThrottle();

/**
 * Strict rate limiting for sensitive endpoints (login, register)
 * 5 requests per minute
 */
export const StrictThrottle = () => Throttle({ default: { limit: 5, ttl: 60000 } });

/**
 * Relaxed rate limiting for public endpoints
 * 60 requests per minute
 */
export const RelaxedThrottle = () => Throttle({ default: { limit: 60, ttl: 60000 } });

/**
 * Very strict rate limiting for password reset, etc.
 * 3 requests per 5 minutes
 */
export const VeryStrictThrottle = () => Throttle({ default: { limit: 3, ttl: 300000 } });

