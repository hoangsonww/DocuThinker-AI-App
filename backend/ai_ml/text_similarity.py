from sentence_transformers import SentenceTransformer, util

# Load the pre-trained model for text similarity
model = SentenceTransformer('all-MiniLM-L6-v2')


def calculate_similarity(text1, text2):
    """
    Calculates the similarity between two texts using sentence embeddings.

    Args:
        text1 (str): The first text to compare.
        text2 (str): The second text to compare.

    Returns:
        float: A similarity score between 0 and 1.
    """
    # Encode the texts into embeddings
    embedding1 = model.encode(text1, convert_to_tensor=True)
    embedding2 = model.encode(text2, convert_to_tensor=True)

    # Calculate cosine similarity between the two embeddings
    similarity_score = util.pytorch_cos_sim(embedding1, embedding2).item()
    return similarity_score


if __name__ == '__main__':
    # Example usage
    text1 = "The quick brown fox jumps over the lazy dog."
    text2 = "A fox jumps over a dog."
    similarity = calculate_similarity(text1, text2)
    print("Text Similarity Score:", similarity)

    text3 = "The company's revenue has been growing steadily over the past year."
    text4 = "The organization has seen consistent revenue growth in recent months."
    similarity2 = calculate_similarity(text3, text4)
    print("Text Similarity Score 2:", similarity2)

    text5 = "The weather today is sunny and warm."
    text6 = "It is raining heavily outside."
    similarity3 = calculate_similarity(text5, text6)
    print("Text Similarity Score 3:", similarity3)
