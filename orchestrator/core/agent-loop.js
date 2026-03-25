class AgentLoop {
  constructor({ llmClient, toolRegistry, maxIterations = 10, logger } = {}) {
    this.llmClient = llmClient;
    this.toolRegistry = toolRegistry;
    this.maxIterations = maxIterations;
    this.logger = logger || console;
  }

  async run({ systemPrompt, userMessage, context = {}, provider = "claude" }) {
    const messages = [];
    const toolResults = [];
    let iteration = 0;
    let totalTokensUsed = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
    let lastProvider = provider;

    messages.push({ role: "user", content: this.buildContextualMessage(userMessage, context) });

    while (iteration < this.maxIterations) {
      iteration++;
      const response = await this.llmClient.call({ provider, model: provider === "claude" ? "claude-sonnet-4-20250514" : undefined, messages, systemPrompt, tools: this.toolRegistry.getToolDefinitions(), maxTokens: 4096 });
      if (response.tokensUsed) { totalTokensUsed.input += response.tokensUsed.input || 0; totalTokensUsed.output += response.tokensUsed.output || 0; totalTokensUsed.cacheRead += response.tokensUsed.cacheRead || 0; totalTokensUsed.cacheCreation += response.tokensUsed.cacheCreation || 0; }
      if (response.provider) lastProvider = response.provider;

      if (response.toolUse?.length > 0) {
        const assistantContent = []; if (response.content) assistantContent.push({ type: "text", text: response.content }); assistantContent.push(...response.toolUse);
        messages.push({ role: "assistant", content: assistantContent });
        const results = await Promise.all(response.toolUse.map(async tc => {
          try { return { type: "tool_result", tool_use_id: tc.id, content: JSON.stringify(await this.toolRegistry.execute(tc.name, tc.input)) }; }
          catch (e) { return { type: "tool_result", tool_use_id: tc.id, content: JSON.stringify({ error: e.message }), is_error: true }; }
        }));
        messages.push({ role: "user", content: results });
        toolResults.push(...results);
      } else {
        return { response: response.content, iterations: iteration, toolsUsed: toolResults.length, tokensUsed: totalTokensUsed, provider: lastProvider };
      }
    }
    return { response: "Max iterations reached.", iterations: iteration, toolsUsed: toolResults.length, tokensUsed: totalTokensUsed, provider: lastProvider, maxIterationsReached: true };
  }

  buildContextualMessage(msg, ctx) {
    let out = msg;
    if (ctx.documentText) out += `\n\n<document_context>\n${ctx.documentText}\n</document_context>`;
    if (ctx.documentTitle) out += `\n<document_title>${ctx.documentTitle}</document_title>`;
    if (ctx.previousSummary) out += `\n<previous_summary>${ctx.previousSummary}</previous_summary>`;
    if (ctx.userPreferences) out += `\n<user_preferences>${JSON.stringify(ctx.userPreferences)}</user_preferences>`;
    return out;
  }
}

module.exports = { AgentLoop };
