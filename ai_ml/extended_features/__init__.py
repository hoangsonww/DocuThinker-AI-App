"""Extended document post-processing utilities."""

from .bullet_summary_generator import generate_bullet_summary
from .chat_interface import build_conversation_chain, chat_with_ai
from .key_ideas_extractor import generate_key_ideas
from .recommendations_generator import generate_recommendations
from .refine_summary import refine_summary
from .rewriter import rewrite_document
from .voice_chat import voice_chat

__all__ = [
    "generate_bullet_summary",
    "generate_key_ideas",
    "generate_recommendations",
    "refine_summary",
    "rewrite_document",
    "chat_with_ai",
    "build_conversation_chain",
    "voice_chat",
]
