class TokenBudgetManager {
  constructor({ logger } = {}) { this.logger = logger || console; }
  static CONTEXT_WINDOWS = { "claude-sonnet-4-20250514": 200000, "claude-haiku-4-5-20251001": 200000, "claude-opus-4-20250514": 200000, "gpt-4": 128000, "gpt-3.5-turbo": 16385, "gemini-pro": 1000000, "gemini-1.5-pro": 2000000 };

  estimateTokens(text) { return text ? Math.ceil(String(text).length / 4) : 0; }

  check({ model, systemPrompt, messages, tools, reserveForOutput = 4096 } = {}) {
    const cw = TokenBudgetManager.CONTEXT_WINDOWS[model] || 128000, avail = cw - reserveForOutput;
    let used = this.estimateTokens(typeof systemPrompt === "string" ? systemPrompt : JSON.stringify(systemPrompt));
    used += (messages || []).reduce((s, m) => s + this.estimateTokens(typeof m.content === "string" ? m.content : JSON.stringify(m.content)), 0);
    used += tools ? this.estimateTokens(JSON.stringify(tools)) : 0;
    const util = (used / cw) * 100;
    return { allowed: used <= avail, used, available: avail, contextWindow: cw, utilization: `${util.toFixed(1)}%`, overflow: used > avail ? used - avail : 0, recommendation: used > avail * 0.8 ? "Consider summarizing conversation history" : null };
  }

  async compactContext({ messages, llmClient, keepLast = 4 }) {
    if (!messages || messages.length <= keepLast + 2) return messages;
    const toKeep = messages.slice(-keepLast);
    try {
      const r = await llmClient.call({ provider: "claude", model: "claude-haiku-4-5-20251001", messages: [{ role: "user", content: `Summarize in 3-5 bullets:\n${messages.slice(0, -keepLast).map(m => `${m.role}: ${String(m.content).substring(0, 500)}`).join("\n")}` }], maxTokens: 500 });
      return [{ role: "user", content: `[Previous conversation: ${r.content}]` }, { role: "assistant", content: "I have context from earlier. Continue." }, ...toKeep];
    } catch (e) { return toKeep; }
  }
}

module.exports = { TokenBudgetManager };
