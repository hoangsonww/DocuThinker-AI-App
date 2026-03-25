class PythonBridge {
  constructor({ baseUrl, timeout = 30000, circuitBreaker, logger } = {}) {
    this.baseUrl =
      baseUrl || process.env.AI_ML_SERVICE_URL || "http://localhost:8000";
    this.timeout = timeout;
    this.circuitBreaker = circuitBreaker;
    this.logger = logger || console;
  }

  async analyzeDocument(text, options = {}) {
    return this.callPython("/api/analyze", {
      text,
      operations: options.operations || ["summarize", "key_ideas", "sentiment"],
      provider: options.provider || "auto",
    });
  }
  async ragQuery(query, topK = 5) {
    return this.callPython("/api/rag/query", { query, top_k: topK });
  }
  async crewAIAnalysis(text, taskType) {
    return this.callPython("/api/crew/analyze", { text, task_type: taskType });
  }
  async extractEntities(text) {
    return this.callPython("/api/nlp/ner", { text });
  }
  async analyzeSentiment(text) {
    return this.callPython("/api/nlp/sentiment", { text });
  }
  async graphQuery(cypher) {
    return this.callPython("/api/graph/query", { cypher });
  }
  async vectorSearch(query, topK = 5) {
    return this.callPython("/api/vector/search", { query, top_k: topK });
  }

  async healthCheck() {
    try {
      const r = await this.callPython("/health", {}, "GET");
      return { healthy: true, ...r };
    } catch (e) {
      return { healthy: false, error: e.message };
    }
  }

  async callPython(endpoint, body, method = "POST") {
    if (this.circuitBreaker && !this.circuitBreaker.canRequest("python-ai-ml"))
      throw new Error("Python AI/ML circuit breaker is OPEN");
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), this.timeout);
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
      };
      if (method !== "GET" && body) opts.body = JSON.stringify(body);
      const r = await fetch(`${this.baseUrl}${endpoint}`, opts);
      if (!r.ok) throw new Error(`Python ${endpoint} returned ${r.status}`);
      if (this.circuitBreaker)
        this.circuitBreaker.recordSuccess("python-ai-ml");
      return r.json();
    } catch (e) {
      if (this.circuitBreaker)
        this.circuitBreaker.recordFailure("python-ai-ml");
      throw e;
    } finally {
      clearTimeout(tid);
    }
  }
}

module.exports = { PythonBridge };
