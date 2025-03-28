def analyze_sentiment(text, sentiment_analyzer):
    """
    Analyzes the sentiment of the text using the sentiment analysis pipeline.
    """
    result = sentiment_analyzer(text)
    return result[0]
