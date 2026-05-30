"""MCP server that exposes DocuThinker's agentic analysis utilities as tools."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP

from ai_ml.services import get_document_service

app = FastMCP("docuthinker-agentic")
SERVICE = get_document_service()


@app.tool()
def agentic_document_brief(document: str, question: Optional[str] = None, translate_lang: str = "fr") -> dict:
    """Run the full agentic analysis pipeline and return the structured payload."""

    return SERVICE.analyze_document(document=document, question=question, translate_lang=translate_lang)


@app.tool()
def semantic_document_search(document: str, query: str) -> list:
    """Perform semantic search against a single document and return snippets."""

    return SERVICE.semantic_search(document, query)


@app.tool()
def quick_topics(document: str) -> list:
    """Extract quick bullet topics from the provided document."""

    return SERVICE.extract_topics(document)


@app.tool()
def vector_upsert(document: str, doc_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> dict:
    """Persist a document into the shared Chroma vector store."""

    return SERVICE.upsert_vector_document(document=document, metadata=metadata, doc_id=doc_id)


@app.tool()
def vector_search(query: str, n_results: int = 5) -> list:
    """Search the persistent vector index using semantic similarity."""
    try:
        return SERVICE.query_vector_index(query, n_results=n_results)
    except Exception as exc:  # pragma: no cover - runtime safety
        return [{"error": str(exc)}]


@app.tool()
def graph_upsert(document: str, metadata: Optional[Dict[str, Any]] = None) -> dict:
    """Sync the document's summary and topics into Neo4j."""

    payload = SERVICE.pipeline.run(document)
    return SERVICE.sync_to_knowledge_graph(
        document=document,
        agentic_payload=payload,
        metadata=metadata or {},
    )


@app.tool()
def graph_query(query: str, params: Optional[Dict[str, Any]] = None) -> list:
    """Execute a Cypher query against the Neo4j knowledge graph."""

    try:
        return SERVICE.run_graph_query(query, params)
    except Exception as exc:  # pragma: no cover - runtime safety
        return [{"error": str(exc)}]


if __name__ == "__main__":  # pragma: no cover - manual launch helper
    app.run()
