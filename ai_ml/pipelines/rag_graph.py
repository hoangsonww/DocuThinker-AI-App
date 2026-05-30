"""Agentic Retrieval-Augmented Generation pipeline built on LangGraph."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, TypedDict

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.vectorstores import VectorStoreRetriever
from langgraph.graph import END, StateGraph

from ai_ml.agents import build_document_crew
from ai_ml.providers.registry import LLMConfig, LLMProviderRegistry
from ai_ml.tools import ChunkConfig, DocumentSearchTool, InsightsExtractionTool, build_vector_store, chunk_document


class PipelineState(TypedDict, total=False):
    document: str
    question: Optional[str]
    translate_lang: Optional[str]
    retriever: VectorStoreRetriever
    document_chunks: List[Any]
    rag_payload: Dict[str, Any]
    retrieved_docs: List[Any]
    crew_payload: Dict[str, Any]
    final_output: Dict[str, Any]


class AgenticRAGPipeline:
    """Compose LangGraph, LangChain, and CrewAI into a cohesive pipeline."""

    def __init__(
        self,
        *,
        registry: Optional[LLMProviderRegistry] = None,
        default_question: str = "Provide a comprehensive intelligence brief for this document.",
        chunk_config: Optional[ChunkConfig] = None,
        embedding_provider: str = "huggingface",
        embedding_model: Optional[str] = None,
    ) -> None:
        self.registry = registry or LLMProviderRegistry()
        self.default_question = default_question
        self.chunk_config = chunk_config
        self.embedding_provider = embedding_provider
        self.embedding_model = embedding_model
        self.graph = self._build_graph()
        self._primary_llm_config = LLMConfig(provider="openai", model="gpt-4o-mini", temperature=0.15, max_tokens=900)

    def _build_graph(self) -> StateGraph:
        graph = StateGraph(PipelineState)
        graph.add_node("ingest", self._ingest_documents)
        graph.add_node("rag", self._initial_rag_pass)
        graph.add_node("crew", self._crew_collaboration)
        graph.add_node("finalize", self._finalize_report)

        graph.set_entry_point("ingest")
        graph.add_edge("ingest", "rag")
        graph.add_edge("rag", "crew")
        graph.add_edge("crew", "finalize")
        graph.add_edge("finalize", END)
        return graph.compile()

    def run(self, document: str, *, question: Optional[str] = None, translate_lang: Optional[str] = None) -> Dict[str, Any]:
        state: PipelineState = {
            "document": document,
            "question": question,
            "translate_lang": translate_lang,
        }
        final_state = self.graph.invoke(state)
        return final_state.get("final_output", {})

    # --- Graph Nodes -----------------------------------------------------------------

    def _ingest_documents(self, state: PipelineState) -> PipelineState:
        document = state["document"]
        chunks = chunk_document(document, config=self.chunk_config)
        retriever = build_vector_store(
            document,
            embedding_provider=self.embedding_provider,
            embedding_model=self.embedding_model,
            config=self.chunk_config,
        )
        return {
            **state,
            "document_chunks": chunks,
            "retriever": retriever,
        }

    def _initial_rag_pass(self, state: PipelineState) -> PipelineState:
        retriever = state["retriever"]
        question = state.get("question") or self.default_question
        context_docs = retriever.get_relevant_documents(question)
        context = "\n\n".join(doc.page_content for doc in context_docs)

        rag_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert analyst. Always respond with minified JSON using keys: "
                    "general_overview, main_topics, supporting_context, question_answer."
                    " main_topics must be an array of short strings. supporting_context is an array of quotes.",
                ),
                (
                    "human",
                    "Document excerpts:\n{context}\n\nUser question: {question}\n"
                    "Return strictly valid JSON, without markdown fences.",
                ),
            ]
        )

        llm = self.registry.chat(self._primary_llm_config)
        chain = rag_prompt | llm | StrOutputParser()

        try:
            response = chain.invoke({"context": context, "question": question})
            payload = _safe_json_loads(response)
        except Exception as exc:  # pragma: no cover - runtime safety
            payload = {
                "general_overview": "RAG analysis failed.",
                "main_topics": [],
                "supporting_context": [],
                "question_answer": f"Unable to generate answer: {exc}",
            }

        return {
            **state,
            "rag_payload": payload,
            "retrieved_docs": context_docs,
        }

    def _crew_collaboration(self, state: PipelineState) -> PipelineState:
        retriever = state["retriever"]
        chunks = state["document_chunks"]
        rag_payload = state.get("rag_payload", {})
        question = state.get("question") or self.default_question

        document_tool = DocumentSearchTool(retriever)
        insights_tool = InsightsExtractionTool(chunks)
        crew = build_document_crew(
            self.registry,
            retriever_tool=document_tool,
            insights_tool=insights_tool,
            additional_context={
                "openai_model": "gpt-4o-mini",
                "gemini_model": "gemini-1.5-pro",
                "claude_model": "claude-3-5-sonnet-20241022",
            },
        )

        crew_inputs = {
            "question": question,
            "rag_overview": rag_payload.get("general_overview"),
            "rag_topics": rag_payload.get("main_topics"),
        }
        try:
            crew_result = crew.kickoff(inputs=crew_inputs)
            if hasattr(crew_result, "json"):
                crew_payload = crew_result.json if isinstance(crew_result.json, dict) else {"raw": crew_result.json}
            elif hasattr(crew_result, "raw"):
                crew_payload = {"raw": crew_result.raw}
            else:
                crew_payload = {"raw": str(crew_result)}
        except Exception as exc:  # pragma: no cover - runtime safety
            crew_payload = {"error": f"Crew collaboration failed: {exc}"}

        return {
            **state,
            "crew_payload": crew_payload,
        }

    def _finalize_report(self, state: PipelineState) -> PipelineState:
        rag_payload = state.get("rag_payload", {})
        crew_payload = state.get("crew_payload", {})
        retrieved_docs = state.get("retrieved_docs", [])

        citations = [
            {
                "page": doc.metadata.get("page"),
                "source": doc.metadata.get("source", "document"),
                "snippet": doc.page_content.strip(),
            }
            for doc in retrieved_docs
        ]

        final_output = {
            "overview": rag_payload.get("general_overview"),
            "key_topics": rag_payload.get("main_topics", []),
            "qa_answer": rag_payload.get("question_answer"),
            "supporting_context": rag_payload.get("supporting_context", []),
            "crew_analysis": crew_payload,
            "citations": citations,
        }

        return {
            **state,
            "final_output": final_output,
        }


def _safe_json_loads(payload: str) -> Dict[str, Any]:
    """Parse JSON output while surfacing useful errors for downstream consumers."""

    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        # Attempt to fix common JSON issues such as trailing text or single quotes.
        normalised = payload.strip()
        normalised = normalised.replace("'", '"')
        try:
            return json.loads(normalised)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Unable to parse model response as JSON: {payload}") from exc
