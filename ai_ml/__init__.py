"""DocuThinker AI/ML package entrypoint."""

from .backend import analyze_document
from .services import get_document_service

__all__ = ["analyze_document", "get_document_service"]
