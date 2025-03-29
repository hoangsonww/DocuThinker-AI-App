import os
import subprocess
import sys


def run_conversion(model_name, feature, output_dir):
    """
    Runs the ONNX export command for a given model, feature, and output directory.
    """
    command = [
        sys.executable, "-m", "transformers.onnx",
        "--model", model_name,
        "--feature", feature,
        output_dir
    ]
    print("Running command:", " ".join(command))
    subprocess.run(command, check=True)


def main():
    # Create base directories for ONNX models
    base_dirs = [
        "onnx_models/summarizer",
        "onnx_models/qa",
        "onnx_models/discussion",
        "onnx_models/rag",
        "onnx_models/sentiment",
    ]

    # Translation model mappings (language code to model name)
    translations = {
        "fr": "Helsinki-NLP/opus-mt-en-fr",
        "de": "Helsinki-NLP/opus-mt-en-de",
        "es": "Helsinki-NLP/opus-mt-en-es",
        "it": "Helsinki-NLP/opus-mt-en-it",
        "zh": "Helsinki-NLP/opus-mt-en-zh",
    }

    for dir_path in base_dirs:
        os.makedirs(dir_path, exist_ok=True)

    # Create directories for translation models
    for lang in translations.keys():
        os.makedirs(f"onnx_models/translation/{lang}", exist_ok=True)

    try:
        # Convert Summarizer model
        run_conversion("facebook/bart-large-cnn", "summarization", "onnx_models/summarizer")

        # Convert QA model
        run_conversion("distilbert-base-cased-distilled-squad", "question-answering", "onnx_models/qa")

        # Convert Discussion Generator model (using GPT-2 for text generation)
        run_conversion("gpt2", "text-generation", "onnx_models/discussion")

        # Convert RAG model (for text2text-generation)
        run_conversion("facebook/rag-token-nq", "text2text-generation", "onnx_models/rag")

        # Convert Sentiment Analysis model
        run_conversion("distilbert-base-uncased-finetuned-sst-2-english", "sequence-classification",
                       "onnx_models/sentiment")

        # Convert Translation models for each target language
        for lang, model in translations.items():
            run_conversion(model, "translation", f"onnx_models/translation/{lang}")

        print("All models have been successfully converted to ONNX format!")
    except subprocess.CalledProcessError as e:
        print("An error occurred during ONNX conversion:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
