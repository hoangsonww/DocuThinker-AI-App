class HandoffManager {
  constructor({ llmClient, logger } = {}) {
    this.llmClient = llmClient;
    this.logger = logger || console;
  }

  async createHandoffContext(source, target, state) {
    return {
      id: `handoff-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: {
        agent: source.name,
        provider: source.provider,
        iterationsUsed: source.iterationsUsed,
      },
      target: { agent: target.name, provider: target.provider },
      context: {
        conversationSummary: await this.summarizeIfNeeded(state.messages),
        documentRef: state.documentRef,
        taskState: {
          completed: state.completedSteps || [],
          remaining: state.remainingSteps || [],
          partialResults: state.partialResults || {},
        },
        userPreferences: state.userPreferences || {},
        handoffReason: state.reason,
      },
    };
  }

  buildHandoffInjection(hc) {
    return `<handoff_context>\nFrom: "${hc.source.agent}"\nReason: ${hc.context.handoffReason}\nSummary: ${hc.context.conversationSummary}\nCompleted: ${JSON.stringify(hc.context.taskState.completed)}\nRemaining: ${JSON.stringify(hc.context.taskState.remaining)}\nPartial: ${JSON.stringify(hc.context.taskState.partialResults, null, 2)}\nContinue from where previous agent left off.\n</handoff_context>`;
  }

  async handoffToPython(hc, endpoint) {
    const r = await fetch(
      `${process.env.AI_ML_SERVICE_URL || "http://localhost:8000"}${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handoff: hc,
          text: hc.context.taskState.partialResults?.text || "",
        }),
      },
    );
    if (!r.ok) throw new Error(`Python service returned ${r.status}`);
    return r.json();
  }

  async summarizeIfNeeded(messages) {
    if (!messages || messages.length <= 5)
      return (
        messages
          ?.map((m) => `${m.role}: ${String(m.content).substring(0, 200)}`)
          .join("\n") || "No prior conversation"
      );
    if (!this.llmClient)
      return messages
        .map((m) => `${m.role}: ${String(m.content).substring(0, 100)}`)
        .join("\n");
    try {
      const r = await this.llmClient.call({
        provider: "claude",
        model: "claude-haiku-4-5-20251001",
        messages: [
          {
            role: "user",
            content: `Summarize in 3-5 bullets:\n${messages.map((m) => `${m.role}: ${String(m.content).substring(0, 500)}`).join("\n")}`,
          },
        ],
        maxTokens: 500,
      });
      return r.content;
    } catch (e) {
      return messages
        .map((m) => `${m.role}: ${String(m.content).substring(0, 100)}`)
        .join("\n");
    }
  }
}

module.exports = { HandoffManager };
