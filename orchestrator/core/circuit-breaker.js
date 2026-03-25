class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 60000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.circuits = new Map();
  }

  getCircuit(provider) {
    if (!this.circuits.has(provider)) {
      this.circuits.set(provider, {
        state: "CLOSED",
        failures: 0,
        lastFailure: null,
        lastSuccess: null,
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        halfOpenProbeInFlight: false,
      });
    }
    return this.circuits.get(provider);
  }

  canRequest(provider) {
    const c = this.getCircuit(provider);
    if (c.state === "CLOSED") return true;
    if (c.state === "OPEN") {
      if (Date.now() - c.lastFailure >= this.cooldownMs) {
        c.state = "HALF_OPEN";
        c.halfOpenProbeInFlight = true;
        return true;
      }
      return false;
    }
    if (c.state === "HALF_OPEN") {
      if (c.halfOpenProbeInFlight) return false;
      c.halfOpenProbeInFlight = true;
      return true;
    }
    return false;
  }

  recordSuccess(provider) {
    const c = this.getCircuit(provider);
    c.failures = 0;
    c.state = "CLOSED";
    c.lastSuccess = Date.now();
    c.totalRequests++;
    c.totalSuccesses++;
    c.halfOpenProbeInFlight = false;
  }

  recordFailure(provider) {
    const c = this.getCircuit(provider);
    c.failures++;
    c.lastFailure = Date.now();
    c.totalRequests++;
    c.totalFailures++;
    c.halfOpenProbeInFlight = false;
    if (c.failures >= this.failureThreshold) c.state = "OPEN";
  }

  getStatus() {
    const s = {};
    for (const [p, c] of this.circuits) {
      s[p] = {
        state: c.state,
        failures: c.failures,
        uptime:
          c.totalRequests > 0
            ? ((c.totalSuccesses / c.totalRequests) * 100).toFixed(1) + "%"
            : "N/A",
      };
    }
    return s;
  }

  reset(provider) {
    provider ? this.circuits.delete(provider) : this.circuits.clear();
  }
}

module.exports = { CircuitBreaker };
