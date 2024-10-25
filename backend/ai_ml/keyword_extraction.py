import spacy

# Load the spaCy language model
nlp = spacy.load("en_core_web_sm")


def extract_keywords(text, top_n=10):
    """
    Extracts keywords from the given text using spaCy's NLP features.

    Args:
        text (str): The text to extract keywords from.
        top_n (int): The number of top keywords to extract.

    Returns:
        list: A list of top keywords.
    """
    doc = nlp(text)
    keywords = [chunk.text for chunk in doc.noun_chunks][:top_n]
    return keywords


if __name__ == "__main__":
    # Example text for keyword extraction
    text = "Natural language processing (NLP) is a subfield of artificial intelligence that focuses on the interaction between computers and humans using natural language. It is used to apply machine learning algorithms to text and speech."

    # Extract keywords
    keywords = extract_keywords(text)
    print("Keywords:", keywords)
