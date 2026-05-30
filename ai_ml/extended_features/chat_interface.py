"""Conversational helpers built on the shared document service."""

from __future__ import annotations

from langchain.chains import ConversationChain

from ai_ml.services import get_document_service


def build_conversation_chain() -> ConversationChain:
    service = get_document_service()
    return service.create_conversation_chain()


def chat_with_ai(user_input: str, conversation_chain: ConversationChain | None = None) -> str:
    chain = conversation_chain or build_conversation_chain()
    try:
        response = chain.run(input=user_input)
        return response.strip()
    except Exception as exc:  # pragma: no cover - runtime safety
        return f"Unable to respond: {exc}"


__all__ = ["chat_with_ai", "build_conversation_chain"]
