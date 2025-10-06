#!/usr/bin/env bash

# Helper script to export local environment variables mirroring production.
# Usage: source aws/scripts/local-env.sh

export DOCUTHINKER_SYNC_GRAPH=${DOCUTHINKER_SYNC_GRAPH:-false}
export DOCUTHINKER_SYNC_VECTOR=${DOCUTHINKER_SYNC_VECTOR:-false}
export DOCUTHINKER_OPENAI_MODEL=${DOCUTHINKER_OPENAI_MODEL:-gpt-4o-mini}
export DOCUTHINKER_CLAUDE_MODEL=${DOCUTHINKER_CLAUDE_MODEL:-claude-3-5-sonnet-20241022}
export DOCUTHINKER_GEMINI_MODEL=${DOCUTHINKER_GEMINI_MODEL:-gemini-1.5-pro}

if [ "$DOCUTHINKER_SYNC_GRAPH" = "true" ]; then
  export DOCUTHINKER_NEO4J_URI=${DOCUTHINKER_NEO4J_URI:-bolt://localhost:7687}
  export DOCUTHINKER_NEO4J_USER=${DOCUTHINKER_NEO4J_USER:-neo4j}
  export DOCUTHINKER_NEO4J_PASSWORD=${DOCUTHINKER_NEO4J_PASSWORD:-password}
fi

if [ "$DOCUTHINKER_SYNC_VECTOR" = "true" ]; then
  export DOCUTHINKER_CHROMA_DIR=${DOCUTHINKER_CHROMA_DIR:-.chroma}
  export DOCUTHINKER_CHROMA_COLLECTION=${DOCUTHINKER_CHROMA_COLLECTION:-docuthinker-local}
fi

echo "Local DocuThinker environment configured."
