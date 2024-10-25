import nltk
from nltk.tokenize import word_tokenize, sent_tokenize

# Download necessary NLTK data
nltk.download('punkt')


def tokenize_text(text):
    """
    Tokenizes the given text into words and sentences.

    Args:
        text (str): The text to tokenize.

    Returns:
        dict: A dictionary containing word tokens and sentence tokens.
    """
    words = word_tokenize(text)
    sentences = sent_tokenize(text)
    return {
        'words': words,
        'sentences': sentences
    }


if __name__ == '__main__':
    # Example usage
    text_to_tokenize = "This is an example sentence. Tokenization is the process of splitting text into words and sentences."
    tokens = tokenize_text(text_to_tokenize)
    print("Word Tokens:", tokens['words'])

    print("Sentence Tokens:", tokens['sentences'])
    # Output:
    # Word Tokens: ['This', 'is', 'an', 'example', 'sentence', '.', 'Tokenization
    # is', 'the', 'process', 'of', 'splitting', 'text', 'into', 'words', 'and', 'sentences', '.']
