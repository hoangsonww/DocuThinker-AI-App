"""Recommendation generator relying on the document service."""

from __future__ import annotations

from ai_ml.services import get_document_service


def generate_recommendations(document: str) -> str:
    service = get_document_service()
    return service.recommendations(document)


__all__ = ["generate_recommendations"]
