import logging
from langchain.chains import ConversationChain

logger = logging.getLogger(__name__)


def chat_with_ai(user_input: str, conversation_chain: ConversationChain) -> str:
    """
    Allows a user to chat with the AI. The conversation_chain should maintain history.

    conversation_chain can be a LangChain ConversationChain or your custom chain that stores state.
    """
    try:
        response = conversation_chain.run(input=user_input)
        return response.strip()
    except Exception as e:
        logger.exception("Error in chat interface: %s", e)
        return "An error occurred."
