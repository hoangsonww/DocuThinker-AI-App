# Model names for Hugging Face pipelines
MODEL_NAMES = {
    "summarizer": "facebook/bart-large-cnn",
    "qa": "distilbert-base-cased-distilled-squad",
    "discussion": "gpt2",
    "rag": "facebook/rag-token-nq",
    "topic_extractor": "facebook/bart-large-mnli",
    # DistilBERT sentiment model is loaded in hf_model.py
}

# Translation model mapping
TRANSLATION_MODELS = {
    "fr": "Helsinki-NLP/opus-mt-en-fr",
    "de": "Helsinki-NLP/opus-mt-en-de",
    "es": "Helsinki-NLP/opus-mt-en-es",
    "it": "Helsinki-NLP/opus-mt-en-it",
    "zh": "Helsinki-NLP/opus-mt-en-zh"
}

# Prompt templates for LangChain
PROMPT_TEMPLATES = {
    "summarization": "Summarize the following document in a concise manner:\n\n{text}\n\nSummary:",
    "qa": "Based on the context below, answer the question:\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:",
    "discussion": "Generate discussion points for the following document:\n\n{text}\n\nDiscussion Points:",
    "rag": "Analyze the following document and provide an in-depth analysis:\n\n{text}\n\nAnalysis:"
}
