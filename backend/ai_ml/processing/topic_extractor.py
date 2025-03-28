def extract_topics(text, topic_extractor):
    """
    Extracts key topics from the text using the zero-shot classification pipeline.
    Candidate labels can be adjusted as needed.
    """
    candidate_labels = [
        "technology", "health", "finance", "politics",
        "sports", "education", "science", "entertainment"
    ]
    result = topic_extractor(text, candidate_labels)
    # Sort topics by score and return the top three
    topics = sorted(zip(result["labels"], result["scores"]), key=lambda x: x[1], reverse=True)
    return [topic for topic, score in topics[:3]]
