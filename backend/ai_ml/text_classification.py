from transformers import pipeline

# Load a pre-trained text classification model
classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")

def classify_text(text):
    """
    Classifies the given text into categories such as positive, negative, or neutral.

    Args:
        text (str): The text to classify.

    Returns:
        dict: A dictionary containing the category and confidence score.
    """
    result = classifier(text)[0]
    return {
        'category': result['label'],
        'score': result['score']
    }


if __name__ == '__main__':
    # Example usage
    text_to_classify = "The movie was great and I enjoyed it."
    classification = classify_text(text_to_classify)
    print("Text Classification:", classification)
