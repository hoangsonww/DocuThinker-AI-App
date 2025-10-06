"""Document-centric tools shared between CrewAI agents and the MCP server."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable, List, Optional

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.vectorstores import VectorStoreRetriever

try:
    from langchain_community.vectorstores import FAISS
except ImportError:  # pragma: no cover - optional dependency
    FAISS = None  # type: ignore

from langchain.tools import Tool

from ai_ml.providers import get_embedding_model


@dataclass
class ChunkConfig:
    chunk_size: int = 800
    chunk_overlap: int = 80


def chunk_document(text: str, *, config: ChunkConfig | None = None) -> List[Document]:
    """Split an arbitrary text document into LangChain ``Document`` chunks."""

    cfg = config or ChunkConfig()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=cfg.chunk_size,
        chunk_overlap=cfg.chunk_overlap,
    )
    return splitter.create_documents([text])


def build_vector_store(
    text: str,
    *,
    embedding_provider: str = "huggingface",
    embedding_model: Optional[str] = None,
    config: ChunkConfig | None = None,
) -> VectorStoreRetriever:
    """Create an in-memory FAISS vector store retriever for a document."""

    if FAISS is None:
        raise RuntimeError("langchain-community[faiss] is required to build FAISS retrievers.")

    documents = chunk_document(text, config=config)
    embeddings = get_embedding_model(embedding_provider, model=embedding_model)
    store = FAISS.from_documents(documents, embeddings)
    return store.as_retriever(search_kwargs={"k": 6})


def create_vector_retriever(
    documents: Iterable[Document],
    *,
    embedding_provider: str = "huggingface",
    embedding_model: Optional[str] = None,
) -> VectorStoreRetriever:
    """Expose a retriever for pre-chunked documents."""

    if FAISS is None:
        raise RuntimeError("langchain-community[faiss] is required to build FAISS retrievers.")

    docs = list(documents)
    embeddings = get_embedding_model(embedding_provider, model=embedding_model)
    store = FAISS.from_documents(docs, embeddings)
    return store.as_retriever(search_kwargs={"k": 6})


@dataclass
class DocumentSearchTool:
    """Simple semantic search tool that wraps a LangChain retriever."""

    retriever: VectorStoreRetriever
    name: str = "document_search"
    description: str = (
        "Semantic search over the currently loaded document. "
        "Use this to pull supporting quotes and context snippets."
    )

    def __call__(self, query: str) -> str:
        docs = self.retriever.get_relevant_documents(query)
        payload = [
            {
                "source": doc.metadata.get("source", "document"),
                "page": doc.metadata.get("page"),
                "snippet": doc.page_content,
            }
            for doc in docs
        ]
        return json.dumps(payload, ensure_ascii=True, indent=2)

    def to_langchain_tool(self) -> Tool:
        return Tool(name=self.name, description=self.description, func=self.__call__)


@dataclass
class InsightsExtractionTool:
    """Lightweight tool that surfaces key topics extracted via heuristics."""

    documents: List[Document]
    name: str = "document_topics"
    description: str = (
        "Use this to list the latent topics and sections covered in the document."
    )

    def __call__(self, _: str | None = None) -> str:
        unique_chunks = {doc.page_content.strip() for doc in self.documents if doc.page_content.strip()}
        highlights = list(unique_chunks)[:10]
        return json.dumps(highlights, ensure_ascii=True, indent=2)

    def to_langchain_tool(self) -> Tool:
        return Tool(name=self.name, description=self.description, func=self.__call__)
