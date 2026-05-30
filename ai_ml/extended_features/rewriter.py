"""Rewrite helper exposing tone-controlled transformations."""

from __future__ import annotations

from ai_ml.services import get_document_service


def rewrite_document(document: str, tone: str = "professional") -> str:
    service = get_document_service()
    return service.rewrite(document, tone=tone)


__all__ = ["rewrite_document"]
