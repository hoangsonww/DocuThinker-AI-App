class CostTracker {
  constructor({ dailyBudget = 10, monthlyBudget = 200, logger } = {}) {
    this.dailyBudget = dailyBudget;
    this.monthlyBudget = monthlyBudget;
    this.logger = logger || console;
    this.records = [];
  }

  static PRICING = {
    "claude-sonnet-4-20250514": {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
    "claude-haiku-4-5-20251001": {
      input: 0.8,
      output: 4,
      cacheRead: 0.08,
      cacheWrite: 1,
    },
    "claude-opus-4-20250514": {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite: 18.75,
    },
    "gpt-4": { input: 30, output: 60 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    "gemini-pro": { input: 0.5, output: 1.5 },
    "gemini-1.5-pro": { input: 3.5, output: 10.5 },
  };

  async record({ traceId, intent, tokensUsed, provider, duration, model }) {
    const p = CostTracker.PRICING[model] || {
      input: 1,
      output: 3,
      cacheRead: 0.1,
      cacheWrite: 1.25,
    };
    const cost =
      ((tokensUsed.input || 0) * p.input +
        (tokensUsed.output || 0) * p.output +
        (tokensUsed.cacheRead || 0) * (p.cacheRead || p.input * 0.1) +
        (tokensUsed.cacheCreation || 0) * (p.cacheWrite || p.input * 1.25)) /
      1_000_000;
    const record = {
      traceId,
      intent,
      provider,
      model,
      tokensUsed,
      cost,
      duration,
      timestamp: new Date(),
    };
    this.records.push(record);
    // Evict old records
    if (this.records.length > 10000) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 31);
      this.records = this.records.filter((r) => r.timestamp >= cutoff);
    }
    await this.checkBudget();
    return record;
  }

  async checkBudget() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dailySpend = this.records
      .filter((r) => r.timestamp >= today)
      .reduce((s, r) => s + r.cost, 0);
    const monthlySpend = this.records
      .filter((r) => r.timestamp >= monthStart)
      .reduce((s, r) => s + r.cost, 0);
    if (dailySpend >= this.dailyBudget * 0.8)
      this.logger.warn(
        `[CostTracker] Daily 80%: $${dailySpend.toFixed(2)}/$${this.dailyBudget}`,
      );
    if (monthlySpend >= this.monthlyBudget * 0.8)
      this.logger.warn(
        `[CostTracker] Monthly 80%: $${monthlySpend.toFixed(2)}/$${this.monthlyBudget}`,
      );
    return {
      dailySpend,
      monthlySpend,
      dailyRemaining: this.dailyBudget - dailySpend,
      monthlyRemaining: this.monthlyBudget - monthlySpend,
    };
  }

  getUsageReport(period = "month") {
    const now = new Date();
    let cutoff;
    if (period === "today") {
      cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 31);
    }
    const recent = this.records.filter((r) => r.timestamp >= cutoff);
    const byProvider = {},
      byIntent = {};
    for (const r of recent) {
      if (!byProvider[r.provider])
        byProvider[r.provider] = { cost: 0, requests: 0 };
      byProvider[r.provider].cost += r.cost;
      byProvider[r.provider].requests++;
      if (!byIntent[r.intent]) byIntent[r.intent] = { cost: 0, requests: 0 };
      byIntent[r.intent].cost += r.cost;
      byIntent[r.intent].requests++;
    }
    return {
      period,
      byProvider,
      byIntent,
      totalCost: recent.reduce((s, r) => s + r.cost, 0),
      totalRequests: recent.length,
    };
  }
}

module.exports = { CostTracker };
