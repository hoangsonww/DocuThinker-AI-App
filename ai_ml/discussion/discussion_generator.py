"""Discussion point generation built on top of the orchestrated service."""

from __future__ import annotations

from ai_ml.services import get_document_service


def generate_discussion_points(text: str) -> str:
    service = get_document_service()
    return service.discussion_points(text)


__all__ = ["generate_discussion_points"]
