const TEST_CASES = [
  {
    name: "Summarize - technical doc",
    promptKey: "document.summarize",
    input:
      "AI has transformed document analysis by enabling automated extraction of key information from unstructured text. Modern NLP models can identify entities, classify sentiment, and generate summaries with near-human accuracy.",
    schema: "summary",
    expectations: { minLength: 50, mustContain: ["AI", "document"] },
  },
  {
    name: "Key Ideas - business report",
    promptKey: "document.keyIdeas",
    input:
      "Q3 revenue grew 15% to $2.3B. Customer acquisition cost decreased 8%. Employee satisfaction rose to 4.2/5. New product line contributed $400M.",
    schema: "keyIdeas",
    expectations: { minItems: 3 },
  },
  {
    name: "Sentiment - mixed",
    promptKey: "document.sentiment",
    input:
      "The launch was incredibly successful. However, post-launch support has been disappointing. Customers love features but are frustrated by onboarding.",
    schema: "sentiment",
    expectations: { sentiment: "mixed" },
  },
];

async function runEvaluation(llmClient) {
  const {
    getSystemPrompt,
  } = require("../../orchestrator/prompts/system-prompts");
  const { parseAndValidate } = require("../../orchestrator/schemas/ai-outputs");
  const results = [];
  for (const tc of TEST_CASES) {
    try {
      const pc = getSystemPrompt(tc.promptKey);
      const r = await llmClient.call({
        provider: "claude",
        systemPrompt: pc.prompt,
        messages: [{ role: "user", content: tc.input }],
        maxTokens: pc.maxTokens,
        temperature: pc.temperature,
      });
      const validated = parseAndValidate(tc.schema, r.content);
      results.push({ name: tc.name, status: "PASS", schemaValid: true });
    } catch (e) {
      results.push({ name: tc.name, status: "ERROR", error: e.message });
    }
  }
  return results;
}

module.exports = { runEvaluation, TEST_CASES };
