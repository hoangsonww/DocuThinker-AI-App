const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

function createMCPServer() {
  const server = new Server({ name: "docuthinker-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: "document_summarize", description: "Generate AI summary of text", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_key_ideas", description: "Extract 3-7 key ideas", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_sentiment", description: "Analyze sentiment", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_discussion_points", description: "Generate discussion questions", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_analytics", description: "Word count, reading time, keywords", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_bullet_summary", description: "Bullet-point summary", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_rewrite", description: "Rewrite text in specified style", inputSchema: { type: "object", properties: { text: { type: "string" }, style: { type: "string" } }, required: ["text"] } },
      { name: "document_recommendations", description: "Actionable recommendations", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
      { name: "document_chat", description: "Chat about a document", inputSchema: { type: "object", properties: { message: { type: "string" }, documentText: { type: "string" } }, required: ["message", "documentText"] } },
      { name: "system_health", description: "System health check", inputSchema: { type: "object", properties: {} } },
      { name: "system_costs", description: "Cost usage report", inputSchema: { type: "object", properties: { period: { type: "string", enum: ["today", "week", "month"] } } } },
      { name: "rag_query", description: "RAG search across documents", inputSchema: { type: "object", properties: { query: { type: "string" }, topK: { type: "number" } }, required: ["query"] } },
      { name: "knowledge_graph_query", description: "Query knowledge graph", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "document_analytics") {
      const text = args.text || "", words = text.split(/\s+/).filter(w => w.length > 0), sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const freq = {}; words.forEach(w => { const l = w.toLowerCase().replace(/[^a-z0-9]/g, ""); if (l.length > 3) freq[l] = (freq[l] || 0) + 1; });
      return { content: [{ type: "text", text: JSON.stringify({ wordCount: words.length, sentenceCount: sentences.length, paragraphCount: text.split(/\n\n+/).filter(p => p.trim()).length, readingTimeMinutes: Math.ceil(words.length / 250), topKeywords: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, frequency]) => ({ word, frequency })) }) }] };
    }
    if (name === "system_health") return { content: [{ type: "text", text: JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }) }] };
    if (name === "system_costs") return { content: [{ type: "text", text: JSON.stringify({ period: args.period || "today", message: "Use orchestrator API at :4000/api/costs" }) }] };
    // Proxy AI-powered tools to the orchestrator HTTP API
    const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://localhost:4000";
    const toolToRoute = {
      document_summarize: { route: "/api/supervisor/process", body: { route: "/refine-summary", text: args.text } },
      document_key_ideas: { route: "/api/supervisor/process", body: { route: "/generate-key-ideas", text: args.text } },
      document_sentiment: { route: "/api/supervisor/process", body: { route: "/sentiment-analysis", text: args.text } },
      document_discussion_points: { route: "/api/supervisor/process", body: { route: "/generate-discussion-points", text: args.text } },
      document_bullet_summary: { route: "/api/supervisor/process", body: { route: "/bullet-summary", text: args.text } },
      document_rewrite: { route: "/api/supervisor/process", body: { route: "/content-rewriting", text: args.text, style: args.style } },
      document_recommendations: { route: "/api/supervisor/process", body: { route: "/actionable-recommendations", text: args.text } },
      document_chat: { route: "/api/supervisor/process", body: { route: "/chat", message: args.message, documentText: args.documentText } },
      rag_query: { route: "/api/tools/execute", body: { tool: "rag_search", input: { query: args.query, topK: args.topK } } },
      knowledge_graph_query: { route: "/api/tools/execute", body: { tool: "knowledge_graph_query", input: { query: args.query } } },
    };
    const mapping = toolToRoute[name];
    if (mapping) {
      try {
        const resp = await fetch(`${ORCHESTRATOR_URL}${mapping.route}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mapping.body) });
        const data = await resp.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message, hint: "Ensure orchestrator is running on port 4000" }) }], isError: true };
      }
    }
    return { content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }], isError: true };
  });

  return server;
}

async function main() { const s = createMCPServer(); await s.connect(new StdioServerTransport()); console.error("DocuThinker MCP server running"); }
if (require.main === module) main().catch(console.error);

module.exports = { createMCPServer };
