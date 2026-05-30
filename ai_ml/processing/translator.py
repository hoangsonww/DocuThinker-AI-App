"""Translation utilities with language-specific caching."""

from __future__ import annotations

from typing import Optional

from ai_ml.services import get_document_service


def translate_text(text: str, target_lang: str) -> Optional[str]:
    service = get_document_service()
    return service.translate(text, target_lang)


__all__ = ["translate_text"]
