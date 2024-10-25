import gensim
from gensim import corpora


def perform_topic_modeling(documents, num_topics=3):
    """
    Performs topic modeling on a list of documents to identify the main topics.

    Args:
        documents (list): A list of documents (strings) for topic modeling.
        num_topics (int): Number of topics to identify.

    Returns:
        list: A list of topics and their top words.
    """
    # Tokenize the documents
    tokenized_docs = [doc.split() for doc in documents]

    # Create a dictionary and corpus for gensim
    dictionary = corpora.Dictionary(tokenized_docs)
    corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]

    # Apply LDA model for topic extraction
    lda_model = gensim.models.ldamodel.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=10)

    # Extract topics and their top words
    topics = lda_model.print_topics(num_words=5)
    return topics


if __name__ == '__main__':
    # Example documents for topic modeling
    documents = [
        "Natural language processing (NLP) is a subfield of artificial intelligence that focuses on the interaction between computers and humans using natural language.",
        "It is used to apply machine learning algorithms to text and speech.",
        "NLP techniques are used in various applications like sentiment analysis, chatbots, and language translation."
    ]

    # Perform topic modeling
    topics = perform_topic_modeling(documents)
    for topic in topics:
        print("Topic:", topic)
    # Output:
    # Topic: (0, '0.059*"language" + 0.059*"natural" + 0.059*"processing" + 0.059*"intelligence" + 0.059*"subfield"')
