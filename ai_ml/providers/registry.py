"""Central registry for chat and embedding models across multiple providers.

This module provides lightweight factories that lazily instantiate LangChain-compatible
LLMs and embedding models based on a provider string. We support OpenAI, Anthropic, and
Google Gemini out of the box, with graceful fallbacks when optional dependencies are
missing or API keys are not configured.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.embeddings import Embeddings

try:
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
except ImportError:  # pragma: no cover - optional dependency
    ChatOpenAI = None  # type: ignore
    OpenAIEmbeddings = None  # type: ignore

try:
    from langchain_anthropic import ChatAnthropic
except ImportError:  # pragma: no cover - optional dependency
    ChatAnthropic = None  # type: ignore

try:
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
except ImportError:  # pragma: no cover - optional dependency
    ChatGoogleGenerativeAI = None  # type: ignore
    GoogleGenerativeAIEmbeddings = None  # type: ignore

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:  # pragma: no cover - optional dependency
    HuggingFaceEmbeddings = None  # type: ignore


@dataclass(frozen=True)
class LLMConfig:
    """Configuration payload describing a single LLM instantiation."""

    provider: str
    model: str
    temperature: float = 0.2
    max_tokens: Optional[int] = None
    extra: Optional[Dict[str, Any]] = None


class MissingDependencyError(RuntimeError):
    """Raised when a provider dependency has not been installed."""


class MissingAPIKeyError(RuntimeError):
    """Raised when the necessary API key is not configured."""


class LLMProviderRegistry:
    """Lazy registry for LLM and embedding clients keyed by provider/model."""

    def __init__(self) -> None:
        self._chat_cache: Dict[str, BaseChatModel] = {}
        self._embedding_cache: Dict[str, Embeddings] = {}

    def chat(self, config: LLMConfig) -> BaseChatModel:
        key = self._make_key(
            config.provider,
            config.model,
            config.temperature,
            config.max_tokens,
            tuple(sorted((config.extra or {}).items())),
        )
        if key not in self._chat_cache:
            self._chat_cache[key] = _instantiate_chat_model(config)
        return self._chat_cache[key]

    def embeddings(self, provider: str, model: Optional[str] = None, **kwargs: Any) -> Embeddings:
        embed_key = self._make_key(provider, model or "default", kwargs.get("temperature"), kwargs.get("max_tokens"), tuple(sorted(kwargs.items())))
        if embed_key not in self._embedding_cache:
            self._embedding_cache[embed_key] = _instantiate_embedding_model(provider, model=model, **kwargs)
        return self._embedding_cache[embed_key]

    @staticmethod
    def _make_key(provider: str, model: str, temperature: Optional[float], max_tokens: Optional[int], extra: Any) -> str:
        return f"{provider}|{model}|{temperature}|{max_tokens}|{extra}"


_GLOBAL_REGISTRY = LLMProviderRegistry()


def get_chat_model(config: LLMConfig) -> BaseChatModel:
    """Convenience helper mirroring :meth:`LLMProviderRegistry.chat`."""

    return _GLOBAL_REGISTRY.chat(config)


def get_embedding_model(provider: str, model: Optional[str] = None, **kwargs: Any) -> Embeddings:
    """Convenience helper mirroring :meth:`LLMProviderRegistry.embeddings`."""

    return _GLOBAL_REGISTRY.embeddings(provider, model=model, **kwargs)


def _instantiate_chat_model(config: LLMConfig) -> BaseChatModel:
    provider = config.provider.lower()
    params = config.extra.copy() if config.extra else {}
    params.setdefault("temperature", config.temperature)

    if provider in {"openai", "gpt"}:
        if ChatOpenAI is None:
            raise MissingDependencyError("Install langchain-openai to use the OpenAI provider.")
        if not os.environ.get("OPENAI_API_KEY"):
            raise MissingAPIKeyError("OPENAI_API_KEY environment variable is required for OpenAI provider.")
        if config.max_tokens is not None:
            params.setdefault("max_tokens", config.max_tokens)
        return ChatOpenAI(model=config.model, **params)

    if provider in {"anthropic", "claude"}:
        if ChatAnthropic is None:
            raise MissingDependencyError("Install langchain-anthropic to use the Anthropic provider.")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise MissingAPIKeyError("ANTHROPIC_API_KEY environment variable is required for Anthropic provider.")
        if config.max_tokens is not None:
            params.setdefault("max_tokens", config.max_tokens)
        return ChatAnthropic(model=config.model, **params)

    if provider in {"google", "gemini", "vertex", "palm"}:
        if ChatGoogleGenerativeAI is None:
            raise MissingDependencyError("Install langchain-google-genai to use the Google provider.")
        if not os.environ.get("GOOGLE_API_KEY"):
            raise MissingAPIKeyError("GOOGLE_API_KEY environment variable is required for Google Gemini provider.")
        if config.max_tokens is not None:
            params.setdefault("max_output_tokens", config.max_tokens)
        return ChatGoogleGenerativeAI(model=config.model, **params)

    raise ValueError(f"Unsupported LLM provider '{config.provider}'.")


def _instantiate_embedding_model(provider: str, model: Optional[str] = None, **kwargs: Any) -> Embeddings:
    provider = provider.lower()
    if provider in {"openai", "gpt"}:
        if OpenAIEmbeddings is None:
            raise MissingDependencyError("Install langchain-openai to use OpenAI embeddings.")
        if not os.environ.get("OPENAI_API_KEY"):
            raise MissingAPIKeyError("OPENAI_API_KEY environment variable is required for OpenAI embeddings.")
        return OpenAIEmbeddings(model=model or "text-embedding-3-large", **kwargs)

    if provider in {"google", "gemini"}:
        if GoogleGenerativeAIEmbeddings is None:
            raise MissingDependencyError("Install langchain-google-genai to use Google embeddings.")
        if not os.environ.get("GOOGLE_API_KEY"):
            raise MissingAPIKeyError("GOOGLE_API_KEY environment variable is required for Google embeddings.")
        return GoogleGenerativeAIEmbeddings(model=model or "models/text-embedding-004", **kwargs)

    if provider in {"huggingface", "sentence-transformers", "local"}:
        if HuggingFaceEmbeddings is None:
            raise MissingDependencyError("Install sentence-transformers to use HuggingFace embeddings.")
        embed_model = model or "sentence-transformers/all-MiniLM-L6-v2"
        return HuggingFaceEmbeddings(model_name=embed_model, **kwargs)

    raise ValueError(f"Unsupported embedding provider '{provider}'.")
