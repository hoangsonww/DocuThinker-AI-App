import logging
from models.hf_model import load_models, load_translation_model
from processing.summarizer import summarize_text
from processing.topic_extractor import extract_topics
from processing.translator import translate_text
from processing.sentiment import analyze_sentiment
from qa.qa_system import answer_question
from discussion.discussion_generator import generate_discussion_points
from rag.rag_system import retrieval_augmented_generation

logger = logging.getLogger(__name__)

# Cache models to avoid reloading on each call
MODELS = None


def initialize_models():
    global MODELS
    if MODELS is None:
        logger.info("Loading models and chains...")
        MODELS = load_models()
    return MODELS


def analyze_document(document: str, question: str = None, translate_lang: str = "fr"):
    """
    Analyze the provided document and return a dictionary with the results.

    Parameters:
      document (str): The document text.
      question (str): Optional question for Q&A.
      translate_lang (str): The target language code for translation.

    Returns:
      dict: Contains keys: summary, topics, translation, sentiment, qa, discussion, rag.
    """
    results = {}
    models = initialize_models()

    # Load translation pipeline for the specified target language.
    try:
        translator = load_translation_model(translate_lang)
    except Exception as e:
        logger.error("Error loading translation model: %s", e)
        translator = None

    try:
        summary = summarize_text(document, models["summarizer_chain"])
        results["summary"] = summary
    except Exception as e:
        logger.exception("Error during summarization: %s", e)
        results["summary"] = None

    try:
        topics = extract_topics(document, models["topic_extractor"])
        results["topics"] = topics
    except Exception as e:
        logger.exception("Error during topic extraction: %s", e)
        results["topics"] = None

    try:
        if translator:
            translation = translate_text(document, translator)
            results["translation"] = translation
        else:
            results["translation"] = None
    except Exception as e:
        logger.exception("Error during translation: %s", e)
        results["translation"] = None

    try:
        sentiment = analyze_sentiment(document, models["sentiment_analyzer"])
        results["sentiment"] = sentiment
    except Exception as e:
        logger.exception("Error during sentiment analysis: %s", e)
        results["sentiment"] = None

    if question:
        try:
            answer = answer_question(document, question, models["qa_chain"])
            results["qa"] = answer
        except Exception as e:
            logger.exception("Error during Q&A: %s", e)
            results["qa"] = None
    else:
        results["qa"] = None

    try:
        discussion = generate_discussion_points(document, models["discussion_chain"])
        results["discussion"] = discussion
    except Exception as e:
        logger.exception("Error during discussion generation: %s", e)
        results["discussion"] = None

    try:
        rag_answer = retrieval_augmented_generation(document, models["rag_chain"])
        results["rag"] = rag_answer
    except Exception as e:
        logger.exception("Error during RAG generation: %s", e)
        results["rag"] = None

    return results
