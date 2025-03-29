import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

RECOMMENDATIONS_PROMPT = """
Read the document below and provide actionable recommendations or next steps:
Document:
{text}

Recommendations:
"""


def generate_recommendations(document: str, recommendation_chain: LLMChain) -> str:
    """
    Generates recommendations or next steps based on the provided document.
    """
    try:
        template = PromptTemplate(input_variables=["text"], template=RECOMMENDATIONS_PROMPT)
        local_chain = LLMChain(llm=recommendation_chain.llm, prompt=template)
        result = local_chain.run(text=document)
        return result.strip()
    except Exception as e:
        logger.exception("Error generating recommendations: %s", e)
        return ""
