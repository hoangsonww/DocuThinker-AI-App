"""Runtime configuration helpers for DocuThinker's AI/ML services."""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Dict
import os


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class ProviderSpec:
    """Describe how to instantiate a provider-backed LLM."""

    provider: str
    model: str
    temperature: float = 0.2
    max_tokens: int | None = None
    extra: Dict[str, Any] = field(default_factory=dict)


DEFAULT_TRANSLATION_MODELS: Dict[str, str] = {
    "fr": "Helsinki-NLP/opus-mt-en-fr",
    "de": "Helsinki-NLP/opus-mt-en-de",
    "es": "Helsinki-NLP/opus-mt-en-es",
    "it": "Helsinki-NLP/opus-mt-en-it",
    "pt": "Helsinki-NLP/opus-mt-en-pt",
    "zh": "Helsinki-NLP/opus-mt-en-zh",
    "ja": "Helsinki-NLP/opus-mt-en-ja",
}


@dataclass(frozen=True)
class Settings:
    """Container for all runtime knobs used across the AI subsystem."""

    agent_models: Dict[str, ProviderSpec]
    embedding_provider: str = "huggingface"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    translation_models: Dict[str, str] = field(default_factory=lambda: DEFAULT_TRANSLATION_MODELS.copy())
    chunk_size: int = 900
    chunk_overlap: int = 120
    rag_question: str = "Provide a comprehensive intelligence brief for this document."
    bullet_summary_style: str = "Use concise bullet points and preserve key metrics or figures."
    knowledge_base_path: str | None = None
    fallback_hf_summarizer: str = "facebook/bart-large-cnn"
    auto_sync_graph: bool = False
    auto_sync_vector_store: bool = False
    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None
    neo4j_database: str | None = None
    chroma_persist_directory: str | None = None
    chroma_collection_name: str = "docuthinker"
    vector_top_k: int = 6


@lru_cache(maxsize=1)
def load_settings() -> Settings:
    """Load settings once, allowing environment overrides for critical values."""

    analyst_model = os.getenv("DOCUTHINKER_OPENAI_MODEL", "gpt-4o-mini")
    researcher_model = os.getenv("DOCUTHINKER_GEMINI_MODEL", "gemini-1.5-pro")
    reviewer_model = os.getenv("DOCUTHINKER_CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
    sentiment_model = os.getenv("DOCUTHINKER_SENTIMENT_MODEL", "claude-3-haiku-20240307")
    qa_model = os.getenv("DOCUTHINKER_QA_MODEL", analyst_model)

    chunk_size = int(os.getenv("DOCUTHINKER_CHUNK_SIZE", "900"))
    chunk_overlap = int(os.getenv("DOCUTHINKER_CHUNK_OVERLAP", "120"))
    embedding_model = os.getenv("DOCUTHINKER_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    embedding_provider = os.getenv("DOCUTHINKER_EMBEDDING_PROVIDER", "huggingface")
    auto_sync_graph = _env_flag("DOCUTHINKER_SYNC_GRAPH", False)
    auto_sync_vector = _env_flag("DOCUTHINKER_SYNC_VECTOR", False)
    neo4j_uri = os.getenv("DOCUTHINKER_NEO4J_URI")
    neo4j_user = os.getenv("DOCUTHINKER_NEO4J_USER")
    neo4j_password = os.getenv("DOCUTHINKER_NEO4J_PASSWORD")
    neo4j_database = os.getenv("DOCUTHINKER_NEO4J_DATABASE")
    chroma_persist_directory = os.getenv("DOCUTHINKER_CHROMA_DIR")
    chroma_collection = os.getenv("DOCUTHINKER_CHROMA_COLLECTION", "docuthinker")
    vector_top_k = int(os.getenv("DOCUTHINKER_VECTOR_TOP_K", "6"))

    agent_models: Dict[str, ProviderSpec] = {
        "analyst": ProviderSpec(provider="openai", model=analyst_model, temperature=0.15, max_tokens=900),
        "researcher": ProviderSpec(provider="google", model=researcher_model, temperature=0.2, max_tokens=1024),
        "reviewer": ProviderSpec(provider="anthropic", model=reviewer_model, temperature=0.15, max_tokens=1024),
        "sentiment": ProviderSpec(provider="anthropic", model=sentiment_model, temperature=0.05, max_tokens=512),
        "qa": ProviderSpec(provider="openai", model=qa_model, temperature=0.05, max_tokens=900),
    }

    return Settings(
        agent_models=agent_models,
        embedding_provider=embedding_provider,
        embedding_model=embedding_model,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        rag_question=os.getenv("DOCUTHINKER_RAG_QUESTION", "Provide a comprehensive intelligence brief for this document."),
        bullet_summary_style=os.getenv(
            "DOCUTHINKER_BULLET_STYLE",
            "Use concise bullet points and preserve key metrics or figures.",
        ),
        knowledge_base_path=os.getenv("DOCUTHINKER_KB_PATH"),
        fallback_hf_summarizer=os.getenv("DOCUTHINKER_FALLBACK_SUMMARIZER", "facebook/bart-large-cnn"),
        auto_sync_graph=auto_sync_graph,
        auto_sync_vector_store=auto_sync_vector,
        neo4j_uri=neo4j_uri,
        neo4j_user=neo4j_user,
        neo4j_password=neo4j_password,
        neo4j_database=neo4j_database,
        chroma_persist_directory=chroma_persist_directory,
        chroma_collection_name=chroma_collection,
        vector_top_k=vector_top_k,
    )
