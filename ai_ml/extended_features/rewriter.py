import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

REWRITE_PROMPT = """
Rewrite the following text in a clear, coherent, and concise manner, preserving its meaning:
{text}

Rewritten:
"""


def rewrite_content(document: str, rewrite_chain: LLMChain) -> str:
    """
    Rewrites the content using the provided LLMChain (e.g., a text2text-generation pipeline).
    """
    try:
        template = PromptTemplate(input_variables=["text"], template=REWRITE_PROMPT)
        local_chain = LLMChain(llm=rewrite_chain.llm, prompt=template)
        result = local_chain.run(text=document)
        return result.strip()
    except Exception as e:
        logger.exception("Error rewriting content: %s", e)
        return ""
