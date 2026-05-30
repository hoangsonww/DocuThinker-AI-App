"""Topic extraction leveraging the document intelligence service."""

from __future__ import annotations

from ai_ml.services import get_document_service


def extract_topics(text: str) -> list[str]:
    service = get_document_service()
    return service.extract_topics(text)


__all__ = ["extract_topics"]
