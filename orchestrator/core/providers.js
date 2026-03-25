class UnifiedLLMClient {
  constructor({ circuitBreaker, logger } = {}) {
    this.circuitBreaker = circuitBreaker;
    this.logger = logger || console;
    this.clients = {};
    if (process.env.ANTHROPIC_API_KEY) {
      try { const A = require("@anthropic-ai/sdk"); this.clients.claude = new A({ apiKey: process.env.ANTHROPIC_API_KEY }); } catch (e) { this.logger.warn("[LLM] Anthropic SDK not available"); }
    }
    if (process.env.GOOGLE_AI_API_KEY) {
      try { const { GoogleGenerativeAI } = require("@google/generative-ai"); this.clients.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY); } catch (e) { this.logger.warn("[LLM] Gemini SDK not available"); }
    }
  }

  async call({ provider, model, messages, maxTokens = 4096, systemPrompt, stream = false, tools, cacheControl, temperature }) {
    if (!this.circuitBreaker.canRequest(provider)) return this.callWithFailover({ provider, model, messages, maxTokens, systemPrompt, tools, temperature });
    try {
      let result;
      if (provider === "claude") result = await this.callClaude({ model, messages, maxTokens, systemPrompt, stream, tools, cacheControl, temperature });
      else if (provider === "gemini") result = await this.callGemini({ model, messages, maxTokens, systemPrompt, temperature });
      else throw new Error(`Unknown provider: ${provider}`);
      this.circuitBreaker.recordSuccess(provider);
      return result;
    } catch (error) { this.circuitBreaker.recordFailure(provider); throw error; }
  }

  async callClaude({ model, messages, maxTokens, systemPrompt, stream, tools, cacheControl, temperature }) {
    if (!this.clients.claude) throw new Error("Anthropic not initialized");
    const params = { model: model || "claude-sonnet-4-20250514", max_tokens: maxTokens, messages: messages.map(m => ({ role: m.role, content: m.content })) };
    if (temperature !== undefined) params.temperature = temperature;
    if (systemPrompt) params.system = cacheControl ? [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }] : systemPrompt;
    if (tools?.length) params.tools = tools;
    if (stream) return this.clients.claude.messages.stream(params);
    const r = await this.clients.claude.messages.create(params);
    return { content: r.content.filter(c => c.type === "text").map(c => c.text).join("\n") || "", provider: "claude", model: r.model, tokensUsed: { input: r.usage.input_tokens, output: r.usage.output_tokens, cacheRead: r.usage.cache_read_input_tokens || 0, cacheCreation: r.usage.cache_creation_input_tokens || 0 }, stopReason: r.stop_reason, toolUse: r.content.filter(c => c.type === "tool_use") };
  }

  async callGemini({ model, messages, maxTokens, systemPrompt, temperature }) {
    if (!this.clients.gemini) throw new Error("Gemini not initialized");
    const gm = this.clients.gemini.getGenerativeModel({ model: model || "gemini-1.5-pro" });
    const config = { maxOutputTokens: maxTokens }; if (temperature !== undefined) config.temperature = temperature;
    const prompt = (systemPrompt ? systemPrompt + "\n\n" : "") + messages.map(m => m.content).join("\n");
    const result = await gm.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: config });
    const resp = result.response;
    return { content: resp.text(), provider: "gemini", model: model || "gemini-1.5-pro", tokensUsed: { input: resp.usageMetadata?.promptTokenCount || 0, output: resp.usageMetadata?.candidatesTokenCount || 0 }, stopReason: "end_turn", toolUse: [] };
  }

  async callWithFailover(options) {
    const order = ["claude", "gemini"].filter(p => p !== options.provider && this.circuitBreaker.canRequest(p) && this.clients[p]);
    for (const fb of order) {
      try {
        let result;
        if (fb === "claude") result = await this.callClaude(options);
        else if (fb === "gemini") result = await this.callGemini(options);
        if (result) { this.circuitBreaker.recordSuccess(fb); return result; }
      } catch (e) { this.circuitBreaker.recordFailure(fb); continue; }
    }
    throw new Error("All LLM providers are unavailable");
  }

  getAvailableProviders() { return Object.keys(this.clients); }
}

module.exports = { UnifiedLLMClient };
