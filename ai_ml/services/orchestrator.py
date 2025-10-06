"""High-level orchestration for DocuThinker's AI features."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4

from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ai_ml.core import Settings, load_settings
from ai_ml.core.settings import ProviderSpec
from ai_ml.graph import Neo4jConfig, Neo4jGraphClient, Neo4jNotConfigured
from ai_ml.pipelines import AgenticRAGPipeline
from ai_ml.providers.registry import LLMConfig, LLMProviderRegistry, MissingAPIKeyError, MissingDependencyError
from ai_ml.tools import ChunkConfig, DocumentSearchTool, InsightsExtractionTool, build_vector_store, chunk_document
from ai_ml.vectorstores import ChromaConfig, ChromaNotConfigured, ChromaVectorClient
from models.hf_model import load_translation_model

logger = logging.getLogger(__name__)


class DocumentIntelligenceService:
    """Primary façade encapsulating DocuThinker's agentic and utility workflows."""

    def __init__(
        self,
        *,
        settings: Optional[Settings] = None,
        registry: Optional[LLMProviderRegistry] = None,
        pipeline: Optional[AgenticRAGPipeline] = None,
    ) -> None:
        self.settings = settings or load_settings()
        self.registry = registry or LLMProviderRegistry()
        chunk_cfg = ChunkConfig(chunk_size=self.settings.chunk_size, chunk_overlap=self.settings.chunk_overlap)
        self.pipeline = pipeline or AgenticRAGPipeline(
            registry=self.registry,
            default_question=self.settings.rag_question,
            chunk_config=chunk_cfg,
            embedding_provider=self.settings.embedding_provider,
            embedding_model=self.settings.embedding_model,
        )
        self._translator_cache: Dict[str, Any] = {}
        self._graph_client: Optional[Neo4jGraphClient] = None
        self._vector_client: Optional[ChromaVectorClient] = None
        self._embedding_model: Any = None

    # ------------------------------------------------------------------
    # Public orchestration APIs

    def analyze_document(
        self,
        document: str,
        *,
        question: Optional[str] = None,
        translate_lang: Optional[str] = "fr",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Run the full agentic pipeline and enrich with auxiliary signals."""

        logger.info("Running agentic analysis (question=%s, translate_lang=%s)", question, translate_lang)
        meta = dict(metadata or {})
        try:
            agentic_payload = self.pipeline.run(document, question=question, translate_lang=translate_lang)
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.error("Pipeline configuration error: %s", exc)
            agentic_payload = {"error": str(exc)}
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Agentic pipeline failed: %s", exc)
            agentic_payload = {"error": str(exc)}

        document_id = meta.get("id") or str(uuid4())
        meta.setdefault("id", document_id)

        results: Dict[str, Any] = {
            "rag": agentic_payload,
            "summary": agentic_payload.get("overview"),
            "topics": agentic_payload.get("key_topics"),
            "qa": agentic_payload.get("qa_answer") if question else None,
            "discussion": self._derive_discussion(agentic_payload, document=document),
            "insights": self._topics_as_bullets(agentic_payload),
            "document_id": document_id,
            "metadata": meta,
        }

        results["sentiment"] = self.sentiment(document)

        if translate_lang:
            results["translation"] = self.translate(document, translate_lang)
        else:
            results["translation"] = None

        sync_report: Dict[str, Any] = {}
        if self.settings.auto_sync_graph:
            sync_report["graph"] = self.sync_to_knowledge_graph(
                document=document,
                agentic_payload=agentic_payload,
                metadata=meta,
            )
        if self.settings.auto_sync_vector_store:
            sync_report["vector_store"] = self.upsert_vector_document(
                document=document,
                metadata=meta,
                doc_id=document_id,
            )
        if sync_report:
            results["sync"] = sync_report

        return results

    def summarize(self, document: str, *, style: Optional[str] = None) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Summarize the document below. {style}\n\n" "Document:\n{document}\n\nSummary:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["analyst"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Summarization fallback triggered: %s", exc)
            return f"Summarization unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({"document": document, "style": style or "Provide a balanced overview."}).strip()

    def bullet_summary(self, document: str) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Summarize the document into crisp bullet points. {style}\n\n" "Document:\n{document}\n\nBullet Summary:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["analyst"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Bullet summary fallback triggered: %s", exc)
            return f"Bullet summary unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        output = chain.invoke({"document": document, "style": self.settings.bullet_summary_style}).strip()
        return output

    def extract_topics(self, document: str) -> List[str]:
        prompt = ChatPromptTemplate.from_template(
            "List the top research-backed themes covered in the text as short phrases.\n\n"
            "Document:\n{document}\n\nThemes:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["researcher"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Topic extraction fallback triggered: %s", exc)
            return [f"Topic extraction unavailable: {exc}"]
        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"document": document})
        return _split_lines(response)

    def discussion_points(self, document: str) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Draft discussion prompts stimulating debate about the document. \n"
            "Return numbered items.\n\nDocument:\n{document}\n\nDiscussion Prompts:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["reviewer"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Discussion fallback triggered: %s", exc)
            return f"Discussion unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({"document": document}).strip()

    def recommendations(self, document: str) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Provide actionable recommendations or next steps based on the document."
            "\n\nDocument:\n{document}\n\nRecommendations:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["reviewer"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Recommendations fallback triggered: %s", exc)
            return f"Recommendations unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({"document": document}).strip()

    def refine_summary(self, draft_summary: str, document: str) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Refine the draft summary to ensure fidelity with the source material,"
            " keeping the tone professional.\n\n"
            "Document:\n{document}\n\nDraft Summary:\n{summary}\n\nRefined Summary:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["reviewer"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Summary refinement fallback triggered: %s", exc)
            return f"Summary refinement unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({"document": document, "summary": draft_summary}).strip()

    def rewrite(self, document: str, *, tone: str = "professional") -> str:
        prompt = ChatPromptTemplate.from_template(
            "Rewrite the document in the requested tone without losing critical details."
            "\n\nTone: {tone}\nDocument:\n{document}\n\nRewritten Text:"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["analyst"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Rewrite fallback triggered: %s", exc)
            return f"Rewrite unavailable: {exc}"
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({"document": document, "tone": tone}).strip()

    def answer_question(self, document: str, question: str) -> str:
        payload = self.pipeline.run(document, question=question)
        return payload.get("qa_answer", "") or ""

    def sentiment(self, document: str) -> Dict[str, Any]:
        prompt = ChatPromptTemplate.from_template(
            "You are a sentiment analyst. Respond with compact JSON keys label, confidence, rationale.\n\n"
            "Document:\n{document}\n"
        )
        try:
            llm = self._resolve_llm(self.settings.agent_models["sentiment"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            logger.warning("Sentiment fallback triggered: %s", exc)
            return {"label": "Unknown", "confidence": 0.0, "rationale": str(exc)}
        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"document": document})
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"label": "Unknown", "confidence": 0.0, "rationale": response}

    def translate(self, document: str, target_lang: str) -> Optional[str]:
        try:
            translator = self._translator_cache.get(target_lang)
            if translator is None:
                translator = load_translation_model(target_lang)
                self._translator_cache[target_lang] = translator
            output = translator(document)
            if isinstance(output, list):
                return " ".join(item.get("translation_text", "") for item in output)
            return output
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Translation failed: %s", exc)
            return None

    def semantic_search(self, document: str, query: str) -> List[Dict[str, Any]]:
        if self.settings.auto_sync_vector_store:
            try:
                vector_hits = self.query_vector_index(query, n_results=self.settings.vector_top_k)
                if vector_hits:
                    return [
                        {
                            "source": hit.get("metadata", {}).get("source", "vector_store"),
                            "snippet": hit.get("document"),
                            "score": hit.get("distance"),
                            "id": hit.get("id"),
                        }
                        for hit in vector_hits
                    ]
            except ChromaNotConfigured:
                pass
            except Exception as exc:  # pragma: no cover - runtime safety
                logger.exception("Vector store semantic search failed: %s", exc)

        retriever = build_vector_store(
            document,
            embedding_provider=self.settings.embedding_provider,
            embedding_model=self.settings.embedding_model,
        )
        tool = DocumentSearchTool(retriever)
        return json.loads(tool(query))

    def create_conversation_chain(self) -> ConversationChain:
        try:
            llm = self._resolve_llm(self.settings.agent_models["analyst"])
        except (MissingDependencyError, MissingAPIKeyError) as exc:
            raise RuntimeError("Conversation chain requires an analyst provider") from exc
        memory = ConversationBufferMemory(memory_key="history", return_messages=True)
        return ConversationChain(llm=llm, memory=memory, verbose=False)

    # ------------------------------------------------------------------
    # Knowledge graph helpers

    def sync_to_knowledge_graph(
        self,
        *,
        document: str,
        agentic_payload: Dict[str, Any],
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        try:
            client = self._get_graph_client()
        except Neo4jNotConfigured as exc:
            return {"status": "disabled", "reason": str(exc)}
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Failed to obtain Neo4j client: %s", exc)
            return {"status": "error", "error": str(exc)}

        document_id = metadata.get("id") or str(uuid4())
        metadata.setdefault("raw_length", len(document))

        try:
            client.upsert_document(
                document_id=document_id,
                title=metadata.get("title"),
                summary=agentic_payload.get("overview"),
                topics=agentic_payload.get("key_topics") or [],
                metadata=metadata,
            )
            return {"status": "ok", "document_id": document_id}
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Neo4j upsert failed: %s", exc)
            return {"status": "error", "error": str(exc)}

    def run_graph_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        client = self._get_graph_client()
        return client.run_query(query, params)

    # ------------------------------------------------------------------
    # Vector store helpers

    def upsert_vector_document(
        self,
        *,
        document: str,
        metadata: Optional[Dict[str, Any]] = None,
        doc_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        meta = dict(metadata or {})
        document_id = doc_id or meta.get("id") or str(uuid4())
        meta.setdefault("id", document_id)

        try:
            client = self._get_vector_client()
        except ChromaNotConfigured as exc:
            return {"status": "disabled", "reason": str(exc)}
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Failed to obtain Chroma client: %s", exc)
            return {"status": "error", "error": str(exc)}

        try:
            embeddings_model = self._resolve_embedding_model()
            try:
                vector = embeddings_model.embed_documents([document])[0]
            except AttributeError:
                vector = embeddings_model.embed_query(document)  # type: ignore[attr-defined]
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Embedding generation failed: %s", exc)
            return {"status": "error", "error": str(exc)}

        try:
            client.upsert(ids=[document_id], documents=[document], metadatas=[meta], embeddings=[vector])
            return {"status": "ok", "document_id": document_id}
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Vector upsert failed: %s", exc)
            return {"status": "error", "error": str(exc)}

    def query_vector_index(self, query: str, n_results: Optional[int] = None) -> List[Dict[str, Any]]:
        client = self._get_vector_client()
        top_k = n_results or self.settings.vector_top_k
        embeddings_model = self._resolve_embedding_model()
        try:
            try:
                embedding = embeddings_model.embed_query(query)
            except AttributeError:
                embedding = embeddings_model.embed_documents([query])[0]
        except Exception as exc:  # pragma: no cover - runtime safety
            logger.exception("Embedding generation for query failed: %s", exc)
            raise
        return client.similarity_search(query=query, n_results=top_k, embedding=embedding)

    # ------------------------------------------------------------------
    # Internal helpers

    def _resolve_llm(self, spec: ProviderSpec):
        cfg = LLMConfig(
            provider=spec.provider,
            model=spec.model,
            temperature=spec.temperature,
            max_tokens=spec.max_tokens,
            extra=spec.extra,
        )
        return self.registry.chat(cfg)

    def _resolve_embedding_model(self):
        if self._embedding_model is None:
            self._embedding_model = self.registry.embeddings(
                self.settings.embedding_provider,
                model=self.settings.embedding_model,
            )
        return self._embedding_model

    def _get_graph_client(self) -> Neo4jGraphClient:
        if self._graph_client is not None:
            return self._graph_client
        if not self.settings.neo4j_uri or not self.settings.neo4j_user or not self.settings.neo4j_password:
            raise Neo4jNotConfigured("Neo4j credentials are not configured.")
        config = Neo4jConfig(
            uri=self.settings.neo4j_uri,
            user=self.settings.neo4j_user,
            password=self.settings.neo4j_password,
            database=self.settings.neo4j_database,
        )
        self._graph_client = Neo4jGraphClient(config)
        return self._graph_client

    def _get_vector_client(self) -> ChromaVectorClient:
        if self._vector_client is not None:
            return self._vector_client
        if not self.settings.chroma_persist_directory:
            raise ChromaNotConfigured("Chroma persist directory is not configured.")
        config = ChromaConfig(
            persist_directory=self.settings.chroma_persist_directory,
            collection_name=self.settings.chroma_collection_name,
        )
        self._vector_client = ChromaVectorClient(config)
        return self._vector_client

    def _derive_discussion(self, payload: Dict[str, Any], *, document: str) -> str:
        crew_payload = payload.get("crew_analysis", {})
        if isinstance(crew_payload, str):
            return crew_payload
        if crew_payload.get("error"):
            logger.warning("Crew analysis returned error: %s", crew_payload["error"])
            return self.discussion_points(document)
        if "raw" in crew_payload:
            return str(crew_payload["raw"])
        if crew_payload:
            try:
                return json.dumps(crew_payload, ensure_ascii=True, indent=2)
            except TypeError:
                return str(crew_payload)
        return self.discussion_points(document)

    def _topics_as_bullets(self, payload: Dict[str, Any]) -> str:
        topics = payload.get("key_topics") or []
        if not topics:
            return ""
        return "\n".join(f"• {topic}" for topic in topics)


_service_instance: DocumentIntelligenceService | None = None


def get_document_service() -> DocumentIntelligenceService:
    """Return a singleton service instance."""

    global _service_instance
    if _service_instance is None:
        _service_instance = DocumentIntelligenceService()
    return _service_instance


def _split_lines(payload: str) -> List[str]:
    lines = [line.strip("- •\t") for line in payload.splitlines() if line.strip()]
    return [line for line in lines if line]
