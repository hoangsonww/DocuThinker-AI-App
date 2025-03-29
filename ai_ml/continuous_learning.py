#!/usr/bin/env python
import os
import pickle
import json
import logging
from typing import List, Optional, Dict, Tuple

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

logger = logging.getLogger(__name__)
VECTOR_STORE_PATH = "vector_store.faiss"  # Persistent file for FAISS index


# CONTINUOUS LEARNING MODULE - Allows the AI to learn from user interactions and feedback, and improve over time.

def load_vector_store() -> Tuple[FAISS, HuggingFaceEmbeddings]:
    """
    Loads the FAISS vector store if it exists; otherwise, creates a new one using a default embedding model.
    Uses 'sentence-transformers/all-MiniLM-L6-v2' as the default embedding model.
    """
    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        if os.path.exists(VECTOR_STORE_PATH):
            with open(VECTOR_STORE_PATH, "rb") as f:
                vector_store = pickle.load(f)
            logger.info("Loaded existing vector store from %s.", VECTOR_STORE_PATH)
        else:
            vector_store = FAISS.from_texts([], embeddings)
            logger.info("Created new vector store.")
        return vector_store, embeddings
    except Exception as e:
        logger.exception("Failed to load or create vector store: %s", e)
        raise


def save_vector_store(vector_store: FAISS) -> None:
    """
    Saves the FAISS vector store to disk.
    """
    try:
        with open(VECTOR_STORE_PATH, "wb") as f:
            pickle.dump(vector_store, f)
        logger.info("Saved vector store to %s.", VECTOR_STORE_PATH)
    except Exception as e:
        logger.exception("Error saving vector store: %s", e)
        raise


def add_document(document: str, metadata: Optional[Dict] = None) -> None:
    """
    Adds a new document to the vector store along with optional metadata.
    For example, metadata can include 'id', 'source', and 'timestamp'.
    """
    try:
        vector_store, _ = load_vector_store()
        vector_store.add_texts([document], metadatas=[metadata] if metadata else None)
        save_vector_store(vector_store)
        logger.info("Added new document to vector store. Metadata: %s", metadata)
    except Exception as e:
        logger.exception("Error adding document: %s", e)
        raise


def retrieve_similar(query: str, k: int = 3) -> List[str]:
    """
    Retrieves the top k similar documents from the vector store for a given query.
    Returns a list of document texts.
    """
    try:
        vector_store, _ = load_vector_store()
        results = vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in results]
    except Exception as e:
        logger.exception("Error retrieving similar documents: %s", e)
        return []


def get_augmented_context(query: str, k: int = 3) -> str:
    """
    Retrieves similar documents for a given query and concatenates their text to create an augmented context.
    This augmented context can be used to improve downstream responses.
    """
    try:
        similar_docs = retrieve_similar(query, k)
        if similar_docs:
            augmented = "\n".join(similar_docs)
            logger.info("Augmented context created with %d similar documents.", len(similar_docs))
            return augmented
        else:
            logger.info("No similar documents found; returning original query as context.")
            return query
    except Exception as e:
        logger.exception("Error creating augmented context: %s", e)
        return query


def update_document(document_id: str, new_document: str, metadata: Optional[Dict] = None) -> None:
    """
    Updates an existing document in the vector store by rebuilding the index without the old version
    and then adding the updated document with the provided metadata. Assumes each stored document's
    metadata includes a unique 'id' field.
    """
    try:
        vector_store, embeddings = load_vector_store()
        new_texts = []
        new_metadatas = []
        # Iterate over stored documents (assumes vector_store.docstore._dict exists)
        for doc_id, doc in vector_store.docstore._dict.items():
            if doc.metadata.get("id") != document_id:
                new_texts.append(doc.page_content)
                new_metadatas.append(doc.metadata)
        # Rebuild the vector store with existing documents except the one to update.
        new_vector_store = FAISS.from_texts(new_texts, embeddings, metadatas=new_metadatas)
        # Ensure metadata includes the unique id.
        if metadata is None:
            metadata = {}
        metadata["id"] = document_id
        new_vector_store.add_texts([new_document], metadatas=[metadata])
        save_vector_store(new_vector_store)
        logger.info("Updated document with id %s in the vector store.", document_id)
    except Exception as e:
        logger.exception("Error updating document: %s", e)
        raise


def reindex_vector_store(new_embedding_model: str) -> None:
    """
    Re-indexes the entire vector store using a new embedding model.
    Useful if we wish to update the document representations as embedding quality improves.
    """
    try:
        from langchain.embeddings import HuggingFaceEmbeddings
        vector_store, _ = load_vector_store()
        texts = [doc.page_content for doc in vector_store.docstore._dict.values()]
        metadatas = [doc.metadata for doc in vector_store.docstore._dict.values()]
        new_embeddings = HuggingFaceEmbeddings(model_name=new_embedding_model)
        new_vector_store = FAISS.from_texts(texts, new_embeddings, metadatas=metadatas)
        save_vector_store(new_vector_store)
        logger.info("Reindexed vector store with new embedding model: %s", new_embedding_model)
    except Exception as e:
        logger.exception("Error reindexing vector store: %s", e)
        raise


def store_feedback(document_id: str, feedback: Dict) -> None:
    """
    Stores user feedback for a specific document. Feedback is saved in a local JSON log file.
    In production, this could be integrated with a database.
    """
    try:
        feedback_file = "feedback_log.json"
        if os.path.exists(feedback_file):
            with open(feedback_file, "r") as f:
                feedback_log = json.load(f)
        else:
            feedback_log = {}
        feedback_log[document_id] = feedback
        with open(feedback_file, "w") as f:
            json.dump(feedback_log, f, indent=4)
        logger.info("Stored feedback for document id %s.", document_id)
    except Exception as e:
        logger.exception("Error storing feedback: %s", e)
        raise
