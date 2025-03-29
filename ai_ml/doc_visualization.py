#!/usr/bin/env python
import os
import pickle
import logging
import pandas as pd
import matplotlib.pyplot as plt

# Path to the persisted vector store (from continuous_learning.py)
VECTOR_STORE_PATH = "vector_store.faiss"
logger = logging.getLogger(__name__)


def load_vector_store_metadata():
    """
    Loads the FAISS vector store and extracts metadata from all stored documents.
    Assumes that when adding documents, metadata (e.g., {'source': ..., 'timestamp': ...}) was provided.
    Returns a list of metadata dictionaries.
    """
    if not os.path.exists(VECTOR_STORE_PATH):
        logger.error("Vector store file %s does not exist.", VECTOR_STORE_PATH)
        return []

    # Load the persisted vector store using pickle
    with open(VECTOR_STORE_PATH, "rb") as f:
        vector_store = pickle.load(f)

    # Retrieve metadata from each Document in the FAISS vector store.
    # For LangChain's FAISS, documents are stored in the internal docstore.
    metadata_list = []
    # This assumes the docstore is a dictionary stored in vector_store.docstore._dict
    if hasattr(vector_store.docstore, "_dict"):
        for doc in vector_store.docstore._dict.values():
            # Each doc is assumed to have a 'metadata' attribute.
            metadata_list.append(doc.metadata if hasattr(doc, "metadata") else {})
    else:
        logger.error("No metadata found in the vector store.")

    return metadata_list


def visualize_document_sources(metadata_list):
    """
    Creates a bar chart showing the count of documents per source.
    Expects that each metadata dictionary contains a 'source' key.
    """
    # Build a DataFrame from the metadata list
    df = pd.DataFrame(metadata_list)
    if 'source' not in df.columns or df['source'].isnull().all():
        print("No 'source' metadata found in the vector store.")
        return

    # Count documents per source
    source_counts = df['source'].value_counts()
    plt.figure(figsize=(8, 6))
    plt.bar(source_counts.index, source_counts.values, color="skyblue", edgecolor="black")
    plt.xlabel("Document Source")
    plt.ylabel("Count")
    plt.title("Distribution of Documents by Source")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.show()


def main():
    metadata_list = load_vector_store_metadata()
    if metadata_list:
        visualize_document_sources(metadata_list)
    else:
        print("No metadata available for visualization.")


if __name__ == "__main__":
    main()
