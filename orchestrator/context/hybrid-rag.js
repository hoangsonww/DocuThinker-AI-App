class HybridRAG {
  constructor({ redisClient, pythonBridge, logger } = {}) {
    this.redis = redisClient;
    this.pythonBridge = pythonBridge;
    this.logger = logger || console;
  }

  async search(query, options = {}) {
    const topK = options.topK || 5;
    const [kw, sem] = await Promise.allSettled([
      this.keywordSearch(query, topK * 2),
      this.semanticSearch(query, topK * 2),
    ]);
    const kwDocs = kw.status === "fulfilled" ? kw.value : [],
      semDocs = sem.status === "fulfilled" ? sem.value : [];
    return {
      results: this.reciprocalRankFusion([kwDocs, semDocs], topK),
      sources: { keyword: kwDocs.length, semantic: semDocs.length },
    };
  }

  async keywordSearch(query, topK) {
    if (!this.redis) return [];
    try {
      const keywords = query
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2),
        results = [];
      const keys = await this.redis.keys("doc:chunk:*");
      for (const key of keys.slice(0, 100)) {
        const chunk = await this.redis.get(key);
        if (!chunk) continue;
        const mc = keywords.filter((k) =>
          chunk.toLowerCase().includes(k),
        ).length;
        if (mc > 0)
          results.push({
            id: key,
            text: chunk,
            score: mc / keywords.length,
            source: "keyword",
          });
      }
      return results.sort((a, b) => b.score - a.score).slice(0, topK);
    } catch (e) {
      return [];
    }
  }

  async semanticSearch(query, topK) {
    if (!this.pythonBridge) return [];
    try {
      const r = await this.pythonBridge.vectorSearch(query, topK);
      return (r.results || []).map((r) => ({
        id: r.id,
        text: r.text || r.content,
        score: r.score || r.similarity,
        source: "semantic",
      }));
    } catch (e) {
      return [];
    }
  }

  reciprocalRankFusion(lists, topK, k = 60) {
    const scores = new Map();
    for (const list of lists)
      for (let rank = 0; rank < list.length; rank++) {
        const doc = list[rank],
          id = doc.id || String(doc.text).substring(0, 100);
        const e = scores.get(id) || { doc, score: 0 };
        e.score += 1 / (k + rank + 1);
        scores.set(id, e);
      }
    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((e) => ({ ...e.doc, rrfScore: e.score }));
  }
}

module.exports = { HybridRAG };
