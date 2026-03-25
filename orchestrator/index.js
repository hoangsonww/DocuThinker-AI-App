require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { CircuitBreaker } = require("./core/circuit-breaker");
const { CostTracker } = require("./core/cost-tracker");
const { UnifiedLLMClient } = require("./core/providers");
const { PythonBridge } = require("./core/python-bridge");
const { ToolRegistry } = require("./core/tool-registry");
const { BatchProcessor } = require("./core/batch-processor");
const { AgentLoop } = require("./core/agent-loop");
const { HandoffManager } = require("./core/handoff");
const { DeadLetterQueue } = require("./core/dlq");
const { DocuThinkerSupervisor } = require("./core/supervisor");
const { TokenBudgetManager } = require("./context/token-budget");
const { ConversationStore } = require("./context/conversation-store");
const { ContextObservability } = require("./context/observability");
const { PromptCacheStrategy } = require("./prompts/cache-strategy");
const { getSystemPrompt } = require("./prompts/system-prompts");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Initialize all components
const circuitBreaker = new CircuitBreaker({
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || "3", 10),
  cooldownMs: parseInt(process.env.CIRCUIT_BREAKER_COOLDOWN_MS || "60000", 10),
});
const costTracker = new CostTracker({
  dailyBudget: parseFloat(process.env.DAILY_BUDGET || "10"),
  monthlyBudget: parseFloat(process.env.MONTHLY_BUDGET || "200"),
});
const llmClient = new UnifiedLLMClient({ circuitBreaker });
const pythonBridge = new PythonBridge({ circuitBreaker });
const tokenBudget = new TokenBudgetManager();
const conversationStore = new ConversationStore({ tokenBudget, llmClient });
const contextObservability = new ContextObservability();
const promptCache = new PromptCacheStrategy();
const dlq = new DeadLetterQueue({ maxRetries: 3 });
const toolRegistry = new ToolRegistry({ pythonBridge });
toolRegistry.registerStandardTools();
const batchProcessor = new BatchProcessor({ llmClient, costTracker });
const handoffManager = new HandoffManager({ llmClient });
const agentLoop = new AgentLoop({ llmClient, toolRegistry, maxIterations: 10 });
const supervisor = new DocuThinkerSupervisor({
  providers: llmClient,
  circuitBreaker,
  tokenBudget,
  costTracker,
});

// Register supervisor handlers
const intentPromptMap = {
  "document.summarize": "document.summarize",
  "document.keyIdeas": "document.keyIdeas",
  "document.discussionPoints": "document.discussionPoints",
  "document.sentiment": "document.sentiment",
  "document.bulletSummary": "document.bulletSummary",
  "document.rewrite": "document.rewrite",
  "document.recommendations": "document.recommendations",
  "document.categorize": "document.categorize",
  "document.translate": "document.translate",
  "chat.document": "chat.document",
  "chat.general": "chat.general",
};

for (const [intent, promptKey] of Object.entries(intentPromptMap)) {
  supervisor.registerHandler(intent, async (req) => {
    const text =
      req.body?.text || req.body?.originalText || req.body?.message || "";
    const promptConfig = getSystemPrompt(promptKey);
    return llmClient.call({
      provider: req._forceProvider || "claude",
      messages: [{ role: "user", content: text }],
      systemPrompt: promptConfig.prompt,
      maxTokens: promptConfig.maxTokens,
      temperature: promptConfig.temperature,
    });
  });
}
supervisor.registerHandler("document.analytics", async (req) => {
  return toolRegistry.execute("analyze_document_text", {
    text: req.body?.text || "",
  });
});

// Upload handler: delegates to Python bridge for full extraction + summarization pipeline
supervisor.registerHandler("document.upload", async (req) => {
  const text = req.body?.text || req.body?.originalText || "";
  return pythonBridge.analyzeDocument(text, {
    operations: ["summarize", "key_ideas", "sentiment"],
  });
});
supervisor.registerHandler("document.extract", async (req) => {
  return {
    text: req.body?.text || req._dependencyResults?.["task-0"]?.text || "",
  };
});
supervisor.registerHandler("document.store", async (req) => {
  return { stored: true, timestamp: new Date().toISOString() };
});

// Voice chat handler
supervisor.registerHandler("chat.voice", async (req) => {
  const message = req.body?.message || req.body?.text || "";
  const promptConfig = getSystemPrompt("chat.voice");
  return llmClient.call({
    provider: req._forceProvider || "gemini",
    messages: [{ role: "user", content: message }],
    systemPrompt: promptConfig.prompt,
    maxTokens: promptConfig.maxTokens,
    temperature: promptConfig.temperature,
  });
});

// Batch handler: delegates to batch processor
supervisor.registerHandler("batch.multiDocument", async (req) => {
  const documents = req.body?.documents || [];
  return batchProcessor.processBatch(documents, "summarize", {
    provider: "claude",
  });
});

// User handlers: proxy to the backend service (orchestrator doesn't handle auth directly)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
for (const userIntent of ["user.register", "user.login", "user.profile"]) {
  supervisor.registerHandler(userIntent, async (req) => {
    try {
      const endpoint = {
        "user.register": "/register",
        "user.login": "/login",
        "user.profile": `/users/${req.body?.userId}`,
      }[userIntent];
      const method = userIntent === "user.profile" ? "GET" : "POST";
      const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "GET" ? JSON.stringify(req.body) : undefined,
      });
      return resp.json();
    } catch (e) {
      return { error: `Backend service unavailable: ${e.message}` };
    }
  });
}

// ===== ROUTES =====

app.get("/health", async (req, res) => {
  try {
    const pythonHealth = await pythonBridge.healthCheck();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      circuitBreakers: circuitBreaker.getStatus(),
      pythonBridge: pythonHealth,
      costs: costTracker.getUsageReport(),
      promptCache: promptCache.getStats(),
      contextObservability: contextObservability.getStats(),
      conversations: { active: conversationStore.getConversationCount() },
      dlq: dlq.getStats(),
      providers: llmClient.getAvailableProviders(),
      tools: toolRegistry.getToolNames(),
    });
  } catch (error) {
    res.status(500).json({ status: "degraded", error: error.message });
  }
});

app.get("/api/costs", (req, res) =>
  res.json(costTracker.getUsageReport(req.query.period || "month")),
);
app.get("/api/circuits", (req, res) => res.json(circuitBreaker.getStatus()));
app.get("/api/context-metrics", (req, res) =>
  res.json(contextObservability.getStats()),
);
app.get("/api/dlq", (req, res) =>
  res.json({ stats: dlq.getStats(), messages: dlq.getDLQMessages(20) }),
);
app.get("/api/tools", (req, res) =>
  res.json({
    tools: toolRegistry.getToolDefinitions(),
    count: toolRegistry.getToolNames().length,
  }),
);

app.post("/api/tools/execute", async (req, res) => {
  try {
    const { tool, input } = req.body;
    if (!tool) return res.status(400).json({ error: "tool name is required" });
    const result = await toolRegistry.execute(tool, input || {});
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/token-check", (req, res) => {
  try {
    const { model, systemPrompt, messages, tools } = req.body || {};
    res.json(tokenBudget.check({ model, systemPrompt, messages, tools }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/supervisor/process", async (req, res) => {
  try {
    const result = await supervisor.process({
      route: req.body.route || null,
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/agent/run", async (req, res) => {
  try {
    const { systemPrompt, message, context, provider } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });
    const result = await agentLoop.run({
      systemPrompt:
        systemPrompt ||
        "You are DocuThinker's AI assistant. Use available tools to help users analyze documents.",
      userMessage: message,
      context: context || {},
      provider: provider || "claude",
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/batch/process", async (req, res) => {
  try {
    const { documents, operation, provider } = req.body;
    if (!documents || !Array.isArray(documents) || documents.length === 0)
      return res.status(400).json({ error: "documents array is required" });
    if (!operation)
      return res.status(400).json({
        error: "operation is required (summarize, keyIdeas, sentiment)",
      });
    res.json(
      await batchProcessor.processBatch(documents, operation, {
        provider: provider || "claude",
      }),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/conversations/:userId/:documentId/message", async (req, res) => {
  try {
    const { userId, documentId } = req.params;
    const { role, content } = req.body;
    if (!role || !content)
      return res.status(400).json({ error: "role and content required" });
    const conv = await conversationStore.addMessage(
      userId,
      documentId,
      role,
      content,
    );
    res.json({
      messageCount: conv.messageCount,
      hasSummary: !!conv.summary,
      recentMessages: conv.messages.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/conversations/:userId/:documentId", (req, res) => {
  const conv = conversationStore.getConversation(
    req.params.userId,
    req.params.documentId,
  );
  res.json({
    messageCount: conv.messageCount,
    messages: conv.messages,
    hasSummary: !!conv.summary,
  });
});

app.delete("/api/conversations/:userId/:documentId", (req, res) => {
  conversationStore.clearConversation(req.params.userId, req.params.documentId);
  res.json({ success: true });
});

// Error handling
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 4000;
app.listen(port, "0.0.0.0", () =>
  console.log(`Orchestrator listening on port ${port}`),
);

module.exports = app;
