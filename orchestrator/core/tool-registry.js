class ToolRegistry {
  constructor({ pythonBridge, logger } = {}) { this.pythonBridge = pythonBridge; this.logger = logger || console; this.tools = new Map(); }

  register(name, def, handler) { this.tools.set(name, { definition: { name, description: def.description, input_schema: def.inputSchema }, handler, source: def.source || "local" }); }
  getToolDefinitions() { return [...this.tools.values()].map(t => t.definition); }
  getToolNames() { return [...this.tools.keys()]; }
  async execute(name, input) { const t = this.tools.get(name); if (!t) throw new Error(`Unknown tool: ${name}`); return t.handler(input); }

  registerStandardTools() {
    this.register("analyze_document_text", { description: "Analyze document text for word count, sentence count, reading time, keywords", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } }, async (input) => {
      const words = input.text.split(/\s+/).filter(w => w.length > 0);
      const sentences = input.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = input.text.split(/\n\n+/).filter(p => p.trim().length > 0);
      const freq = {}; words.forEach(w => { const l = w.toLowerCase().replace(/[^a-z0-9]/g, ""); if (l.length > 3) freq[l] = (freq[l] || 0) + 1; });
      return { wordCount: words.length, sentenceCount: sentences.length, paragraphCount: paragraphs.length, readingTimeMinutes: Math.ceil(words.length / 250), topKeywords: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, frequency]) => ({ word, frequency })) };
    });
    if (this.pythonBridge) {
      this.register("extract_entities", { description: "Extract named entities using NER", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }, source: "python-bridge" }, async (input) => this.pythonBridge.extractEntities(input.text));
      this.register("rag_search", { description: "RAG search across indexed documents", inputSchema: { type: "object", properties: { query: { type: "string" }, topK: { type: "number" } }, required: ["query"] }, source: "python-bridge" }, async (input) => this.pythonBridge.ragQuery(input.query, input.topK));
      this.register("knowledge_graph_query", { description: "Query knowledge graph for entity relationships", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }, source: "python-bridge" }, async (input) => this.pythonBridge.graphQuery(input.query));
      this.register("vector_search", { description: "Semantic similarity search", inputSchema: { type: "object", properties: { query: { type: "string" }, topK: { type: "number" } }, required: ["query"] }, source: "python-bridge" }, async (input) => this.pythonBridge.vectorSearch(input.query, input.topK));
      this.register("python_sentiment", { description: "Python NLP sentiment analysis", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }, source: "python-bridge" }, async (input) => this.pythonBridge.analyzeSentiment(input.text));
    }
  }
}

module.exports = { ToolRegistry };
