#!/usr/bin/env python
import argparse
import json
import logging
import sys

from ai_ml import backend


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


def main():
    setup_logging()
    logger = logging.getLogger(__name__)
    parser = argparse.ArgumentParser(description="DocuThinker agentic document analysis CLI")
    parser.add_argument("filepath", help="Path to the document file (txt) to analyze")
    parser.add_argument("--question", help="Question for Q&A", default=None)
    parser.add_argument(
        "--translate_lang",
        help="Target language code for translation (e.g., 'fr', 'de', 'es', 'it', 'zh')",
        default="fr",
    )
    parser.add_argument("--doc_id", help="Optional identifier to attach to the document", default=None)
    parser.add_argument("--title", help="Optional title stored alongside the document", default=None)
    args = parser.parse_args()

    try:
        with open(args.filepath, "r", encoding="utf-8") as f:
            document = f.read()
    except Exception as exc:
        logger.error("Error reading file: %s", exc)
        sys.exit(1)

    metadata = {}
    if args.doc_id:
        metadata["id"] = args.doc_id
    if args.title:
        metadata["title"] = args.title

    results = backend.analyze_document(
        document,
        question=args.question,
        translate_lang=args.translate_lang,
        metadata=metadata or None,
    )

    print("=== Agentic RAG Overview ===")
    print(json.dumps(results.get("rag", {}), ensure_ascii=True, indent=2))

    print("\n=== Summary ===")
    print(results.get("summary"))

    print("\n=== Bullet Summary ===")
    print(backend.generate_bullet_summary(document))

    print("\n=== Topics ===")
    print(results.get("topics"))

    print("\n=== Insights ===")
    print(results.get("insights"))

    if args.question:
        print("\n=== Q&A ===")
        print(results.get("qa"))

    print("\n=== Sentiment ===")
    print(json.dumps(results.get("sentiment"), ensure_ascii=True, indent=2))

    print("\n=== Discussion ===")
    print(results.get("discussion"))

    print("\n=== Recommendations ===")
    print(backend.recommendations(document))

    print("\n=== Translation ({}) ===".format(args.translate_lang))
    print(results.get("translation"))

    if results.get("sync"):
        print("\n=== Sync Report ===")
        print(json.dumps(results["sync"], ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
