def retrieval_augmented_generation(text, rag_chain):
    """
    Generates an in-depth analysis of the document using the RAG chain.
    """
    analysis = rag_chain.run(text=text)
    return analysis.strip()
