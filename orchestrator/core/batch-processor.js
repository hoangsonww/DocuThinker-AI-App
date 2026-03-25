class BatchProcessor {
  constructor({ llmClient, costTracker, logger } = {}) { this.llmClient = llmClient; this.costTracker = costTracker; this.logger = logger || console; this.BATCH_SIZE = 10; this.MAX_CONCURRENT = 3; }

  async processBatch(documents, operation, options = {}) {
    const results = [], errors = [], batches = this.chunkArray(documents, this.BATCH_SIZE);
    for (let i = 0; i < batches.length; i += this.MAX_CONCURRENT) {
      const concurrent = batches.slice(i, i + this.MAX_CONCURRENT);
      const batchResults = await Promise.allSettled(concurrent.map((batch, idx) => this.processSingleBatch(batch, operation, i + idx, options)));
      for (const r of batchResults) { if (r.status === "fulfilled") results.push(...r.value); else errors.push(r.reason); }
    }
    return { results, errors, totalProcessed: results.length, totalFailed: errors.length, successRate: ((results.length / Math.max(documents.length, 1)) * 100).toFixed(1) + "%" };
  }

  async processSingleBatch(batch, operation, batchIndex, options) {
    const results = [];
    for (let i = 0; i < batch.length; i++) {
      const doc = batch[i];
      try { results.push({ documentId: doc.id || doc._id || `doc-${batchIndex}-${i}`, status: "success", data: await this.executeOperation(doc, operation, options) }); }
      catch (e) { results.push({ documentId: doc.id || doc._id || `doc-${batchIndex}-${i}`, status: "error", error: e.message }); }
    }
    return results;
  }

  async executeOperation(doc, operation, options) {
    const text = doc.text || doc.content || "", provider = options.provider || "claude";
    const prompts = { summarize: `Summarize:\n\n${text}`, keyIdeas: `Extract key ideas:\n\n${text}`, sentiment: `Analyze sentiment:\n\n${text}` };
    if (!prompts[operation]) throw new Error(`Unknown operation: ${operation}`);
    return this.llmClient.call({ provider, messages: [{ role: "user", content: prompts[operation] }], maxTokens: 1000 });
  }

  chunkArray(arr, size) { const chunks = []; for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size)); return chunks; }
}

module.exports = { BatchProcessor };
