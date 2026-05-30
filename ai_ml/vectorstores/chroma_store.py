"""Chroma vector store helper for DocuThinker."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

try:
    import chromadb
except ImportError:  # pragma: no cover - optional dependency
    chromadb = None  # type: ignore


class ChromaNotConfigured(RuntimeError):
    """Raised when Chroma is not available or configured."""


@dataclass(frozen=True)
class ChromaConfig:
    persist_directory: str
    collection_name: str = "docuthinker"


class ChromaVectorClient:
    """Thin wrapper around a Chroma persistent collection."""

    def __init__(self, config: ChromaConfig) -> None:
        if chromadb is None:
            raise ChromaNotConfigured(
                "chromadb is not installed. Install the 'chromadb' package to enable persistent vector storage."
            )
        if not config.persist_directory:
            raise ChromaNotConfigured("Chroma persist directory is not configured.")
        self._config = config
        self._client = chromadb.PersistentClient(path=config.persist_directory)
        self._collection = self._client.get_or_create_collection(name=config.collection_name)

    # ------------------------------------------------------------------
    # CRUD helpers

    def upsert(
        self,
        *,
        ids: Iterable[str],
        documents: Iterable[str],
        metadatas: Optional[Iterable[Dict[str, Any]]] = None,
        embeddings: Optional[Iterable[List[float]]] = None,
    ) -> None:
        docs = list(documents)
        ids_list = list(ids)
        if len(ids_list) != len(docs):
            raise ValueError("ids and documents must have identical length.")
        metadata_list = list(metadatas) if metadatas is not None else None
        embedding_list = list(embeddings) if embeddings is not None else None
        self._collection.upsert(
            ids=ids_list,
            documents=docs,
            metadatas=metadata_list,
            embeddings=embedding_list,
        )

    def delete(self, *, ids: Optional[Iterable[str]] = None) -> None:
        if ids is None:
            return
        self._collection.delete(ids=list(ids))

    # ------------------------------------------------------------------
    # Query helpers

    def similarity_search(
        self,
        *,
        query: str,
        n_results: int = 5,
        embedding: Optional[List[float]] = None,
    ) -> List[Dict[str, Any]]:
        payload = self._collection.query(
            query_texts=None if embedding is not None else [query],
            query_embeddings=[embedding] if embedding is not None else None,
            n_results=n_results,
        )
        return _format_query_results(payload)


def _format_query_results(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    ids = payload.get("ids", [[]])[0]
    documents = payload.get("documents", [[]])[0]
    metadatas = payload.get("metadatas", [[]])[0]
    distances = payload.get("distances", [[]])[0]

    results: List[Dict[str, Any]] = []
    for idx, doc, meta, dist in zip(ids, documents, metadatas, distances):
        results.append(
            {
                "id": idx,
                "document": doc,
                "metadata": meta,
                "distance": dist,
            }
        )
    return results


__all__ = ["ChromaVectorClient", "ChromaNotConfigured", "ChromaConfig"]
