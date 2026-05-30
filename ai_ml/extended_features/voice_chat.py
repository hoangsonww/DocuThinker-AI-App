"""Voice chat stubs that hook into the shared conversation chain."""

from __future__ import annotations

import logging
from typing import Optional

from langchain.chains import ConversationChain

from .chat_interface import build_conversation_chain

logger = logging.getLogger(__name__)


def voice_to_text(audio_data: bytes) -> str:
    """Convert audio payloads to text. Replace with the desired STT engine."""

    # TODO: Integrate Whisper, Deepgram, or another managed STT provider.
    return "STUB: recognized text from audio"


def text_to_voice(text: str) -> bytes:
    """Convert text to speech bytes. Replace with production TTS of choice."""

    # TODO: Integrate ElevenLabs, Azure TTS, or Google Cloud TTS.
    return b"STUB: audio bytes"


def voice_chat(audio_data: bytes, conversation_chain: Optional[ConversationChain] = None) -> bytes:
    """Bridge speech input/output with the document-aware conversation chain."""

    chain = conversation_chain or build_conversation_chain()
    try:
        user_text = voice_to_text(audio_data)
        ai_response = chain.run(input=user_text)
        return text_to_voice(ai_response)
    except Exception as exc:  # pragma: no cover - runtime safety
        logger.exception("Voice chat failed: %s", exc)
        return b""


__all__ = ["voice_chat", "voice_to_text", "text_to_voice"]
