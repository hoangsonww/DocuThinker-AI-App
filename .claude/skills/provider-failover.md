# Skill: Multi-Provider LLM Failover

## Provider Order
1. Claude (summarization, analysis, structured output)
2. Gemini (multilingual, long context, translation)

## Steps
1. Attempt primary provider
2. If failure: check circuit breaker
3. If open: skip to next provider
4. Log failover with trace ID

## Cost
- Claude Sonnet: ~$3/M input, $15/M output
- Gemini Pro: ~$0.50/M input, $1.50/M output
