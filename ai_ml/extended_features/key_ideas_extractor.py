"""Key ideas extraction built on top of the document service."""

from __future__ import annotations

from ai_ml.services import get_document_service


def generate_key_ideas(document: str) -> str:
    service = get_document_service()
    topics = service.extract_topics(document)
    if not topics:
        return ""
    return "\n".join(f"- {topic}" for topic in topics)


__all__ = ["generate_key_ideas"]
