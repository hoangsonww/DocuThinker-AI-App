"""RAG helpers now backed by the agentic LangGraph pipeline."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ai_ml.services import get_document_service


def retrieval_augmented_generation(text: str, question: Optional[str] = None) -> Dict[str, Any]:
    service = get_document_service()
    return service.pipeline.run(text, question=question)


__all__ = ["retrieval_augmented_generation"]
