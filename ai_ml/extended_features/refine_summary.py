"""Summary refinement helper."""

from __future__ import annotations

from ai_ml.services import get_document_service


def refine_summary(document: str, draft_summary: str) -> str:
    service = get_document_service()
    return service.refine_summary(draft_summary, document)


__all__ = ["refine_summary"]
