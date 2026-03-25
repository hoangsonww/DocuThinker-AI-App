const { z } = require("zod");

const SummaryResponse = z.object({
  summary: z.string().min(20).max(5000),
  wordCount: z.number().int().positive().optional(),
  language: z.string().optional(),
});
const KeyIdeasResponse = z.object({
  ideas: z.array(z.string().min(10).max(500)).min(1).max(10),
  documentTitle: z.string().optional(),
});
const DiscussionPointsResponse = z.object({
  points: z.array(z.string().min(10).max(500)).min(1).max(10),
});
const SentimentResponse = z.object({
  overall: z.enum(["positive", "negative", "neutral", "mixed"]),
  confidence: z.number().min(0).max(1),
  tones: z.array(z.string()).min(1).max(5),
  shifts: z.array(z.string()).optional(),
  summary: z.string().min(10).max(500),
});
const BulletSummaryResponse = z.object({
  bullets: z.array(z.string().min(5).max(300)).min(3).max(15),
});
const RewriteResponse = z.object({
  rewritten: z.string().min(10),
  style: z.string(),
  originalLength: z.number().int().positive().optional(),
  rewrittenLength: z.number().int().positive().optional(),
});
const RecommendationsResponse = z.object({
  recommendations: z
    .array(
      z.object({
        recommendation: z.string().min(10).max(500),
        rationale: z.string().min(10).max(300),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .min(1)
    .max(10),
});
const CategoryResponse = z.object({
  topic: z.string(),
  type: z.string(),
  domain: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).min(1).max(10),
});
const ChatResponse = z.object({
  message: z.string().min(1),
  citations: z
    .array(z.object({ text: z.string(), location: z.string().optional() }))
    .optional(),
  followUpQuestions: z.array(z.string()).optional(),
});
const IntentClassification = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
const BatchResult = z.object({
  results: z.array(
    z.object({
      documentId: z.string(),
      status: z.enum(["success", "error"]),
      data: z.any().optional(),
      error: z.string().optional(),
    }),
  ),
  totalProcessed: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
  successRate: z.string(),
});
const DocumentAnalytics = z.object({
  wordCount: z.number().int().nonnegative(),
  sentenceCount: z.number().int().nonnegative(),
  paragraphCount: z.number().int().nonnegative(),
  readingTimeMinutes: z.number().positive(),
  readabilityScore: z.number().min(0).max(100).optional(),
  topKeywords: z
    .array(
      z.object({ word: z.string(), frequency: z.number().int().positive() }),
    )
    .optional(),
});
const TranslateResponse = z.object({
  translated: z.string().min(1),
  targetLanguage: z.string().optional(),
  originalLength: z.number().int().positive().optional(),
});

const SCHEMAS = {
  summary: SummaryResponse,
  keyIdeas: KeyIdeasResponse,
  discussionPoints: DiscussionPointsResponse,
  sentiment: SentimentResponse,
  bulletSummary: BulletSummaryResponse,
  rewrite: RewriteResponse,
  recommendations: RecommendationsResponse,
  category: CategoryResponse,
  chat: ChatResponse,
  intent: IntentClassification,
  batch: BatchResult,
  analytics: DocumentAnalytics,
  translate: TranslateResponse,
};

function validateAIOutput(name, data) {
  const s = SCHEMAS[name];
  if (!s) throw new Error(`Unknown schema: ${name}`);
  const r = s.safeParse(data);
  if (!r.success)
    throw new Error(
      `Validation failed for ${name}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  return r.data;
}
function parseAndValidate(name, raw) {
  let data;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    if (name === "summary") data = { summary: raw };
    else if (name === "chat") data = { message: raw };
    else
      throw new Error(`Non-JSON for ${name}: ${String(raw).substring(0, 200)}`);
  }
  return validateAIOutput(name, data);
}
function getSchemaNames() {
  return Object.keys(SCHEMAS);
}

module.exports = {
  SummaryResponse,
  KeyIdeasResponse,
  DiscussionPointsResponse,
  SentimentResponse,
  BulletSummaryResponse,
  RewriteResponse,
  RecommendationsResponse,
  CategoryResponse,
  ChatResponse,
  IntentClassification,
  BatchResult,
  DocumentAnalytics,
  TranslateResponse,
  validateAIOutput,
  parseAndValidate,
  getSchemaNames,
};
