class ContextObservability {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.metrics = [];
    this.MAX_HISTORY = 1000;
  }

  record(event) {
    const cw = event.contextWindow || 128000;
    const m = {
      timestamp: new Date(),
      traceId: event.traceId,
      provider: event.provider,
      model: event.model,
      contextWindow: cw,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cacheReadTokens: event.cacheReadTokens || 0,
      cacheWriteTokens: event.cacheWriteTokens || 0,
      utilization: (
        ((event.inputTokens + event.outputTokens) / cw) *
        100
      ).toFixed(1),
      duration: event.duration,
      intent: event.intent,
    };
    this.metrics.push(m);
    if (this.metrics.length > this.MAX_HISTORY)
      this.metrics = this.metrics.slice(-this.MAX_HISTORY);
    if (parseFloat(m.utilization) > 80)
      this.logger.warn(`[ContextObs] High: ${m.utilization}% for ${m.intent}`);
    return m;
  }

  getStats() {
    if (!this.metrics.length) return { message: "No metrics recorded yet" };
    const avg =
      this.metrics.reduce((s, m) => s + parseFloat(m.utilization), 0) /
      this.metrics.length;
    const max = Math.max(...this.metrics.map((m) => parseFloat(m.utilization)));
    const byProvider = {};
    for (const m of this.metrics) {
      if (!byProvider[m.provider])
        byProvider[m.provider] = { count: 0, avgUtil: 0, totalTokens: 0 };
      byProvider[m.provider].count++;
      byProvider[m.provider].avgUtil += parseFloat(m.utilization);
      byProvider[m.provider].totalTokens += m.inputTokens + m.outputTokens;
    }
    for (const p of Object.values(byProvider))
      p.avgUtil = (p.avgUtil / p.count).toFixed(1) + "%";
    return {
      totalRequests: this.metrics.length,
      avgUtilization: avg.toFixed(1) + "%",
      maxUtilization: max.toFixed(1) + "%",
      cacheHitRate:
        (
          (this.metrics.filter((m) => m.cacheReadTokens > 0).length /
            this.metrics.length) *
          100
        ).toFixed(1) + "%",
      byProvider,
    };
  }

  getOpenTelemetryMetrics() {
    return this.metrics.map((m) => ({
      name: "docuthinker.llm.context_utilization",
      value: parseFloat(m.utilization),
      attributes: {
        provider: m.provider,
        model: m.model,
        intent: m.intent,
        traceId: m.traceId,
      },
      timestamp: m.timestamp,
    }));
  }
}

module.exports = { ContextObservability };
