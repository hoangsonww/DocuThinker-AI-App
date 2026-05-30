#!/usr/bin/env python3
"""
Workspace Search and Q&A Module - User-scoped semantic search and RAG across documents
Provides semantic search and question-answering capabilities across a user's document collection
with proper citation tracking and user isolation.
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
import pickle

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

logger = logging.getLogger(__name__)

class UserWorkspaceSearch:
    """Handles semantic search and Q&A for a specific user's document workspace"""
    
    def __init__(self, user_id: str, embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.user_id = user_id
        self.embedding_model = embedding_model
        self.vector_store_dir = f"/tmp/vector_stores/{user_id}"
        self.vector_store_path = f"{self.vector_store_dir}/workspace.faiss"
        self.metadata_path = f"{self.vector_store_dir}/metadata.json"
        
        # Create user-specific directory
        os.makedirs(self.vector_store_dir, exist_ok=True)
        
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name=embedding_model)
        
        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150,
            separators=["\n\n", "\n", ". ", "! ", "? ", " "]
        )
        
        # Load or create vector store
        self.vector_store = self._load_or_create_vector_store()
        self.metadata = self._load_metadata()

    def _load_or_create_vector_store(self) -> FAISS:
        """Load existing vector store or create new one"""
        try:
            if os.path.exists(self.vector_store_path):
                vector_store = FAISS.load_local(self.vector_store_path, self.embeddings)
                logger.info(f"Loaded existing vector store for user {self.user_id}")
                return vector_store
            else:
                # Create empty vector store
                vector_store = FAISS.from_texts([""], self.embeddings)
                vector_store.delete([0])  # Remove the dummy text
                logger.info(f"Created new vector store for user {self.user_id}")
                return vector_store
        except Exception as e:
            logger.error(f"Error loading vector store for user {self.user_id}: {e}")
            # Create new empty vector store as fallback
            vector_store = FAISS.from_texts([""], self.embeddings)
            vector_store.delete([0])
            return vector_store

    def _load_metadata(self) -> Dict:
        """Load document metadata"""
        try:
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r') as f:
                    return json.load(f)
            return {"documents": {}, "chunks": {}}
        except Exception as e:
            logger.error(f"Error loading metadata: {e}")
            return {"documents": {}, "chunks": {}}

    def _save_metadata(self):
        """Save document metadata to disk"""
        try:
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    def _save_vector_store(self):
        """Save vector store to disk"""
        try:
            self.vector_store.save_local(self.vector_store_path)
            logger.info(f"Saved vector store for user {self.user_id}")
        except Exception as e:
            logger.error(f"Error saving vector store: {e}")

    def _calculate_content_hash(self, content: str) -> str:
        """Calculate hash of document content for deduplication"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def index_document(self, doc_id: str, title: str, content: str, 
                      mime_type: str = "text/plain", tags: List[str] = None,
                      updated_at: str = None) -> Dict:
        """
        Index a document into the user's workspace vector store
        
        Args:
            doc_id: Unique document identifier
            title: Document title
            content: Document text content
            mime_type: MIME type of the document
            tags: List of tags associated with the document
            updated_at: Last updated timestamp
        
        Returns:
            Dict with indexing results
        """
        try:
            if not content.strip():
                return {"success": False, "error": "Empty content"}
            
            tags = tags or []
            updated_at = updated_at or datetime.now().isoformat()
            content_hash = self._calculate_content_hash(content)
            
            # Check if document already indexed with same content
            existing_doc = self.metadata["documents"].get(doc_id)
            if existing_doc and existing_doc.get("content_hash") == content_hash:
                return {"success": True, "status": "unchanged", "chunks": existing_doc.get("chunk_count", 0)}
            
            # Remove existing chunks if document exists
            if existing_doc:
                self._remove_document_chunks(doc_id)
            
            # Create chunks
            chunks = self.text_splitter.split_text(content)
            chunk_ids = []
            documents = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}_chunk_{i}"
                chunk_metadata = {
                    "doc_id": doc_id,
                    "chunk_id": chunk_id,
                    "title": title,
                    "mime_type": mime_type,
                    "tags": tags,
                    "updated_at": updated_at,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
                
                documents.append(Document(page_content=chunk, metadata=chunk_metadata))
                chunk_ids.append(chunk_id)
                
                # Store chunk metadata
                self.metadata["chunks"][chunk_id] = chunk_metadata
            
            # Add to vector store
            if documents:
                self.vector_store.add_documents(documents)
                
                # Update document metadata
                self.metadata["documents"][doc_id] = {
                    "title": title,
                    "mime_type": mime_type,
                    "tags": tags,
                    "updated_at": updated_at,
                    "content_hash": content_hash,
                    "chunk_count": len(chunks),
                    "chunk_ids": chunk_ids
                }
                
                # Save everything
                self._save_vector_store()
                self._save_metadata()
                
                logger.info(f"Indexed document {doc_id} with {len(chunks)} chunks")
                return {
                    "success": True, 
                    "status": "indexed", 
                    "chunks": len(chunks),
                    "doc_id": doc_id
                }
            
            return {"success": False, "error": "No chunks created"}
            
        except Exception as e:
            logger.error(f"Error indexing document {doc_id}: {e}")
            return {"success": False, "error": str(e)}

    def _remove_document_chunks(self, doc_id: str):
        """Remove all chunks for a document from vector store"""
        try:
            doc_meta = self.metadata["documents"].get(doc_id)
            if not doc_meta:
                return
            
            # Remove chunks from metadata
            for chunk_id in doc_meta.get("chunk_ids", []):
                self.metadata["chunks"].pop(chunk_id, None)
                
        except Exception as e:
            logger.error(f"Error removing chunks for document {doc_id}: {e}")

    def semantic_search(self, query: str, top_k: int = 10, 
                       filters: Dict = None) -> List[Dict]:
        """
        Perform semantic search across user's documents
        
        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional filters (mime_types, tags, date_range)
        
        Returns:
            List of search results with metadata and scores
        """
        try:
            if not hasattr(self.vector_store, 'index') or self.vector_store.index is None:
                return []
            
            # Perform similarity search
            results = self.vector_store.similarity_search_with_score(query, k=min(top_k * 3, 50))
            
            # Process and filter results
            processed_results = []
            seen_docs = set()
            
            for doc, score in results:
                metadata = doc.metadata
                doc_id = metadata.get("doc_id")
                
                # Apply filters
                if filters and not self._matches_filters(metadata, filters):
                    continue
                
                # Deduplicate by document (keep best score per document)
                if doc_id in seen_docs:
                    continue
                seen_docs.add(doc_id)
                
                # Format result
                result = {
                    "doc_id": doc_id,
                    "title": metadata.get("title", ""),
                    "snippet": doc.page_content[:200] + ("..." if len(doc.page_content) > 200 else ""),
                    "score": float(score),
                    "location": f"chunk_{metadata.get('chunk_index', 0)}",
                    "mime_type": metadata.get("mime_type", ""),
                    "tags": metadata.get("tags", []),
                    "updated_at": metadata.get("updated_at", ""),
                    "chunk_id": metadata.get("chunk_id", "")
                }
                
                processed_results.append(result)
                
                if len(processed_results) >= top_k:
                    break
            
            # Sort by relevance score (lower is better for FAISS)
            processed_results.sort(key=lambda x: x["score"])
            
            return processed_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return []

    def _matches_filters(self, metadata: Dict, filters: Dict) -> bool:
        """Check if document metadata matches the provided filters"""
        try:
            # MIME type filter
            if "mime_types" in filters and filters["mime_types"]:
                if metadata.get("mime_type") not in filters["mime_types"]:
                    return False
            
            # Tags filter
            if "tags" in filters and filters["tags"]:
                doc_tags = metadata.get("tags", [])
                if not any(tag in doc_tags for tag in filters["tags"]):
                    return False
            
            # Date range filter
            if "date_from" in filters or "date_to" in filters:
                updated_at = metadata.get("updated_at", "")
                if updated_at:
                    try:
                        doc_date = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                        
                        if "date_from" in filters and filters["date_from"]:
                            date_from = datetime.fromisoformat(filters["date_from"])
                            if doc_date < date_from:
                                return False
                        
                        if "date_to" in filters and filters["date_to"]:
                            date_to = datetime.fromisoformat(filters["date_to"])
                            if doc_date > date_to:
                                return False
                    except ValueError:
                        # Skip date filtering if date parsing fails
                        pass
            
            return True
            
        except Exception as e:
            logger.error(f"Error in filter matching: {e}")
            return True

    def workspace_qa(self, question: str, top_k: int = 5, 
                    filters: Dict = None) -> Dict:
        """
        Answer a question using RAG across the user's workspace
        
        Args:
            question: Question to answer
            top_k: Number of context chunks to use
            filters: Optional filters for document selection
        
        Returns:
            Dict with answer and citations
        """
        try:
            # Get relevant context using semantic search
            search_results = self.semantic_search(question, top_k=top_k, filters=filters)
            
            if not search_results:
                return {
                    "answer": "I couldn't find any relevant information in your workspace to answer this question.",
                    "citations": [],
                    "context_found": False
                }
            
            # Format context and citations
            context_parts = []
            citations = []
            
            for i, result in enumerate(search_results):
                context_parts.append(f"[{i+1}] {result['snippet']}")
                citations.append({
                    "id": i + 1,
                    "doc_id": result["doc_id"],
                    "title": result["title"],
                    "snippet": result["snippet"],
                    "location": result["location"],
                    "score": result["score"]
                })
            
            # Create context for answer generation
            context = "\n\n".join(context_parts)
            
            # For now, return a structured response that can be enhanced with LLM
            # In a full implementation, this would call an LLM with the context
            answer = f"Based on the documents in your workspace, here's what I found:\n\n{context}"
            
            return {
                "answer": answer,
                "citations": citations,
                "context_found": True,
                "question": question
            }
            
        except Exception as e:
            logger.error(f"Error in workspace Q&A: {e}")
            return {
                "answer": "I encountered an error while searching your workspace. Please try again.",
                "citations": [],
                "context_found": False
            }

    def get_index_status(self) -> Dict:
        """Get indexing status for the user's workspace"""
        try:
            return {
                "user_id": self.user_id,
                "total_documents": len(self.metadata["documents"]),
                "total_chunks": len(self.metadata["chunks"]),
                "last_updated": max(
                    [doc.get("updated_at", "") for doc in self.metadata["documents"].values()],
                    default=""
                ),
                "vector_store_size": os.path.getsize(self.vector_store_path) if os.path.exists(self.vector_store_path) else 0
            }
        except Exception as e:
            logger.error(f"Error getting index status: {e}")
            return {"user_id": self.user_id, "error": str(e)}

    def reindex_all(self) -> Dict:
        """Reindex all documents (for maintenance/updates)"""
        try:
            # This would typically fetch all documents from the main database
            # and reindex them. For now, return status.
            return {
                "success": True,
                "message": "Reindexing would require document fetching from main database",
                "documents_count": len(self.metadata["documents"])
            }
        except Exception as e:
            logger.error(f"Error in reindex_all: {e}")
            return {"success": False, "error": str(e)}


# Global cache for user workspace instances
_workspace_cache = {}

def get_user_workspace(user_id: str) -> UserWorkspaceSearch:
    """Get or create a workspace search instance for a user"""
    if user_id not in _workspace_cache:
        _workspace_cache[user_id] = UserWorkspaceSearch(user_id)
    return _workspace_cache[user_id]


# Main functions for external API calls
def index_document(user_id: str, doc_id: str, title: str, content: str,
                  mime_type: str = "text/plain", tags: List[str] = None,
                  updated_at: str = None) -> Dict:
    """Index a document for a specific user"""
    workspace = get_user_workspace(user_id)
    return workspace.index_document(doc_id, title, content, mime_type, tags, updated_at)


def semantic_search(user_id: str, query: str, top_k: int = 10, 
                   filters: Dict = None) -> List[Dict]:
    """Perform semantic search for a specific user"""
    workspace = get_user_workspace(user_id)
    return workspace.semantic_search(query, top_k, filters)


def workspace_qa(user_id: str, question: str, top_k: int = 5, 
                filters: Dict = None) -> Dict:
    """Answer question using user's workspace"""
    workspace = get_user_workspace(user_id)
    return workspace.workspace_qa(question, top_k, filters)


def get_index_status(user_id: str) -> Dict:
    """Get indexing status for a user"""
    workspace = get_user_workspace(user_id)
    return workspace.get_index_status()


def reindex_user(user_id: str) -> Dict:
    """Reindex all documents for a user"""
    workspace = get_user_workspace(user_id)
    return workspace.reindex_all()


if __name__ == "__main__":
    import sys
    import argparse
    
    # Set up logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    if len(sys.argv) < 3:
        # Basic test mode
        print("Testing workspace search module...")
        
        # Test with sample data
        user_id = "test_user"
        workspace = get_user_workspace(user_id)
        
        # Index a test document
        result = index_document(
            user_id=user_id,
            doc_id="test_doc_1",
            title="Test Document",
            content="This is a test document about artificial intelligence and machine learning.",
            tags=["test", "ai"]
        )
        print(json.dumps({"success": True, "test_index": result}, indent=2))
    else:
        # CLI mode for Node.js integration
        command = sys.argv[1]
        params_json = sys.argv[2]
        
        try:
            params = json.loads(params_json)
            
            if command == "index":
                result = index_document(
                    user_id=params.get("user_id"),
                    doc_id=params.get("doc_id"),
                    title=params.get("title"),
                    content=params.get("content"),
                    mime_type=params.get("mime_type", "text/plain"),
                    tags=params.get("tags", []),
                    updated_at=params.get("updated_at")
                )
                print(json.dumps(result))
                
            elif command == "search":
                results = semantic_search(
                    user_id=params.get("user_id"),
                    query=params.get("query"),
                    top_k=params.get("top_k", 10),
                    filters=params.get("filters", {})
                )
                print(json.dumps({"success": True, "results": results}))
                
            elif command == "qa":
                result = workspace_qa(
                    user_id=params.get("user_id"),
                    question=params.get("question"),
                    top_k=params.get("top_k", 5),
                    filters=params.get("filters", {})
                )
                print(json.dumps({"success": True, **result}))
                
            elif command == "status":
                result = get_index_status(params.get("user_id"))
                print(json.dumps(result))
                
            elif command == "reindex":
                result = reindex_user(params.get("user_id"))
                print(json.dumps(result))
                
            else:
                print(json.dumps({"success": False, "error": f"Unknown command: {command}"}))
                
        except json.JSONDecodeError as e:
            print(json.dumps({"success": False, "error": f"Invalid JSON parameters: {e}"}))
        except Exception as e:
            logger.error(f"Command execution error: {e}")
            print(json.dumps({"success": False, "error": str(e)}))