import logging
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

KEY_IDEAS_PROMPT = """
Extract the main ideas (key takeaways) from the following document. Present them as a concise list:
Document:
{text}

Key Ideas:
"""


def generate_key_ideas(document: str, chain: LLMChain) -> str:
    """
    Generates the key ideas from the document using the provided LLMChain.
    """
    try:
        template = PromptTemplate(input_variables=["text"], template=KEY_IDEAS_PROMPT)
        local_chain = LLMChain(llm=chain.llm, prompt=template)
        result = local_chain.run(text=document)
        return result.strip()
    except Exception as e:
        logger.exception("Error generating key ideas: %s", e)
        return ""
