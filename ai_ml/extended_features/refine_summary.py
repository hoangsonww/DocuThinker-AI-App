import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

REFINE_SUMMARY_PROMPT = """
We have an original document and an existing summary. Please refine the summary to ensure it is accurate, clear, and concise:
Document:
{document}

Existing Summary:
{summary}

Refined Summary:
"""


def refine_summary(document: str, existing_summary: str, refine_chain: LLMChain) -> str:
    """
    Refines the existing summary by referencing the original document.
    """
    try:
        template = PromptTemplate(
            input_variables=["document", "summary"],
            template=REFINE_SUMMARY_PROMPT
        )
        local_chain = LLMChain(llm=refine_chain.llm, prompt=template)
        result = local_chain.run(document=document, summary=existing_summary)
        return result.strip()
    except Exception as e:
        logger.exception("Error refining summary: %s", e)
        return existing_summary
