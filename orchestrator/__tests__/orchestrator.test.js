/**
 * Integration Tests for DocuThinker Agentic Architecture
 * Run: cd orchestrator && npx jest --no-cache
 */

const { CircuitBreaker } = require("../core/circuit-breaker");
const { CostTracker } = require("../core/cost-tracker");
const { DocuThinkerSupervisor, INTENT_MAP } = require("../core/supervisor");
const { BatchProcessor } = require("../core/batch-processor");
const { DeadLetterQueue } = require("../core/dlq");
const { ToolRegistry } = require("../core/tool-registry");
const { AgentLoop } = require("../core/agent-loop");
const { HandoffManager } = require("../core/handoff");
const { PythonBridge } = require("../core/python-bridge");
const { UnifiedLLMClient } = require("../core/providers");
const { TokenBudgetManager } = require("../context/token-budget");
const { ConversationStore } = require("../context/conversation-store");
const { ContextObservability } = require("../context/observability");
const { HybridRAG } = require("../context/hybrid-rag");
const { MCPClient } = require("../mcp/client");
const {
  validateAIOutput,
  parseAndValidate,
  getSchemaNames,
} = require("../schemas/ai-outputs");
const {
  getSystemPrompt,
  getAllPromptKeys,
  buildCachedSystemPrompt,
} = require("../prompts/system-prompts");
const { PromptCacheStrategy } = require("../prompts/cache-strategy");

const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };

// ============ CircuitBreaker ============
describe("CircuitBreaker", () => {
  let cb;
  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 500 });
  });

  test("starts CLOSED", () => {
    expect(cb.canRequest("claude")).toBe(true);
  });
  test("stays CLOSED on success", () => {
    cb.recordSuccess("claude");
    expect(cb.getCircuit("claude").state).toBe("CLOSED");
  });
  test("opens after threshold failures", () => {
    cb.recordFailure("x");
    cb.recordFailure("x");
    cb.recordFailure("x");
    expect(cb.canRequest("x")).toBe(false);
    expect(cb.getCircuit("x").state).toBe("OPEN");
  });
  test("transitions HALF_OPEN after cooldown", async () => {
    cb.recordFailure("x");
    cb.recordFailure("x");
    cb.recordFailure("x");
    await new Promise((r) => setTimeout(r, 600));
    expect(cb.canRequest("x")).toBe(true);
    expect(cb.getCircuit("x").state).toBe("HALF_OPEN");
  });
  test("HALF_OPEN -> CLOSED on success", async () => {
    cb.recordFailure("x");
    cb.recordFailure("x");
    cb.recordFailure("x");
    await new Promise((r) => setTimeout(r, 600));
    cb.canRequest("x");
    cb.recordSuccess("x");
    expect(cb.getCircuit("x").state).toBe("CLOSED");
  });
  test("HALF_OPEN blocks concurrent probes", async () => {
    cb.recordFailure("x");
    cb.recordFailure("x");
    cb.recordFailure("x");
    await new Promise((r) => setTimeout(r, 600));
    expect(cb.canRequest("x")).toBe(true); // first probe allowed
    expect(cb.canRequest("x")).toBe(false); // second blocked
  });
  test("tracks providers independently", () => {
    cb.recordFailure("a");
    cb.recordFailure("a");
    cb.recordFailure("a");
    cb.recordSuccess("b");
    expect(cb.canRequest("a")).toBe(false);
    expect(cb.canRequest("b")).toBe(true);
  });
  test("getStatus returns all", () => {
    cb.recordSuccess("a");
    cb.recordFailure("b");
    const s = cb.getStatus();
    expect(s.a).toBeDefined();
    expect(s.b).toBeDefined();
  });
  test("reset clears state", () => {
    cb.recordFailure("a");
    cb.recordFailure("a");
    cb.recordFailure("a");
    cb.reset("a");
    expect(cb.canRequest("a")).toBe(true);
  });
});

// ============ CostTracker ============
describe("CostTracker", () => {
  let ct;
  beforeEach(() => {
    ct = new CostTracker({
      dailyBudget: 10,
      monthlyBudget: 200,
      logger: silentLogger,
    });
  });

  test("records cost", async () => {
    const r = await ct.record({
      traceId: "t1",
      intent: "summarize",
      tokensUsed: { input: 1000, output: 500 },
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      duration: 1000,
    });
    expect(r.cost).toBeGreaterThan(0);
  });
  test("aggregates report", async () => {
    await ct.record({
      traceId: "t1",
      intent: "a",
      tokensUsed: { input: 100, output: 50 },
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      duration: 500,
    });
    await ct.record({
      traceId: "t2",
      intent: "b",
      tokensUsed: { input: 100, output: 50 },
      provider: "gemini",
      model: "gemini-pro",
      duration: 500,
    });
    const rpt = ct.getUsageReport();
    expect(rpt.totalRequests).toBe(2);
    expect(rpt.byProvider.claude).toBeDefined();
    expect(rpt.byProvider.gemini).toBeDefined();
  });
  test("handles cache tokens", async () => {
    const r = await ct.record({
      traceId: "t",
      intent: "x",
      tokensUsed: { input: 1000, output: 500, cacheRead: 800 },
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      duration: 500,
    });
    expect(r.cost).toBeGreaterThan(0);
  });
});

// ============ Supervisor ============
describe("DocuThinkerSupervisor", () => {
  let sup;
  beforeEach(() => {
    sup = new DocuThinkerSupervisor({
      providers: null,
      circuitBreaker: new CircuitBreaker(),
      tokenBudget: new TokenBudgetManager({ logger: silentLogger }),
      costTracker: new CostTracker({ logger: silentLogger }),
      logger: silentLogger,
    });
  });

  test("classifies routes correctly", async () => {
    const routes = {
      "/upload": "document.upload",
      "/generate-key-ideas": "document.keyIdeas",
      "/chat": "chat.document",
      "/sentiment-analysis": "document.sentiment",
      "/bullet-summary": "document.bulletSummary",
    };
    for (const [route, intent] of Object.entries(routes)) {
      const r = await sup.classify({ route });
      expect(r.type).toBe(intent);
      expect(r.confidence).toBe(1.0);
    }
  });
  test("fallback for unknown routes", async () => {
    const r = await sup.classify({ route: "/unknown" });
    expect(r.type).toBe("chat.general");
  });
  test("decomposes simple intents to single task", async () => {
    const tasks = await sup.decompose(
      { type: "document.keyIdeas", config: INTENT_MAP["document.keyIdeas"] },
      {},
    );
    expect(tasks).toHaveLength(1);
  });
  test("decomposes upload to multi-step", async () => {
    const tasks = await sup.decompose(
      { type: "document.upload", config: INTENT_MAP["document.upload"] },
      {},
    );
    expect(tasks).toHaveLength(3);
    expect(tasks[1].dependencies).toContain("task-0");
  });
  test("decomposes batch to parallel", async () => {
    const tasks = await sup.decompose(
      { type: "batch.multiDocument" },
      { body: { documents: [{}, {}, {}] } },
    );
    expect(tasks).toHaveLength(3);
    tasks.forEach((t) => expect(t.dependencies).toHaveLength(0));
  });
  test("classifyError types", () => {
    expect(sup.classifyError({ status: 429 })).toBe("rate_limited");
    expect(sup.classifyError({ code: "ECONNREFUSED" })).toBe("provider_down");
    expect(sup.classifyError({ message: "context window" })).toBe(
      "context_overflow",
    );
    expect(sup.classifyError({ code: "ETIMEDOUT" })).toBe("timeout");
  });
  test("unique trace IDs", () => {
    expect(sup.generateTraceId()).not.toBe(sup.generateTraceId());
  });
  test("INTENT_MAP covers 15+ intents", () => {
    expect(Object.keys(INTENT_MAP).length).toBeGreaterThanOrEqual(15);
  });
  test("dispatches to registered handler", async () => {
    let called = false;
    sup.registerHandler("document.keyIdeas", async () => {
      called = true;
      return { ideas: ["a", "b"] };
    });
    const r = await sup.process({
      route: "/generate-key-ideas",
      body: { text: "test" },
    });
    expect(called).toBe(true);
    expect(r.success).toBe(true);
  });
  test("returns error when no handler", async () => {
    const r = await sup.process({ route: "/generate-key-ideas", body: {} });
    expect(r.success).toBe(false);
    expect(r.error).toContain("No handler");
  });
});

// ============ Schemas ============
describe("AI Output Schemas", () => {
  test("validates summary", () => {
    expect(
      validateAIOutput("summary", {
        summary: "A valid summary that is long enough to pass.",
      }).summary,
    ).toBeDefined();
  });
  test("rejects short summary", () => {
    expect(() => validateAIOutput("summary", { summary: "Short" })).toThrow();
  });
  test("validates sentiment", () => {
    const r = validateAIOutput("sentiment", {
      overall: "mixed",
      confidence: 0.85,
      tones: ["optimistic"],
      summary: "Mixed sentiment detected in the document.",
    });
    expect(r.overall).toBe("mixed");
  });
  test("rejects invalid sentiment", () => {
    expect(() =>
      validateAIOutput("sentiment", {
        overall: "bad",
        confidence: 99,
        tones: [],
        summary: "x",
      }),
    ).toThrow();
  });
  test("validates keyIdeas", () => {
    expect(
      validateAIOutput("keyIdeas", {
        ideas: [
          "First important idea here.",
          "Second key finding.",
          "Third insight.",
        ],
      }).ideas,
    ).toHaveLength(3);
  });
  test("validates recommendations", () => {
    expect(
      validateAIOutput("recommendations", {
        recommendations: [
          {
            recommendation: "Do this specific thing",
            rationale: "Because of this reason",
            priority: "high",
          },
        ],
      }).recommendations,
    ).toHaveLength(1);
  });
  test("validates category", () => {
    expect(
      validateAIOutput("category", {
        topic: "tech",
        type: "report",
        domain: "academic",
        confidence: 0.9,
        tags: ["AI"],
      }).topic,
    ).toBe("tech");
  });
  test("validates analytics", () => {
    expect(
      validateAIOutput("analytics", {
        wordCount: 500,
        sentenceCount: 25,
        paragraphCount: 5,
        readingTimeMinutes: 2,
      }).wordCount,
    ).toBe(500);
  });
  test("parseAndValidate JSON string", () => {
    expect(
      parseAndValidate(
        "summary",
        '{"summary":"Parsed summary from JSON that is long enough."}',
      ).summary,
    ).toContain("Parsed");
  });
  test("parseAndValidate wraps text as summary", () => {
    expect(
      parseAndValidate(
        "summary",
        "Plain text summary that is long enough to pass validation.",
      ).summary,
    ).toContain("Plain");
  });
  test("parseAndValidate wraps text as chat", () => {
    expect(parseAndValidate("chat", "Hello!").message).toBe("Hello!");
  });
  test("parseAndValidate throws on non-JSON strict", () => {
    expect(() => parseAndValidate("sentiment", "not json")).toThrow();
  });
  test("getSchemaNames has 12+", () => {
    expect(getSchemaNames().length).toBeGreaterThanOrEqual(12);
  });
});

// ============ System Prompts ============
describe("System Prompts", () => {
  test("14+ prompts accessible", () => {
    const keys = getAllPromptKeys();
    expect(keys.length).toBeGreaterThanOrEqual(14);
    for (const k of keys) {
      const p = getSystemPrompt(k);
      expect(p.version).toBeDefined();
      expect(p.prompt.length).toBeGreaterThan(20);
      expect(typeof p.temperature).toBe("number");
    }
  });
  test("throws on unknown key", () => {
    expect(() => getSystemPrompt("nonexistent")).toThrow();
  });
  test("buildCachedSystemPrompt returns ephemeral", () => {
    const r = buildCachedSystemPrompt("document.summarize");
    expect(Array.isArray(r)).toBe(true);
    expect(r[0].cache_control).toEqual({ type: "ephemeral" });
  });
});

// ============ TokenBudgetManager ============
describe("TokenBudgetManager", () => {
  const tb = new TokenBudgetManager({ logger: silentLogger });
  test("estimates tokens", () => {
    expect(tb.estimateTokens("Hello world")).toBeGreaterThan(0);
  });
  test("0 for empty", () => {
    expect(tb.estimateTokens("")).toBe(0);
    expect(tb.estimateTokens(null)).toBe(0);
  });
  test("allows within budget", () => {
    expect(
      tb.check({
        model: "claude-sonnet-4-20250514",
        systemPrompt: "test",
        messages: [{ role: "user", content: "hi" }],
      }).allowed,
    ).toBe(true);
  });
  test("detects overflow", () => {
    expect(
      tb.check({
        model: "claude-sonnet-4-20250514",
        systemPrompt: "x".repeat(900000),
        messages: [],
      }).allowed,
    ).toBe(false);
  });
  test("correct context windows", () => {
    expect(TokenBudgetManager.CONTEXT_WINDOWS["claude-sonnet-4-20250514"]).toBe(
      200000,
    );
  });
});

// ============ ToolRegistry ============
describe("ToolRegistry", () => {
  test("register and execute", async () => {
    const tr = new ToolRegistry({ logger: silentLogger });
    tr.register(
      "echo",
      {
        description: "Echo",
        inputSchema: { type: "object", properties: { t: { type: "string" } } },
      },
      async (i) => ({ echo: i.t }),
    );
    expect(tr.getToolDefinitions()).toHaveLength(1);
    expect((await tr.execute("echo", { t: "hi" })).echo).toBe("hi");
  });
  test("throws on unknown tool", async () => {
    const tr = new ToolRegistry({ logger: silentLogger });
    await expect(tr.execute("nope", {})).rejects.toThrow();
  });
  test("registerStandardTools adds analytics", () => {
    const tr = new ToolRegistry({ logger: silentLogger });
    tr.registerStandardTools();
    expect(tr.getToolNames()).toContain("analyze_document_text");
  });
  test("analyze_document_text works", async () => {
    const tr = new ToolRegistry({ logger: silentLogger });
    tr.registerStandardTools();
    const r = await tr.execute("analyze_document_text", {
      text: "Hello world. Test doc.",
    });
    expect(r.wordCount).toBeGreaterThan(0);
    expect(r.sentenceCount).toBeGreaterThan(0);
  });
});

// ============ BatchProcessor ============
describe("BatchProcessor", () => {
  test("processes batch", async () => {
    const bp = new BatchProcessor({
      llmClient: { call: async () => ({ content: "ok" }) },
      logger: silentLogger,
    });
    const r = await bp.processBatch(
      [
        { id: "1", text: "a" },
        { id: "2", text: "b" },
      ],
      "summarize",
    );
    expect(r.totalProcessed).toBe(2);
    expect(r.successRate).toBe("100.0%");
  });
  test("handles failures", async () => {
    let n = 0;
    const bp = new BatchProcessor({
      llmClient: {
        call: async () => {
          if (++n === 2) throw new Error("fail");
          return { content: "ok" };
        },
      },
      logger: silentLogger,
    });
    const r = await bp.processBatch(
      [
        { id: "1", text: "a" },
        { id: "2", text: "b" },
        { id: "3", text: "c" },
      ],
      "summarize",
    );
    expect(r.results.filter((x) => x.status === "error")).toHaveLength(1);
  });
  test("chunkArray", () => {
    const bp = new BatchProcessor({ logger: silentLogger });
    expect(bp.chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

// ============ DLQ ============
describe("DeadLetterQueue", () => {
  test("enqueues to retry within max", async () => {
    const d = new DeadLetterQueue({ maxRetries: 3, logger: silentLogger });
    await d.enqueue({ type: "a", error: new Error("e"), retryCount: 0 });
    expect(d.getStats().retryMessages).toBe(1);
    expect(d.getStats().dlqMessages).toBe(0);
  });
  test("moves to DLQ after max", async () => {
    const d = new DeadLetterQueue({ maxRetries: 3, logger: silentLogger });
    await d.enqueue({ type: "a", error: new Error("e"), retryCount: 3 });
    expect(d.getStats().dlqMessages).toBe(1);
  });
  test("getRetryable drains", async () => {
    const d = new DeadLetterQueue({ logger: silentLogger });
    await d.enqueue({ type: "a", error: new Error("e"), retryCount: 0 });
    await d.enqueue({ type: "b", error: new Error("e"), retryCount: 1 });
    expect(d.getRetryable()).toHaveLength(2);
    expect(d.getStats().retryMessages).toBe(0);
  });
  test("clearDLQ", async () => {
    const d = new DeadLetterQueue({ logger: silentLogger });
    await d.enqueue({ type: "a", error: new Error("e"), retryCount: 3 });
    expect(d.clearDLQ()).toBe(1);
  });
});

// ============ ConversationStore ============
describe("ConversationStore", () => {
  test("creates and adds messages", async () => {
    const cs = new ConversationStore({ logger: silentLogger });
    await cs.addMessage("u1", "d1", "user", "hi");
    expect(cs.getConversation("u1", "d1").messages).toHaveLength(1);
  });
  test("buildContextMessages with doc", () => {
    const cs = new ConversationStore({ logger: silentLogger });
    const msgs = cs.buildContextMessages(
      { messages: [{ role: "user", content: "q" }], summary: null },
      "Doc text",
    );
    expect(
      msgs.some((m) => String(m.content).includes("document_context")),
    ).toBe(true);
  });
  test("buildContextMessages with summary", () => {
    const cs = new ConversationStore({ logger: silentLogger });
    const msgs = cs.buildContextMessages(
      { messages: [{ role: "user", content: "q" }], summary: "Previous chat" },
      null,
    );
    expect(
      msgs.some((m) => String(m.content).includes("Previous conversation")),
    ).toBe(true);
  });
  test("clearConversation", async () => {
    const cs = new ConversationStore({ logger: silentLogger });
    await cs.addMessage("u1", "d1", "user", "hi");
    cs.clearConversation("u1", "d1");
    expect(cs.getConversation("u1", "d1").messages).toHaveLength(0);
  });
  test("getConversationCount", async () => {
    const cs = new ConversationStore({ logger: silentLogger });
    await cs.addMessage("u1", "d1", "user", "a");
    await cs.addMessage("u2", "d2", "user", "b");
    expect(cs.getConversationCount()).toBe(2);
  });
});

// ============ ContextObservability ============
describe("ContextObservability", () => {
  test("records metrics", () => {
    const co = new ContextObservability({ logger: silentLogger });
    const m = co.record({
      traceId: "t",
      provider: "claude",
      model: "sonnet",
      contextWindow: 200000,
      inputTokens: 1000,
      outputTokens: 500,
      intent: "test",
    });
    expect(parseFloat(m.utilization)).toBeGreaterThan(0);
  });
  test("getStats aggregates", () => {
    const co = new ContextObservability({ logger: silentLogger });
    co.record({
      traceId: "a",
      provider: "claude",
      model: "s",
      contextWindow: 200000,
      inputTokens: 1000,
      outputTokens: 500,
      intent: "x",
    });
    co.record({
      traceId: "b",
      provider: "gemini",
      model: "p",
      contextWindow: 1000000,
      inputTokens: 2000,
      outputTokens: 1000,
      intent: "y",
    });
    const s = co.getStats();
    expect(s.totalRequests).toBe(2);
    expect(s.byProvider.claude).toBeDefined();
  });
  test("empty stats message", () => {
    expect(
      new ContextObservability({ logger: silentLogger }).getStats().message,
    ).toBe("No metrics recorded yet");
  });
  test("handles zero contextWindow", () => {
    const co = new ContextObservability({ logger: silentLogger });
    const m = co.record({
      traceId: "t",
      provider: "x",
      model: "y",
      contextWindow: 0,
      inputTokens: 100,
      outputTokens: 50,
      intent: "z",
    });
    expect(parseFloat(m.utilization)).not.toBeNaN(); // defaults to 128000
  });
  test("OTel format", () => {
    const co = new ContextObservability({ logger: silentLogger });
    co.record({
      traceId: "t",
      provider: "p",
      model: "m",
      contextWindow: 200000,
      inputTokens: 100,
      outputTokens: 50,
      intent: "i",
    });
    const otel = co.getOpenTelemetryMetrics();
    expect(otel[0].name).toBe("docuthinker.llm.context_utilization");
  });
});

// ============ HybridRAG ============
describe("HybridRAG", () => {
  test("RRF merges ranked lists", () => {
    const hr = new HybridRAG({ logger: silentLogger });
    const fused = hr.reciprocalRankFusion(
      [
        [
          { id: "a", score: 0.9 },
          { id: "b", score: 0.8 },
        ],
        [
          { id: "b", score: 0.95 },
          { id: "a", score: 0.85 },
        ],
      ],
      2,
    );
    expect(fused.length).toBe(2);
    fused.forEach((f) => expect(f.rrfScore).toBeGreaterThan(0));
  });
  test("empty lists", () => {
    expect(
      new HybridRAG({ logger: silentLogger }).reciprocalRankFusion([[], []], 5),
    ).toHaveLength(0);
  });
  test("search without backends", async () => {
    const r = await new HybridRAG({ logger: silentLogger }).search("test");
    expect(r.results).toHaveLength(0);
  });
});

// ============ AgentLoop ============
describe("AgentLoop", () => {
  test("end_turn on first response", async () => {
    const al = new AgentLoop({
      llmClient: {
        call: async () => ({
          content: "Answer",
          toolUse: [],
          tokensUsed: { input: 100, output: 50 },
          provider: "claude",
        }),
      },
      toolRegistry: { getToolDefinitions: () => [] },
      maxIterations: 5,
      logger: silentLogger,
    });
    const r = await al.run({ systemPrompt: "test", userMessage: "hi" });
    expect(r.response).toBe("Answer");
    expect(r.iterations).toBe(1);
  });
  test("tool_use then end_turn", async () => {
    let n = 0;
    const al = new AgentLoop({
      llmClient: {
        call: async () => {
          n++;
          if (n === 1)
            return {
              content: "Using tool",
              toolUse: [{ id: "t1", name: "echo", input: {} }],
              tokensUsed: { input: 100, output: 50 },
            };
          return {
            content: "Done",
            toolUse: [],
            tokensUsed: { input: 200, output: 60 },
            provider: "claude",
          };
        },
      },
      toolRegistry: {
        getToolDefinitions: () => [{ name: "echo" }],
        execute: async () => ({ ok: true }),
      },
      maxIterations: 5,
      logger: silentLogger,
    });
    const r = await al.run({ systemPrompt: "test", userMessage: "go" });
    expect(r.response).toBe("Done");
    expect(r.iterations).toBe(2);
    expect(r.toolsUsed).toBe(1);
  });
  test("max iterations", async () => {
    const al = new AgentLoop({
      llmClient: {
        call: async () => ({
          content: ".",
          toolUse: [{ id: "t", name: "x", input: {} }],
          tokensUsed: { input: 10, output: 5 },
        }),
      },
      toolRegistry: {
        getToolDefinitions: () => [{ name: "x" }],
        execute: async () => ({}),
      },
      maxIterations: 2,
      logger: silentLogger,
    });
    const r = await al.run({ systemPrompt: "test", userMessage: "loop" });
    expect(r.maxIterationsReached).toBe(true);
    expect(r.iterations).toBe(2);
    expect(r.tokensUsed.input).toBeGreaterThan(0);
  });
  test("buildContextualMessage", () => {
    const al = new AgentLoop({
      llmClient: {},
      toolRegistry: {},
      logger: silentLogger,
    });
    const msg = al.buildContextualMessage("Hello", {
      documentText: "Doc",
      documentTitle: "Title",
    });
    expect(msg).toContain("Hello");
    expect(msg).toContain("document_context");
    expect(msg).toContain("Doc");
  });
});

// ============ HandoffManager ============
describe("HandoffManager", () => {
  test("creates handoff context", async () => {
    const hm = new HandoffManager({ logger: silentLogger });
    const hc = await hm.createHandoffContext(
      { name: "a", provider: "claude" },
      { name: "b", provider: "gemini" },
      { messages: [{ role: "user", content: "hi" }], reason: "failover" },
    );
    expect(hc.id).toMatch(/^handoff-/);
    expect(hc.context.handoffReason).toBe("failover");
  });
  test("builds injection", () => {
    const hm = new HandoffManager({ logger: silentLogger });
    const inj = hm.buildHandoffInjection({
      source: { agent: "a" },
      context: {
        handoffReason: "test",
        conversationSummary: "summary",
        taskState: { completed: [], remaining: [], partialResults: {} },
      },
    });
    expect(inj).toContain("handoff_context");
    expect(inj).toContain("test");
  });
});

// ============ PythonBridge ============
describe("PythonBridge", () => {
  test("defaults", () => {
    const pb = new PythonBridge({ logger: silentLogger });
    expect(pb.baseUrl).toBe("http://localhost:8000");
  });
  test("custom config", () => {
    const pb = new PythonBridge({
      baseUrl: "http://custom:9000",
      timeout: 5000,
      logger: silentLogger,
    });
    expect(pb.baseUrl).toBe("http://custom:9000");
  });
  test("healthCheck when down", async () => {
    const pb = new PythonBridge({
      baseUrl: "http://localhost:19999",
      timeout: 1000,
      logger: silentLogger,
    });
    const h = await pb.healthCheck();
    expect(h.healthy).toBe(false);
  });
  test("circuit breaker", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    cb.recordFailure("python-ai-ml");
    const pb = new PythonBridge({ circuitBreaker: cb, logger: silentLogger });
    await expect(pb.analyzeDocument("test")).rejects.toThrow("circuit breaker");
  });
});

// ============ UnifiedLLMClient ============
describe("UnifiedLLMClient", () => {
  test("no providers without keys", () => {
    const old = {
      a: process.env.ANTHROPIC_API_KEY,
      g: process.env.GOOGLE_AI_API_KEY,
    };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    const c = new UnifiedLLMClient({
      circuitBreaker: new CircuitBreaker(),
      logger: silentLogger,
    });
    expect(c.getAvailableProviders()).toEqual([]);
    if (old.a) process.env.ANTHROPIC_API_KEY = old.a;
    if (old.g) process.env.GOOGLE_AI_API_KEY = old.g;
  });
  test("failover throws when none available", async () => {
    const c = new UnifiedLLMClient({
      circuitBreaker: new CircuitBreaker(),
      logger: silentLogger,
    });
    c.clients = {};
    await expect(
      c.callWithFailover({ provider: "claude", messages: [] }),
    ).rejects.toThrow("All LLM providers");
  });
});

// ============ MCPClient ============
describe("MCPClient", () => {
  test("no connections initially", () => {
    expect(
      new MCPClient({ logger: silentLogger }).getConnectedServers(),
    ).toEqual([]);
  });
  test("throws on unconnected callTool", async () => {
    await expect(
      new MCPClient({ logger: silentLogger }).callTool("x", "y", {}),
    ).rejects.toThrow("Not connected");
  });
});

// ============ PromptCacheStrategy ============
describe("PromptCacheStrategy", () => {
  let pc;
  beforeEach(() => {
    pc = new PromptCacheStrategy({ logger: silentLogger });
  });

  test("buildCachedRequest with doc", () => {
    const r = pc.buildCachedRequest({
      systemPromptKey: "document.summarize",
      documentText: "Doc",
      userMessage: "Summarize",
    });
    expect(r.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(r.messages).toHaveLength(1);
  });
  test("buildCachedRequest without doc", () => {
    const r = pc.buildCachedRequest({
      systemPromptKey: "chat.document",
      userMessage: "Hello",
    });
    expect(r.messages[0].content).toBe("Hello");
  });
  test("buildCachedConversation includes history", () => {
    const r = pc.buildCachedConversation({
      systemPromptKey: "chat.document",
      documentText: "Doc",
      conversationHistory: [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
      ],
      newMessage: "More",
    });
    expect(r.messages.length).toBeGreaterThanOrEqual(5);
  });
  test("tracks cache hits", () => {
    pc.trackCachePerformance({ tokensUsed: { cacheRead: 800 } });
    expect(pc.getStats().cacheHits).toBe(1);
  });
  test("tracks cache misses", () => {
    pc.trackCachePerformance({ tokensUsed: { cacheCreation: 500 } });
    expect(pc.getStats().cacheMisses).toBe(1);
  });
});

// ============ End-to-End Wiring ============
describe("End-to-end Module Wiring", () => {
  test("all modules instantiate together", () => {
    const cb = new CircuitBreaker();
    const ct = new CostTracker({ logger: silentLogger });
    const tb = new TokenBudgetManager({ logger: silentLogger });
    const pb = new PythonBridge({ circuitBreaker: cb, logger: silentLogger });
    const tr = new ToolRegistry({ pythonBridge: pb, logger: silentLogger });
    tr.registerStandardTools();
    const cs = new ConversationStore({ tokenBudget: tb, logger: silentLogger });
    const obs = new ContextObservability({ logger: silentLogger });
    const hm = new HandoffManager({ logger: silentLogger });
    const rag = new HybridRAG({ pythonBridge: pb, logger: silentLogger });
    const sup = new DocuThinkerSupervisor({
      circuitBreaker: cb,
      tokenBudget: tb,
      costTracker: ct,
      logger: silentLogger,
    });

    expect(tr.getToolNames()).toContain("analyze_document_text");
    expect(tr.getToolNames()).toContain("extract_entities");
    expect(tr.getToolNames()).toContain("rag_search");
    expect(tr.getToolNames()).toContain("vector_search");
    expect(tr.getToolNames()).toContain("python_sentiment");
    expect(sup).toBeDefined();
    expect(cs).toBeDefined();
    expect(obs).toBeDefined();
    expect(hm).toBeDefined();
    expect(rag).toBeDefined();
  });
});

// ============ Edge Cases & Hardening ============
describe("Edge Cases", () => {
  test("CostTracker evicts old records", async () => {
    const ct = new CostTracker({ logger: silentLogger });
    // Add records with old timestamps
    for (let i = 0; i < 50; i++) {
      ct.records.push({
        traceId: `old-${i}`,
        cost: 0.001,
        timestamp: new Date(2020, 0, 1),
      });
    }
    // Trigger eviction by exceeding 10000
    ct.records.length = 10001;
    await ct.record({
      traceId: "new",
      intent: "x",
      tokensUsed: { input: 10, output: 5 },
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      duration: 100,
    });
    expect(ct.records.length).toBeLessThan(10002); // old records evicted
  });

  test("Supervisor handles missing body gracefully", async () => {
    const sup = new DocuThinkerSupervisor({
      tokenBudget: new TokenBudgetManager({ logger: silentLogger }),
      costTracker: new CostTracker({ logger: silentLogger }),
      circuitBreaker: new CircuitBreaker(),
      logger: silentLogger,
    });
    sup.registerHandler("chat.general", async () => ({ response: "ok" }));
    const r = await sup.process({ route: null, body: null });
    expect(r.success).toBe(true);
  });

  test("BatchProcessor empty document array", async () => {
    const bp = new BatchProcessor({
      llmClient: { call: async () => ({ content: "ok" }) },
      logger: silentLogger,
    });
    const r = await bp.processBatch([], "summarize");
    expect(r.totalProcessed).toBe(0);
    expect(r.successRate).toBe("0.0%");
  });

  test("ToolRegistry with no pythonBridge skips bridge tools", () => {
    const tr = new ToolRegistry({ logger: silentLogger });
    tr.registerStandardTools();
    expect(tr.getToolNames()).toContain("analyze_document_text");
    expect(tr.getToolNames()).not.toContain("extract_entities"); // no bridge = no python tools
  });

  test("ConversationStore handles rapid sequential messages", async () => {
    const cs = new ConversationStore({ logger: silentLogger });
    await Promise.all([
      cs.addMessage("u", "d", "user", "msg1"),
      cs.addMessage("u", "d", "user", "msg2"),
      cs.addMessage("u", "d", "user", "msg3"),
    ]);
    expect(cs.getConversation("u", "d").messages.length).toBeGreaterThanOrEqual(
      3,
    );
  });

  test("TokenBudgetManager with undefined messages", () => {
    const tb = new TokenBudgetManager();
    const r = tb.check({ model: "gpt-4" });
    expect(r.allowed).toBe(true);
    expect(r.used).toBe(0);
  });

  test("Schemas reject extra fields only when strict", () => {
    // summary allows extra fields (not strict)
    const r = validateAIOutput("summary", {
      summary: "A valid summary that is definitely long enough to pass.",
    });
    expect(r.summary).toBeDefined();
  });

  test("Prompt keys match between system-prompts and supervisor INTENT_MAP", () => {
    const promptKeys = getAllPromptKeys();
    // All prompt-mapped intents should have corresponding prompts
    const intentsWithPrompts = [
      "document.summarize",
      "document.keyIdeas",
      "document.discussionPoints",
      "document.sentiment",
      "document.bulletSummary",
      "document.rewrite",
      "document.recommendations",
      "document.categorize",
      "document.translate",
      "chat.document",
      "chat.general",
      "chat.voice",
    ];
    for (const intent of intentsWithPrompts) {
      expect(promptKeys).toContain(intent);
      expect(INTENT_MAP[intent]).toBeDefined();
    }
  });

  test("CircuitBreaker reset all", () => {
    const cb = new CircuitBreaker();
    cb.recordFailure("a");
    cb.recordFailure("b");
    cb.reset(); // reset all
    expect(cb.getStatus()).toEqual({});
  });

  test("HybridRAG handles single-list fusion", () => {
    const hr = new HybridRAG({ logger: silentLogger });
    const fused = hr.reciprocalRankFusion([[{ id: "a", score: 1 }]], 5);
    expect(fused).toHaveLength(1);
    expect(fused[0].rrfScore).toBeGreaterThan(0);
  });

  test("TranslateResponse schema validates", () => {
    const r = validateAIOutput("translate", {
      translated: "Bonjour le monde",
      targetLanguage: "French",
    });
    expect(r.translated).toBe("Bonjour le monde");
  });

  test("13 schemas now available (12 + translate)", () => {
    expect(getSchemaNames().length).toBeGreaterThanOrEqual(13);
    expect(getSchemaNames()).toContain("translate");
  });

  test("CostTracker period-based reporting", async () => {
    const ct = new CostTracker({ logger: silentLogger });
    await ct.record({
      traceId: "t",
      intent: "x",
      tokensUsed: { input: 100, output: 50 },
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      duration: 100,
    });
    const today = ct.getUsageReport("today");
    const month = ct.getUsageReport("month");
    expect(today.period).toBe("today");
    expect(month.period).toBe("month");
    expect(today.totalRequests).toBe(1);
  });

  test("Supervisor handles all 18 INTENT_MAP intents", () => {
    const allIntents = Object.keys(INTENT_MAP);
    expect(allIntents.length).toBeGreaterThanOrEqual(18);
    // All intents should have providerPreference or needsAI defined
    for (const intent of allIntents) {
      expect(INTENT_MAP[intent]).toBeDefined();
      expect(INTENT_MAP[intent].handler).toBeDefined();
    }
  });

  test("document.translate prompt instructs JSON output", () => {
    const prompt = getSystemPrompt("document.translate");
    expect(prompt.prompt).toContain('"translated"');
  });
});
