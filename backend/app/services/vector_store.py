import numpy as np
import faiss
import pickle
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import os
from pathlib import Path

from app.core.config import settings


class VectorStore:
    """FAISS-based vector store for semantic search"""
    
    def __init__(self):
        self.embedding_model = SentenceTransformer(settings.embedding_model)
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []
        self.storage_path = Path("./data/vector_store")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Try to load existing index
        self.load()
    
    def add_documents(self, chunks: List[Dict[str, Any]]) -> int:
        """Add document chunks to the vector store"""
        if not chunks:
            return 0
            
        # Extract texts for embedding
        texts = [chunk["content"] for chunk in chunks]
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
        
        # Add to FAISS index
        self.index.add(embeddings)
        
        # Store document metadata
        self.documents.extend(chunks)
        
        # Save the updated index
        self.save()
        
        return len(chunks)
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search"""
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
        
        # Search in FAISS
        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query_embedding, k)
        
        # Prepare results
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.documents):
                result = self.documents[idx].copy()
                result["similarity_score"] = float(1 / (1 + dist))  # Convert distance to similarity
                results.append(result)
        
        return results
    
    def save(self):
        """Save the vector store to disk"""
        # Save FAISS index
        faiss_path = self.storage_path / "faiss_index.bin"
        faiss.write_index(self.index, str(faiss_path))
        
        # Save documents
        docs_path = self.storage_path / "documents.pkl"
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
    
    def load(self) -> bool:
        """Load the vector store from disk"""
        faiss_path = self.storage_path / "faiss_index.bin"
        docs_path = self.storage_path / "documents.pkl"
        
        if faiss_path.exists() and docs_path.exists():
            try:
                # Load FAISS index
                self.index = faiss.read_index(str(faiss_path))
                
                # Load documents
                with open(docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
                
                return True
            except Exception as e:
                print(f"Error loading vector store: {e}")
                # Reset to empty state
                self.index = faiss.IndexFlatL2(self.dimension)
                self.documents = []
        
        return False
    
    def clear(self):
        """Clear the vector store"""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []
        
        # Remove saved files
        faiss_path = self.storage_path / "faiss_index.bin"
        docs_path = self.storage_path / "documents.pkl"
        
        if faiss_path.exists():
            faiss_path.unlink()
        if docs_path.exists():
            docs_path.unlink()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        return {
            "total_documents": len(self.documents),
            "index_size": self.index.ntotal,
            "embedding_model": settings.embedding_model,
            "dimension": self.dimension
        }


# Global instance
vector_store = VectorStore()