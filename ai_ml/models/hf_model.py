"""Compatibility helpers bridging historical Hugging Face flows to the new services."""

from __future__ import annotations

import logging
from typing import Any, Dict

try:
    from transformers import pipeline
except ImportError:  # pragma: no cover - optional dependency
    pipeline = None  # type: ignore

from ai_ml.core import load_settings
logger = logging.getLogger(__name__)


class _SingleArgChain:
    def __init__(self, func):
        self._func = func

    def run(self, text: str) -> Any:
        return self._func(text)


class _QAChain:
    def __init__(self, func):
        self._func = func

    def run(self, *, context: str, question: str) -> Any:
        return self._func(context, question)


def load_models() -> Dict[str, Any]:
    """Return lightweight wrappers compatible with legacy notebook flows."""

    from ai_ml.services import get_document_service

    service = get_document_service()
    return {
        "summarizer_chain": _SingleArgChain(service.summarize),
        "discussion_chain": _SingleArgChain(service.discussion_points),
        "topic_extractor": service.extract_topics,
        "sentiment_analyzer": service.sentiment,
        "qa_chain": _QAChain(service.answer_question),
        "rag_chain": service.pipeline,
    }


def load_translation_model(target_lang: str):
    """Load a Hugging Face translation pipeline for the requested language."""

    settings = load_settings()
    model_map = settings.translation_models
    if target_lang not in model_map:
        raise ValueError(f"Translation model for language '{target_lang}' is not configured.")
    if pipeline is None:
        raise RuntimeError("transformers is required to instantiate translation models.")
    model_name = model_map[target_lang]
    logger.info("Loading translator model for language '%s' (%s)...", target_lang, model_name)
    task_name = f"translation_en_to_{target_lang}"
    return pipeline(task_name, model=model_name)


__all__ = ["load_models", "load_translation_model"]
