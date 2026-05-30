const INTENT_MAP = {
  "document.upload": {
    handler: "documentHandler",
    needsAI: true,
    providerPreference: ["gemini", "claude"],
  },
  "document.summarize": {
    handler: "summarizeHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.keyIdeas": {
    handler: "keyIdeasHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.discussionPoints": {
    handler: "discussionHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.sentiment": {
    handler: "sentimentHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.bulletSummary": {
    handler: "bulletSummaryHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.rewrite": {
    handler: "rewriteHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.recommendations": {
    handler: "recommendationsHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.categorize": {
    handler: "categorizeHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "document.analytics": { handler: "analyticsHandler", needsAI: false },
  "document.translate": {
    handler: "translateHandler",
    needsAI: true,
    providerPreference: ["gemini", "claude"],
  },
  "chat.document": {
    handler: "documentChatHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "chat.voice": {
    handler: "voiceChatHandler",
    needsAI: true,
    providerPreference: ["gemini"],
  },
  "chat.general": {
    handler: "generalChatHandler",
    needsAI: true,
    providerPreference: ["claude", "gemini"],
  },
  "user.register": { handler: "userHandler", needsAI: false },
  "user.login": { handler: "userHandler", needsAI: false },
  "user.profile": { handler: "userHandler", needsAI: false },
  "batch.multiDocument": {
    handler: "batchDocumentHandler",
    needsAI: true,
    providerPreference: ["claude"],
  },
};

class DocuThinkerSupervisor {
  constructor({
    providers,
    circuitBreaker,
    tokenBudget,
    costTracker,
    logger,
  } = {}) {
    this.providers = providers;
    this.circuitBreaker = circuitBreaker;
    this.tokenBudget = tokenBudget;
    this.costTracker = costTracker;
    this.logger = logger || console;
    this.handlers = new Map();
  }

  registerHandler(intentType, handler) {
    this.handlers.set(intentType, handler);
  }

  async process(request) {
    const startTime = Date.now();
    const traceId = this.generateTraceId();
    try {
      const intent = await this.classify(request);
      this.logger.info(
        `[Supervisor] ${traceId} intent=${intent.type} confidence=${intent.confidence}`,
      );
      if (this.tokenBudget?.check) {
        const model =
          intent.config?.providerPreference?.[0] === "claude"
            ? "claude-sonnet-4-20250514"
            : "gemini-pro";
        const budgetCheck = this.tokenBudget.check({
          model,
          systemPrompt: "",
          messages: request.body
            ? [
                {
                  role: "user",
                  content: JSON.stringify(request.body).substring(0, 10000),
                },
              ]
            : [],
        });
        if (!budgetCheck.allowed)
          return {
            success: false,
            error: "Token budget exceeded",
            budget: budgetCheck,
            traceId,
          };
      }
      const tasks = await this.decompose(intent, request);
      const results = await this.dispatch(tasks, traceId);
      const response = await this.aggregate(results, intent, traceId);
      if (response.tokensUsed)
        await this.costTracker.record({
          traceId,
          intent: intent.type,
          tokensUsed: response.tokensUsed,
          provider: response.provider,
          duration: Date.now() - startTime,
          model: response.model,
        });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorType: this.classifyError(error),
        traceId,
      };
    }
  }

  async classify(request) {
    if (request.route) {
      const routeMap = {
        "/upload": "document.upload",
        "/generate-key-ideas": "document.keyIdeas",
        "/generate-discussion-points": "document.discussionPoints",
        "/chat": "chat.document",
        "/sentiment-analysis": "document.sentiment",
        "/bullet-summary": "document.bulletSummary",
        "/summary-in-language": "document.translate",
        "/content-rewriting": "document.rewrite",
        "/actionable-recommendations": "document.recommendations",
        "/refine-summary": "document.summarize",
        "/process-audio": "chat.voice",
      };
      if (routeMap[request.route])
        return {
          type: routeMap[request.route],
          confidence: 1.0,
          source: "route-match",
          config: INTENT_MAP[routeMap[request.route]],
        };
    }
    if (this.providers?.call) {
      try {
        const classification = await this.providers.call({
          provider: "claude",
          model: "claude-haiku-4-5-20251001",
          messages: [
            {
              role: "user",
              content: `Classify into: ${Object.keys(INTENT_MAP).join(", ")}\nRequest: ${JSON.stringify(request.body || {}).substring(0, 500)}\nJSON only: {"intent":"...","confidence":0.0-1.0,"reasoning":"..."}`,
            },
          ],
          maxTokens: 150,
          temperature: 0,
        });
        const raw = classification.content
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/m, "")
          .trim();
        const parsed = JSON.parse(raw);
        if (!parsed.intent || !INTENT_MAP[parsed.intent])
          throw new Error("Unknown intent");
        return {
          type: parsed.intent,
          confidence: parseFloat(parsed.confidence) || 0.5,
          source: "llm-classification",
          config: INTENT_MAP[parsed.intent],
        };
      } catch (e) {
        /* fall through */
      }
    }
    return {
      type: "chat.general",
      confidence: 0.5,
      source: "fallback",
      config: INTENT_MAP["chat.general"],
    };
  }

  async decompose(intent, request) {
    if (intent.type === "document.upload")
      return [
        {
          id: "task-0",
          intent: { type: "document.extract", config: intent.config },
          request,
          dependencies: [],
        },
        {
          id: "task-1",
          intent: { type: "document.summarize", config: intent.config },
          request,
          dependencies: ["task-0"],
        },
        {
          id: "task-2",
          intent: { type: "document.store", config: intent.config },
          request,
          dependencies: ["task-1"],
        },
      ];
    if (intent.type === "batch.multiDocument")
      return (request.body?.documents || []).map((doc, i) => ({
        id: `task-${i}`,
        intent: {
          type: "document.upload",
          config: INTENT_MAP["document.upload"],
        },
        request: { ...request, body: { ...request.body, document: doc } },
        dependencies: [],
      }));
    return [{ id: "task-0", intent, request, dependencies: [] }];
  }

  async dispatch(tasks, traceId) {
    const results = new Map(),
      pending = new Set(tasks.map((t) => t.id));
    while (pending.size > 0) {
      const ready = tasks.filter(
        (t) => pending.has(t.id) && t.dependencies.every((d) => results.has(d)),
      );
      if (ready.length === 0 && pending.size > 0)
        throw new Error("Circular dependency");
      const batch = await Promise.allSettled(
        ready.map(async (task) => {
          const handler =
            this.handlers.get(task.intent.type) ||
            this.handlers.get(task.intent.config?.handler);
          if (!handler)
            throw new Error(`No handler for intent: ${task.intent.type}`);
          return {
            id: task.id,
            result: await handler({
              ...task.request,
              _dependencyResults: Object.fromEntries(
                task.dependencies.map((d) => [d, results.get(d)]),
              ),
              _traceId: traceId,
            }),
          };
        }),
      );
      for (let idx = 0; idx < batch.length; idx++) {
        const outcome = batch[idx],
          task = ready[idx];
        if (outcome.status === "fulfilled") {
          results.set(outcome.value.id, outcome.value.result);
          pending.delete(outcome.value.id);
        } else {
          const failedProvider =
            task.request?._forceProvider ||
            task.intent?.config?.providerPreference?.[0];
          const recovered = await this.retryWithFailover(
            task,
            traceId,
            failedProvider,
          );
          if (recovered) {
            results.set(task.id, recovered);
            pending.delete(task.id);
          } else throw outcome.reason;
        }
      }
    }
    return results;
  }

  async aggregate(results, intent, traceId) {
    if (results.size === 1) {
      const [, result] = [...results.entries()][0];
      return { success: true, data: result, traceId };
    }
    const agg = {};
    for (const [id, r] of results) agg[id] = r;
    return { success: true, data: agg, traceId };
  }

  async retryWithFailover(task, traceId, failedProvider) {
    const config = task.intent.config;
    const remaining = (config?.providerPreference || []).filter(
      (p) =>
        p !== failedProvider &&
        (!this.circuitBreaker || this.circuitBreaker.canRequest(p)),
    );
    for (const provider of remaining) {
      try {
        const handler = this.handlers.get(task.intent.type);
        if (!handler) continue;
        return await handler({
          ...task.request,
          _forceProvider: provider,
          _traceId: traceId,
        });
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  classifyError(error) {
    if (error.status === 429) return "rate_limited";
    if (error.message?.includes("context") || error.message?.includes("token"))
      return "context_overflow";
    if (error.code === "ECONNREFUSED" || error.status >= 500)
      return "provider_down";
    if (error.code === "ETIMEDOUT" || error.code === "ABORT_ERR")
      return "timeout";
    return "unknown";
  }

  generateTraceId() {
    return `dt-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
}

module.exports = { DocuThinkerSupervisor, INTENT_MAP };
