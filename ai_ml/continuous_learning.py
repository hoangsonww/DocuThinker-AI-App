import os
import pickle
import logging
from typing import List

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

logger = logging.getLogger(__name__)
VECTOR_STORE_PATH = "vector_store.faiss"

def load_vector_store():
    """
    Loads the FAISS vector store if it exists; otherwise, creates a new one.
    """
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    if os.path.exists(VECTOR_STORE_PATH):
        with open(VECTOR_STORE_PATH, "rb") as f:
            vector_store = pickle.load(f)
        logger.info("Loaded existing vector store.")
    else:
        vector_store = FAISS.from_texts([], embeddings)
        logger.info("Created new vector store.")
    return vector_store, embeddings

def save_vector_store(vector_store):
    """
    Saves the vector store to disk.
    """
    with open(VECTOR_STORE_PATH, "wb") as f:
        pickle.dump(vector_store, f)
    logger.info("Saved vector store.")

def add_document(document: str, metadata: dict = None):
    """
    Adds a new document to the vector store.
    """
    vector_store, _ = load_vector_store()
    vector_store.add_texts([document], metadatas=[metadata] if metadata else None)
    save_vector_store(vector_store)
    logger.info("Added new document to vector store.")

def retrieve_similar(query: str, k: int = 3) -> List[str]:
    """
    Retrieves the top k similar documents from the vector store for a given query.
    """
    vector_store, _ = load_vector_store()
    results = vector_store.similarity_search(query, k=k)
    # Each result is a Document object (if using LangChain’s Document class)
    return [doc.page_content for doc in results]
