#!/usr/bin/env python
import argparse
import logging
import sys

from models.hf_model import load_models, load_translation_model
from processing.summarizer import summarize_text
from processing.topic_extractor import extract_topics
from processing.translator import translate_text
from processing.sentiment import analyze_sentiment
from qa.qa_system import answer_question
from discussion.discussion_generator import generate_discussion_points
from rag.rag_system import retrieval_augmented_generation


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )


def main():
    setup_logging()
    logger = logging.getLogger(__name__)
    parser = argparse.ArgumentParser(
        description="Document Analysis App with LangChain Integration"
    )
    parser.add_argument("filepath", help="Path to the document file (txt) to analyze")
    parser.add_argument("--question", help="Question for Q&A", default=None)
    parser.add_argument(
        "--translate_lang",
        help="Target language code for translation (e.g., 'fr', 'de', 'es', 'it', 'zh')",
        default="fr"
    )
    args = parser.parse_args()

    try:
        with open(args.filepath, "r", encoding="utf-8") as f:
            document = f.read()
    except Exception as e:
        logger.error("Error reading file: %s", e)
        sys.exit(1)

    # Load LangChain chains and pipelines
    logger.info("Loading main models and chains...")
    models = load_models()

    # Dynamically load the translation pipeline for the specified target language
    try:
        translator = load_translation_model(args.translate_lang)
    except Exception as e:
        logger.error("Error loading translation model: %s", e)
        sys.exit(1)

    # Summarize the document (with chunking for long texts)
    try:
        summary = summarize_text(document, models["summarizer_chain"])
        print("=== Summary ===")
        print(summary)
    except Exception as e:
        logger.exception("Error during summarization: %s", e)

    # Extract key topics using the zero-shot classification pipeline
    try:
        topics = extract_topics(document, models["topic_extractor"])
        print("\n=== Key Topics ===")
        print(topics)
    except Exception as e:
        logger.exception("Error during topic extraction: %s", e)

    # Translate the document
    try:
        translation = translate_text(document, translator)
        print("\n=== Translated Document (to {}) ===".format(args.translate_lang))
        print(translation)
    except Exception as e:
        logger.exception("Error during translation: %s", e)

    # Sentiment analysis
    try:
        sentiment = analyze_sentiment(document, models["sentiment_analyzer"])
        print("\n=== Sentiment Analysis ===")
        print(sentiment)
    except Exception as e:
        logger.exception("Error during sentiment analysis: %s", e)

    # Q&A (if a question is provided)
    if args.question:
        try:
            answer = answer_question(document, args.question, models["qa_chain"])
            print("\n=== Q&A Answer ===")
            print(answer)
        except Exception as e:
            logger.exception("Error during Q&A: %s", e)

    # Generate discussion points
    try:
        discussion = generate_discussion_points(document, models["discussion_chain"])
        print("\n=== Discussion Points ===")
        print(discussion)
    except Exception as e:
        logger.exception("Error during discussion generation: %s", e)

    # Demonstrate RAG
    try:
        rag_answer = retrieval_augmented_generation(document, models["rag_chain"])
        print("\n=== RAG Generated Answer ===")
        print(rag_answer)
    except Exception as e:
        logger.exception("Error during RAG generation: %s", e)


if __name__ == "__main__":
    main()
