from transformers import pipeline

# Load pre-trained sentiment analysis model
sentiment_analyzer = pipeline("sentiment-analysis")


def analyze_sentiment(text):
    """
    Analyzes the sentiment of the provided text.

    Args:
        text (str): The text to analyze.

    Returns:
        dict: A dictionary containing the sentiment score and label.
    """
    result = sentiment_analyzer(text)[0]
    # Convert the sentiment label to a numeric score
    sentiment_score = 1 if result['label'] == 'POSITIVE' else -1 if result['label'] == 'NEGATIVE' else 0
    return {
        'score': sentiment_score,
        'description': result['label']
    }


if __name__ == '__main__':
    # Example usage
    text_to_analyze = "The company's growth has been phenomenal, and the future outlook looks positive."
    sentiment = analyze_sentiment(text_to_analyze)
    print("Sentiment Analysis:", sentiment)
