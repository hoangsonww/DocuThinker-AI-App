"""Bullet summary generator using the shared document service."""

from __future__ import annotations

from ai_ml.services import get_document_service


def generate_bullet_summary(document: str) -> str:
    service = get_document_service()
    return service.bullet_summary(document)


__all__ = ["generate_bullet_summary"]
