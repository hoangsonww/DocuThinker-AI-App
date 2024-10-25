from transformers import pipeline

# Load a pre-trained text summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text, max_length=200):
    """
    Summarizes the provided text into a paragraph format.

    Args:
        text (str): The text to summarize.
        max_length (int): Maximum length of the summary.

    Returns:
        str: A paragraph-based summary of the text.
    """
    summary = summarizer(text, max_length=max_length, min_length=80, do_sample=False)[0]['summary_text']
    return summary

# Example usage
document_text = "Long article or document text goes here..."
paragraph_summary = summarize_text(document_text)
print("Generated Paragraph Summary:", paragraph_summary)
