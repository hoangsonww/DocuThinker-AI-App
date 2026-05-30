"""Sentiment analysis helper."""

from __future__ import annotations

from typing import Any, Dict

from ai_ml.services import get_document_service


def analyze_sentiment(text: str) -> Dict[str, Any]:
    service = get_document_service()
    return service.sentiment(text)


__all__ = ["analyze_sentiment"]
