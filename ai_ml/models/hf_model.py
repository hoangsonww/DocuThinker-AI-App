import logging
from transformers import pipeline
from langchain.llms import HuggingFacePipeline
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

from ai_ml.config import MODEL_NAMES, TRANSLATION_MODELS, PROMPT_TEMPLATES

logger = logging.getLogger(__name__)


def load_models():
    models = {}

    # Create a summarization chain using LangChain
    try:
        logger.info("Loading summarizer pipeline...")
        summarizer_pipeline = pipeline("summarization", model=MODEL_NAMES["summarizer"])
        summarizer_llm = HuggingFacePipeline(pipeline=summarizer_pipeline)
        summarization_template = PromptTemplate(
            input_variables=["text"],
            template=PROMPT_TEMPLATES["summarization"]
        )
        models["summarizer_chain"] = LLMChain(llm=summarizer_llm, prompt=summarization_template)
    except Exception as e:
        logger.exception("Error loading summarization chain: %s", e)
        raise e

    # Create a QA chain using LangChain
    try:
        logger.info("Loading QA pipeline...")
        qa_pipeline = pipeline("question-answering", model=MODEL_NAMES["qa"])
        qa_llm = HuggingFacePipeline(pipeline=qa_pipeline)
        qa_template = PromptTemplate(
            input_variables=["context", "question"],
            template=PROMPT_TEMPLATES["qa"]
        )
        models["qa_chain"] = LLMChain(llm=qa_llm, prompt=qa_template)
    except Exception as e:
        logger.exception("Error loading QA chain: %s", e)
        raise e

    # Create a discussion generation chain using LangChain
    try:
        logger.info("Loading discussion generator pipeline...")
        discussion_pipeline = pipeline("text-generation", model=MODEL_NAMES["discussion"])
        discussion_llm = HuggingFacePipeline(pipeline=discussion_pipeline)
        discussion_template = PromptTemplate(
            input_variables=["text"],
            template=PROMPT_TEMPLATES["discussion"]
        )
        models["discussion_chain"] = LLMChain(llm=discussion_llm, prompt=discussion_template)
    except Exception as e:
        logger.exception("Error loading discussion chain: %s", e)
        raise e

    # Create a RAG chain using LangChain (via text2text-generation)
    try:
        logger.info("Loading RAG pipeline...")
        rag_pipeline = pipeline("text2text-generation", model=MODEL_NAMES["rag"])
        rag_llm = HuggingFacePipeline(pipeline=rag_pipeline)
        rag_template = PromptTemplate(
            input_variables=["text"],
            template=PROMPT_TEMPLATES["rag"]
        )
        models["rag_chain"] = LLMChain(llm=rag_llm, prompt=rag_template)
    except Exception as e:
        logger.exception("Error loading RAG chain: %s", e)
        raise e

    # Load topic extraction (zero-shot classification) pipeline directly
    try:
        logger.info("Loading topic extraction pipeline...")
        models["topic_extractor"] = pipeline("zero-shot-classification", model=MODEL_NAMES["topic_extractor"])
    except Exception as e:
        logger.exception("Error loading topic extractor: %s", e)
        raise e

    # Load sentiment analysis pipeline directly
    try:
        logger.info("Loading sentiment analyzer pipeline...")
        models["sentiment_analyzer"] = pipeline("sentiment-analysis",
                                                model="distilbert-base-uncased-finetuned-sst-2-english")
    except Exception as e:
        logger.exception("Error loading sentiment analyzer: %s", e)
        raise e

    return models


def load_translation_model(target_lang):
    """
    Dynamically load a translation pipeline for the specified target language.
    The task name is constructed as 'translation_en_to_{target_lang}'.
    """
    if target_lang not in TRANSLATION_MODELS:
        raise ValueError(f"Translation model for language '{target_lang}' is not configured.")
    model_name = TRANSLATION_MODELS[target_lang]
    logger.info("Loading translator model for language '%s' (%s)...", target_lang, model_name)
    task_name = f"translation_en_to_{target_lang}"
    translator = pipeline(task_name, model=model_name)
    return translator
