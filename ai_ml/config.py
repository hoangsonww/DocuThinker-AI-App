"""Static configuration retained for legacy compatibility."""

from __future__ import annotations

from ai_ml.core import load_settings

SETTINGS = load_settings()

MODEL_NAMES = {
    "summarizer": SETTINGS.fallback_hf_summarizer,
    "qa": "distilbert-base-cased-distilled-squad",
    "discussion": "gpt2",
    "rag": "facebook/rag-token-nq",
    "topic_extractor": "facebook/bart-large-mnli",
}

TRANSLATION_MODELS = SETTINGS.translation_models

PROMPT_TEMPLATES = {
    "summarization": "Summarize the following document in a concise manner:\n\n{text}\n\nSummary:",
    "qa": "Based on the context below, answer the question:\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:",
    "discussion": "Generate discussion points for the following document:\n\n{text}\n\nDiscussion Points:",
    "rag": "Analyze the following document and provide an in-depth analysis:\n\n{text}\n\nAnalysis:",
}

__all__ = ["MODEL_NAMES", "TRANSLATION_MODELS", "PROMPT_TEMPLATES", "SETTINGS"]
