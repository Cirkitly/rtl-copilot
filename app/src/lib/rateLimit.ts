/**
 * Simple in-memory rate limiter for API endpoints
 * For production, use Redis-based rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Time window in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
    retryAfterMs?: number;
}

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean expired entry
    if (entry && entry.resetAt <= now) {
        rateLimitStore.delete(key);
    }

    const currentEntry = rateLimitStore.get(key);

    if (!currentEntry) {
        // First request - create new entry
        const resetAt = now + config.windowMs;
        rateLimitStore.set(key, { count: 1, resetAt });
        return {
            success: true,
            remaining: config.limit - 1,
            resetAt,
        };
    }

    if (currentEntry.count >= config.limit) {
        // Rate limited
        return {
            success: false,
            remaining: 0,
            resetAt: currentEntry.resetAt,
            retryAfterMs: currentEntry.resetAt - now,
        };
    }

    // Increment count
    currentEntry.count++;
    return {
        success: true,
        remaining: config.limit - currentEntry.count,
        resetAt: currentEntry.resetAt,
    };
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    };

    if (result.retryAfterMs) {
        headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000).toString();
    }

    return headers;
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header or falls back to a default
 */
export function getClientId(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'anonymous';
}

// Default rate limit configs
export const LLM_RATE_LIMIT: RateLimitConfig = {
    limit: 50,          // 50 requests
    windowMs: 60 * 60 * 1000,  // per hour
};

export const SIMULATION_RATE_LIMIT: RateLimitConfig = {
    limit: 100,         // 100 requests
    windowMs: 60 * 60 * 1000,  // per hour
};

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        rateLimitStore.forEach((entry, key) => {
            if (entry.resetAt <= now) {
                rateLimitStore.delete(key);
            }
        });
    }, 5 * 60 * 1000);
}
