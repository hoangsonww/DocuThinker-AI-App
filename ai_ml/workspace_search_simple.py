#!/usr/bin/env python3
"""
Simple Workspace Search - Mock implementation for testing backend integration
This is a simplified version that doesn't require external dependencies to test the backend API
"""

import sys
import json
import logging
import os
import hashlib
from datetime import datetime
from typing import Dict, List

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleWorkspaceSearch:
    """Mock implementation for testing purposes"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.storage_dir = f"/tmp/workspace_simple/{user_id}"
        self.metadata_file = f"{self.storage_dir}/metadata.json"
        os.makedirs(self.storage_dir, exist_ok=True)
        self.metadata = self._load_metadata()
    
    def _load_metadata(self):
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return {"documents": {}}
    
    def _save_metadata(self):
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def _hash_content(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def index_document(self, doc_id: str, title: str, content: str, **kwargs):
        """Mock document indexing"""
        content_hash = self._hash_content(content)
        
        # Store document metadata
        self.metadata["documents"][doc_id] = {
            "title": title,
            "content": content,
            "content_hash": content_hash,
            "indexed_at": datetime.now().isoformat(),
            "mime_type": kwargs.get("mime_type", "text/plain"),
            "tags": kwargs.get("tags", []),
            "updated_at": kwargs.get("updated_at", datetime.now().isoformat())
        }
        
        self._save_metadata()
        logger.info(f"Indexed document {doc_id} for user {self.user_id}")
        
        return {"success": True, "doc_id": doc_id, "status": "indexed"}
    
    def semantic_search(self, query: str, top_k: int = 10, filters: dict = None):
        """Mock semantic search using simple keyword matching"""
        results = []
        query_lower = query.lower()
        
        for doc_id, doc_data in self.metadata["documents"].items():
            # Simple keyword matching
            title_match = query_lower in doc_data["title"].lower()
            content_match = query_lower in doc_data["content"].lower()
            
            if title_match or content_match:
                # Calculate mock score (higher for title matches)
                score = 0.9 if title_match else 0.7
                
                # Apply filters if provided
                if filters:
                    if "mime_types" in filters and doc_data["mime_type"] not in filters["mime_types"]:
                        continue
                    if "tags" in filters and not any(tag in doc_data["tags"] for tag in filters["tags"]):
                        continue
                
                # Create snippet
                content = doc_data["content"]
                query_pos = content.lower().find(query_lower)
                if query_pos >= 0:
                    start = max(0, query_pos - 100)
                    end = min(len(content), query_pos + 100)
                    snippet = content[start:end] + ("..." if end < len(content) else "")
                else:
                    snippet = content[:200] + ("..." if len(content) > 200 else "")
                
                results.append({
                    "doc_id": doc_id,
                    "title": doc_data["title"],
                    "snippet": snippet,
                    "score": score,
                    "location": "content",
                    "mime_type": doc_data["mime_type"],
                    "tags": doc_data["tags"],
                    "updated_at": doc_data["updated_at"]
                })
        
        # Sort by score (descending) and limit results
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
    
    def workspace_qa(self, question: str, top_k: int = 5, filters: dict = None):
        """Mock Q&A using search results"""
        search_results = self.semantic_search(question, top_k, filters)
        
        if not search_results:
            return {
                "answer": "I couldn't find any relevant information in your workspace to answer this question.",
                "citations": [],
                "context_found": False,
                "question": question
            }
        
        # Create citations
        citations = []
        for i, result in enumerate(search_results):
            citations.append({
                "id": i + 1,
                "doc_id": result["doc_id"],
                "title": result["title"],
                "snippet": result["snippet"],
                "location": result["location"],
                "score": result["score"]
            })
        
        # Generate simple answer
        answer = f"Based on {len(citations)} document(s) in your workspace, here's what I found:\n\n"
        for i, citation in enumerate(citations[:3]):  # Use top 3 for answer
            answer += f"[{citation['id']}] From '{citation['title']}': {citation['snippet'][:150]}...\n\n"
        
        return {
            "answer": answer,
            "citations": citations,
            "context_found": True,
            "question": question
        }
    
    def get_status(self):
        """Get indexing status"""
        return {
            "user_id": self.user_id,
            "total_documents": len(self.metadata["documents"]),
            "total_chunks": len(self.metadata["documents"]),  # Mock: 1 chunk per doc
            "last_updated": max([doc.get("updated_at", "") for doc in self.metadata["documents"].values()], default=""),
            "vector_store_size": os.path.getsize(self.metadata_file) if os.path.exists(self.metadata_file) else 0
        }
    
    def reindex(self):
        """Mock reindexing"""
        return {
            "success": True,
            "message": "Reindexing completed",
            "documents_count": len(self.metadata["documents"])
        }


def main():
    if len(sys.argv) < 3:
        # Test mode
        workspace = SimpleWorkspaceSearch("test_user")
        result = workspace.index_document(
            "test_doc", 
            "Test Document", 
            "This is a test document about artificial intelligence and machine learning."
        )
        search_results = workspace.semantic_search("artificial intelligence")
        qa_result = workspace.workspace_qa("What is this document about?")
        
        print(json.dumps({
            "test_mode": True,
            "index_result": result,
            "search_results": search_results,
            "qa_result": qa_result
        }, indent=2))
        return
    
    # API mode
    command = sys.argv[1]
    params_json = sys.argv[2]
    
    try:
        params = json.loads(params_json)
        user_id = params.get("user_id")
        
        if not user_id:
            print(json.dumps({"success": False, "error": "user_id is required"}))
            return
        
        workspace = SimpleWorkspaceSearch(user_id)
        
        if command == "index":
            result = workspace.index_document(
                doc_id=params.get("doc_id"),
                title=params.get("title"),
                content=params.get("content"),
                mime_type=params.get("mime_type", "text/plain"),
                tags=params.get("tags", []),
                updated_at=params.get("updated_at")
            )
            print(json.dumps(result))
            
        elif command == "search":
            results = workspace.semantic_search(
                query=params.get("query"),
                top_k=params.get("top_k", 10),
                filters=params.get("filters", {})
            )
            print(json.dumps({"success": True, "results": results}))
            
        elif command == "qa":
            result = workspace.workspace_qa(
                question=params.get("question"),
                top_k=params.get("top_k", 5),
                filters=params.get("filters", {})
            )
            print(json.dumps({"success": True, **result}))
            
        elif command == "status":
            result = workspace.get_status()
            print(json.dumps(result))
            
        elif command == "reindex":
            result = workspace.reindex()
            print(json.dumps(result))
            
        else:
            print(json.dumps({"success": False, "error": f"Unknown command: {command}"}))
            
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON parameters: {e}"}))
    except Exception as e:
        logger.error(f"Command execution error: {e}")
        print(json.dumps({"success": False, "error": str(e)}))


if __name__ == "__main__":
    main()