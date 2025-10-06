"""Question answering interface built atop the agentic pipeline."""

from __future__ import annotations

from ai_ml.services import get_document_service


def answer_question(context: str, question: str) -> str:
    service = get_document_service()
    return service.answer_question(context, question)


__all__ = ["answer_question"]
