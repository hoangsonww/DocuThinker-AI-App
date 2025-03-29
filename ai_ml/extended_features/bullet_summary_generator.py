import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

BULLET_SUMMARY_PROMPT = """
Please summarize the following document in bullet points:
Document:
{text}

Bullet-Point Summary:
"""


def generate_bullet_summary(document: str, chain: LLMChain) -> str:
    """
    Generates a bullet-point summary of the document using the provided LLMChain.
    """
    try:
        template = PromptTemplate(input_variables=["text"], template=BULLET_SUMMARY_PROMPT)
        local_chain = LLMChain(llm=chain.llm, prompt=template)
        result = local_chain.run(text=document)
        return result.strip()
    except Exception as e:
        logger.exception("Error generating bullet summary: %s", e)
        return ""
