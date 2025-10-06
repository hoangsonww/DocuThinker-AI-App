"""Summarization helpers built on top of the shared document service."""

from __future__ import annotations

from ai_ml.services import get_document_service
from ai_ml.tools import ChunkConfig, chunk_document


def summarize_text(text: str, max_chunk_length: int = 2800) -> str:
    """Summarize text, chunking when necessary for long documents."""

    service = get_document_service()

    if len(text) <= max_chunk_length:
        return service.summarize(text)

    cfg = ChunkConfig(chunk_size=max_chunk_length, chunk_overlap=int(max_chunk_length * 0.1))
    chunks = chunk_document(text, config=cfg)
    partial = [service.summarize(doc.page_content) for doc in chunks]
    combined = "\n".join(partial)
    return service.summarize(combined)


__all__ = ["summarize_text"]
