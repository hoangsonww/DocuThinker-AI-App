const { getSystemPrompt } = require("./system-prompts");

class PromptCacheStrategy {
  constructor({ logger } = {}) { this.logger = logger || console; this.cacheHits = 0; this.cacheMisses = 0; }

  buildCachedRequest({ systemPromptKey, documentText, userMessage }) {
    const pc = getSystemPrompt(systemPromptKey);
    const req = { model: "claude-sonnet-4-20250514", max_tokens: pc.maxTokens || 4096, system: [{ type: "text", text: pc.prompt, cache_control: { type: "ephemeral" } }], messages: [] };
    if (documentText) { req.messages.push({ role: "user", content: [{ type: "text", text: `<document_context>\n${documentText}\n</document_context>`, cache_control: { type: "ephemeral" } }, { type: "text", text: userMessage }] }); }
    else { req.messages.push({ role: "user", content: userMessage }); }
    return req;
  }

  buildCachedConversation({ systemPromptKey, documentText, conversationHistory, newMessage }) {
    const pc = getSystemPrompt(systemPromptKey);
    const req = { model: "claude-sonnet-4-20250514", max_tokens: pc.maxTokens || 4096, system: [{ type: "text", text: pc.prompt, cache_control: { type: "ephemeral" } }], messages: [] };
    if (documentText) { req.messages.push({ role: "user", content: [{ type: "text", text: `<document_context>\n${documentText}\n</document_context>\n\nI've uploaded a document.`, cache_control: { type: "ephemeral" } }] }); req.messages.push({ role: "assistant", content: "I've read your document. What would you like to know?" }); }
    if (conversationHistory?.length) req.messages.push(...conversationHistory);
    req.messages.push({ role: "user", content: newMessage });
    return req;
  }

  trackCachePerformance(response) {
    const u = response.tokensUsed || response.usage; if (!u) return;
    const cr = u.cacheRead || u.cache_read_input_tokens || 0;
    const cc = u.cacheCreation || u.cache_creation_input_tokens || 0;
    if (cr > 0) this.cacheHits++; else if (cc > 0) this.cacheMisses++;
  }

  getStats() { const t = this.cacheHits + this.cacheMisses; return { cacheHits: this.cacheHits, cacheMisses: this.cacheMisses, hitRate: t > 0 ? ((this.cacheHits / t) * 100).toFixed(1) + "%" : "N/A" }; }
}

module.exports = { PromptCacheStrategy };
