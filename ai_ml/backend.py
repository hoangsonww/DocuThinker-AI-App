import logging
from typing import Any, Dict, List, Optional

from ai_ml.services import get_document_service

logger = logging.getLogger(__name__)
SERVICE = get_document_service()


def analyze_document(
    document: str,
    question: Optional[str] = None,
    translate_lang: str = "fr",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Analyze a document using the shared DocumentIntelligenceService."""

    logger.debug("Backend analyze_document invoked (question=%s, translate=%s)", question, translate_lang)
    return SERVICE.analyze_document(
        document,
        question=question,
        translate_lang=translate_lang,
        metadata=metadata,
    )


def summarize(document: str) -> str:
    return SERVICE.summarize(document)


def extract_topics(document: str) -> list[str]:
    return SERVICE.extract_topics(document)


def discussion_points(document: str) -> str:
    return SERVICE.discussion_points(document)


def translate(document: str, target_lang: str) -> Optional[str]:
    return SERVICE.translate(document, target_lang)


def sentiment(document: str) -> Dict[str, Any]:
    return SERVICE.sentiment(document)


def recommendations(document: str) -> str:
    return SERVICE.recommendations(document)


def refined_summary(document: str, draft_summary: str) -> str:
    return SERVICE.refine_summary(draft_summary, document)


def rewritten(document: str, tone: str = "professional") -> str:
    return SERVICE.rewrite(document, tone=tone)


def generate_bullet_summary(document: str) -> str:
    return SERVICE.bullet_summary(document)


def sync_to_knowledge_graph(document: str, metadata: Dict[str, Any], agentic_payload: Dict[str, Any]) -> Dict[str, Any]:
    return SERVICE.sync_to_knowledge_graph(document=document, agentic_payload=agentic_payload, metadata=metadata)


def run_graph_query(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    return SERVICE.run_graph_query(query, params)


def upsert_vector_document(document: str, metadata: Optional[Dict[str, Any]] = None, doc_id: Optional[str] = None) -> Dict[str, Any]:
    return SERVICE.upsert_vector_document(document=document, metadata=metadata, doc_id=doc_id)


def query_vector_index(query: str, n_results: Optional[int] = None) -> List[Dict[str, Any]]:
    return SERVICE.query_vector_index(query, n_results=n_results)
