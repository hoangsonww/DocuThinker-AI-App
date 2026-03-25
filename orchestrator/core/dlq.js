class DeadLetterQueue {
  constructor({ maxRetries = 3, logger } = {}) { this.maxRetries = maxRetries; this.logger = logger || console; this.dlq = []; this.retryQueue = []; }

  async enqueue(op) {
    const msg = { id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, timestamp: new Date().toISOString(), retryCount: (op.retryCount || 0) + 1, operation: { type: op.type, intent: op.intent, provider: op.provider }, error: { message: op.error?.message, type: op.errorType }, context: { traceId: op.traceId, userId: op.userId, documentId: op.documentId } };
    if (msg.retryCount <= this.maxRetries) { this.retryQueue.push(msg); } else { this.dlq.push(msg); }
    return msg;
  }

  getRetryable() { return this.retryQueue.splice(0, this.retryQueue.length); }
  getStats() { return { dlqMessages: this.dlq.length, retryMessages: this.retryQueue.length }; }
  getDLQMessages(limit = 50) { return this.dlq.slice(-limit); }
  clearDLQ() { const c = this.dlq.length; this.dlq = []; return c; }
}

module.exports = { DeadLetterQueue };
