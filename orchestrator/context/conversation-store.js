class ConversationStore {
  constructor({ tokenBudget, llmClient, logger } = {}) {
    this.tokenBudget = tokenBudget;
    this.llmClient = llmClient;
    this.logger = logger || console;
    this.conversations = new Map();
    this.MAX_CONVERSATIONS = 10000;
  }

  _key(uid, did) {
    return `${uid}:${did || "general"}`;
  }

  getConversation(uid, did) {
    const k = this._key(uid, did);
    if (!this.conversations.has(k))
      this.conversations.set(k, {
        userId: uid,
        documentId: did,
        messages: [],
        summary: null,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        summarizing: false,
      });
    return this.conversations.get(k);
  }

  async addMessage(uid, did, role, content) {
    const conv = this.getConversation(uid, did);
    conv.messages.push({ role, content, timestamp: new Date() });
    conv.messageCount++;
    conv.updatedAt = new Date();
    if (conv.messages.length > 20 && this.llmClient && !conv.summarizing) {
      conv.summarizing = true;
      const old = conv.messages.slice(0, -10);
      conv.messages = conv.messages.slice(-10); // Trim immediately (non-blocking)
      this.summarizeMessages(old, conv.summary)
        .then((summary) => {
          conv.summary = summary;
        })
        .catch(() => {}) // Messages already trimmed; summary stays as-is
        .finally(() => {
          conv.summarizing = false;
        });
    }
    if (this.conversations.size > this.MAX_CONVERSATIONS) {
      const entries = [...this.conversations.entries()].sort(
        (a, b) => a[1].updatedAt - b[1].updatedAt,
      );
      for (const [k] of entries.slice(
        0,
        this.conversations.size - this.MAX_CONVERSATIONS,
      ))
        this.conversations.delete(k);
    }
    return conv;
  }

  buildContextMessages(conv, docText) {
    const msgs = [];
    if (docText) {
      msgs.push({
        role: "user",
        content: `<document_context>\n${docText}\n</document_context>\n\nDocument uploaded.`,
      });
      msgs.push({
        role: "assistant",
        content: "I've read your document. What would you like to know?",
      });
    }
    if (conv.summary) {
      msgs.push({
        role: "user",
        content: `[Previous conversation: ${conv.summary}]`,
      });
      msgs.push({
        role: "assistant",
        content: "I have context. Please continue.",
      });
    }
    msgs.push(
      ...conv.messages.map((m) => ({ role: m.role, content: m.content })),
    );
    return msgs;
  }

  async summarizeMessages(messages, existing) {
    if (!this.llmClient)
      return messages
        .map((m) => `${m.role}: ${String(m.content).substring(0, 100)}`)
        .join("\n");
    try {
      const prompt = existing
        ? `Existing summary:\n${existing}\n\nNew messages:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nUpdate summary (5-8 bullets).`
        : `Summarize (5-8 bullets):\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
      const r = await this.llmClient.call({
        provider: "claude",
        model: "claude-haiku-4-5-20251001",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 500,
      });
      return r.content;
    } catch (e) {
      return messages
        .map((m) => `${m.role}: ${String(m.content).substring(0, 100)}`)
        .join("\n");
    }
  }

  clearConversation(uid, did) {
    this.conversations.delete(this._key(uid, did));
  }
  getConversationCount() {
    return this.conversations.size;
  }
}

module.exports = { ConversationStore };
