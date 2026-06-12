/**
 * Unit tests for the token-bucket RateLimiter and its Express middleware.
 * Run: cd orchestrator && npx jest rate-limiter --no-cache
 *
 * A controllable `now()` clock is injected so refill behavior is deterministic
 * (no real timers / sleeps).
 */

const { RateLimiter, rateLimitMiddleware } = require("../core/rate-limiter");

// Minimal Express res/next stubs so the middleware can be exercised in isolation.
function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(key, value) {
      this.headers[key] = String(value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

// ============ RateLimiter ============
describe("RateLimiter", () => {
  let clock;
  const now = () => clock;

  beforeEach(() => {
    clock = 1_000;
  });

  test("allows requests up to capacity then blocks", () => {
    const rl = new RateLimiter({ capacity: 3, refillPerSec: 1, now });
    expect(rl.tryConsume("a").allowed).toBe(true);
    expect(rl.tryConsume("a").allowed).toBe(true);
    expect(rl.tryConsume("a").allowed).toBe(true);
    expect(rl.tryConsume("a").allowed).toBe(false);
  });

  test("reports remaining tokens and the limit", () => {
    const rl = new RateLimiter({ capacity: 5, refillPerSec: 1, now });
    const first = rl.tryConsume("a");
    expect(first.limit).toBe(5);
    expect(first.remaining).toBe(4);
    expect(rl.tryConsume("a").remaining).toBe(3);
  });

  test("a blocked request reports a positive retryAfterMs", () => {
    const rl = new RateLimiter({ capacity: 1, refillPerSec: 1, now });
    rl.tryConsume("a"); // drains the bucket
    const blocked = rl.tryConsume("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(1000); // 1 token / 1 per sec
  });

  test("refills tokens over time at refillPerSec", () => {
    const rl = new RateLimiter({ capacity: 5, refillPerSec: 1, now });
    for (let i = 0; i < 5; i++) rl.tryConsume("a"); // drain
    expect(rl.tryConsume("a").allowed).toBe(false);

    clock += 2_000; // 2 seconds → +2 tokens
    const after = rl.tryConsume("a");
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(1);
  });

  test("refill never exceeds capacity", () => {
    const rl = new RateLimiter({ capacity: 3, refillPerSec: 10, now });
    rl.tryConsume("a"); // tokens: 2
    clock += 60_000; // would add 600 tokens, but caps at capacity
    expect(rl.getState("a").tokens).toBe(3);
  });

  test("keeps a separate bucket per key", () => {
    const rl = new RateLimiter({ capacity: 1, refillPerSec: 1, now });
    expect(rl.tryConsume("a").allowed).toBe(true);
    expect(rl.tryConsume("a").allowed).toBe(false);
    // A different key is unaffected.
    expect(rl.tryConsume("b").allowed).toBe(true);
  });

  test("supports a cost greater than one", () => {
    const rl = new RateLimiter({ capacity: 10, refillPerSec: 1, now });
    const r = rl.tryConsume("a", 4);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(6);
    // Not enough tokens for a cost of 7 → blocked, bucket unchanged.
    const blocked = rl.tryConsume("a", 7);
    expect(blocked.allowed).toBe(false);
    expect(rl.getState("a").tokens).toBe(6);
  });

  test("getState returns a full bucket for an unknown key", () => {
    const rl = new RateLimiter({ capacity: 4, refillPerSec: 1, now });
    expect(rl.getState("never-seen")).toEqual({ tokens: 4, capacity: 4 });
  });

  test("reset restores a single key; resetAll clears every bucket", () => {
    const rl = new RateLimiter({ capacity: 1, refillPerSec: 1, now });
    rl.tryConsume("a");
    rl.tryConsume("b");
    rl.reset("a");
    expect(rl.tryConsume("a").allowed).toBe(true); // refilled
    expect(rl.tryConsume("b").allowed).toBe(false); // still drained

    rl.resetAll();
    expect(rl.getStats().activeKeys).toBe(0);
  });

  test("getStats reports active keys and configuration", () => {
    const rl = new RateLimiter({ capacity: 7, refillPerSec: 2, now });
    rl.tryConsume("a");
    rl.tryConsume("b");
    expect(rl.getStats()).toEqual({
      activeKeys: 2,
      capacity: 7,
      refillPerSec: 2,
    });
  });

  test("rejects invalid configuration", () => {
    expect(() => new RateLimiter({ capacity: 0 })).toThrow();
    expect(() => new RateLimiter({ capacity: 5, refillPerSec: 0 })).toThrow();
  });
});

// ============ rateLimitMiddleware ============
describe("rateLimitMiddleware", () => {
  let clock;
  const now = () => clock;

  beforeEach(() => {
    clock = 1_000;
  });

  test("allows a request, sets rate-limit headers, and calls next", () => {
    const rl = new RateLimiter({ capacity: 2, refillPerSec: 1, now });
    const mw = rateLimitMiddleware(rl);
    const req = { ip: "1.2.3.4" };
    const res = makeRes();
    let nextCalled = false;

    mw(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.headers["X-RateLimit-Limit"]).toBe("2");
    expect(res.headers["X-RateLimit-Remaining"]).toBe("1");
  });

  test("blocks with 429, Retry-After, and does not call next", () => {
    const rl = new RateLimiter({ capacity: 1, refillPerSec: 1, now });
    const mw = rateLimitMiddleware(rl);
    const req = { ip: "1.2.3.4" };
    let nextCount = 0;
    const next = () => {
      nextCount += 1;
    };

    mw(req, makeRes(), next); // consumes the only token
    const res = makeRes();
    mw(req, res, next); // blocked

    expect(nextCount).toBe(1);
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBe("1");
    expect(res.body.error).toMatch(/rate limit/i);
    expect(res.body.retryAfterMs).toBe(1000);
  });

  test("derives the bucket key from a custom keyFn", () => {
    const rl = new RateLimiter({ capacity: 1, refillPerSec: 1, now });
    const mw = rateLimitMiddleware(rl, {
      keyFn: (req) => req.body.userId,
    });

    let blocked = false;
    mw({ body: { userId: "u1" } }, makeRes(), () => {});
    mw({ body: { userId: "u1" } }, makeRes(), () => {
      blocked = true;
    });
    expect(blocked).toBe(false); // second u1 call was blocked → next not called

    // A different user has an independent bucket.
    let allowed = false;
    mw({ body: { userId: "u2" } }, makeRes(), () => {
      allowed = true;
    });
    expect(allowed).toBe(true);
  });
});
