/**
 * Token-bucket rate limiter.
 *
 * Sits alongside the other reliability primitives (circuit breaker, cost
 * tracker, dead-letter queue) and protects the orchestrator's expensive
 * LLM-backed routes from runaway usage / abuse. Each key (by default the client
 * IP) gets its own bucket that holds up to `capacity` tokens and refills at
 * `refillPerSec`. A request consumes `cost` tokens; if the bucket can't cover
 * the cost the request is rejected with the time until enough tokens refill.
 *
 * The clock is injectable (`now`) so behavior is fully deterministic in tests.
 */
class RateLimiter {
  constructor({ capacity = 60, refillPerSec = 1, now } = {}) {
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error("RateLimiter: capacity must be a positive number");
    }
    if (!Number.isFinite(refillPerSec) || refillPerSec <= 0) {
      throw new Error("RateLimiter: refillPerSec must be a positive number");
    }
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.now = now || (() => Date.now());
    this.buckets = new Map(); // key -> { tokens, lastRefill }
  }

  // Lazily creates a bucket (full) and brings its token count up to `now`.
  _refill(key) {
    const ts = this.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: ts };
      this.buckets.set(key, bucket);
      return bucket;
    }
    const elapsedSec = (ts - bucket.lastRefill) / 1000;
    if (elapsedSec > 0) {
      bucket.tokens = Math.min(
        this.capacity,
        bucket.tokens + elapsedSec * this.refillPerSec,
      );
      bucket.lastRefill = ts;
    }
    return bucket;
  }

  /**
   * Attempt to consume `cost` tokens for `key`.
   * @returns {{allowed: boolean, remaining: number, limit: number, retryAfterMs: number}}
   */
  tryConsume(key, cost = 1) {
    const bucket = this._refill(key);
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: bucket.tokens,
        limit: this.capacity,
        retryAfterMs: 0,
      };
    }
    const deficit = cost - bucket.tokens;
    return {
      allowed: false,
      remaining: bucket.tokens,
      limit: this.capacity,
      retryAfterMs: Math.ceil((deficit / this.refillPerSec) * 1000),
    };
  }

  /** Current token count for a key (refilled to now). Unknown keys read full. */
  getState(key) {
    if (!this.buckets.has(key)) {
      return { tokens: this.capacity, capacity: this.capacity };
    }
    const bucket = this._refill(key);
    return { tokens: bucket.tokens, capacity: this.capacity };
  }

  /** Forget a single key's bucket (it will read as full again). */
  reset(key) {
    this.buckets.delete(key);
  }

  /** Forget every bucket. */
  resetAll() {
    this.buckets.clear();
  }

  getStats() {
    return {
      activeKeys: this.buckets.size,
      capacity: this.capacity,
      refillPerSec: this.refillPerSec,
    };
  }
}

/**
 * Express middleware factory backed by a {@link RateLimiter}.
 *
 * @param {RateLimiter} limiter
 * @param {object}   [options]
 * @param {(req)=>string} [options.keyFn]  derive the bucket key (default: req.ip)
 * @param {number}        [options.cost=1] tokens this route consumes
 */
function rateLimitMiddleware(limiter, { keyFn, cost = 1 } = {}) {
  return (req, res, next) => {
    const key = (keyFn ? keyFn(req) : req.ip) || "global";
    const result = limiter.tryConsume(key, cost);

    res.set("X-RateLimit-Limit", result.limit);
    res.set("X-RateLimit-Remaining", Math.max(0, Math.floor(result.remaining)));

    if (!result.allowed) {
      res.set("Retry-After", Math.ceil(result.retryAfterMs / 1000));
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfterMs: result.retryAfterMs,
      });
    }
    return next();
  };
}

module.exports = { RateLimiter, rateLimitMiddleware };
