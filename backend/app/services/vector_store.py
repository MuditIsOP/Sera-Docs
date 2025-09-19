import numpy as np
import faiss
import pickle
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import os
from pathlib import Path

from app.core.config import settings


class VectorStore:
    """
    A FAISS-based vector store for efficient semantic search.

    This class manages the storage and retrieval of document chunks and their
    corresponding vector embeddings. It handles embedding generation, indexing,
    searching, and persistence to disk.
    """
    
    def __init__(self):
        """
        Initializes the VectorStore.

        This involves loading the sentence-transformer model, setting up the
        FAISS index, and attempting to load an existing index from disk.
        """
        self.embedding_model = SentenceTransformer(settings.embedding_model)
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []
        self.storage_path = Path("./data/vector_store")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Try to load existing index
        self.load()
    
    def add_documents(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Adds document chunks to the vector store.

        This method generates embeddings for the provided text chunks, adds them
        to the FAISS index, stores the associated metadata, and persists the
        updated store to disk.

        Args:
            chunks (List[Dict[str, Any]]): A list of document chunks, where each
                                           chunk is a dictionary containing at
                                           least a "content" key.

        Returns:
            int: The number of chunks successfully added.
        """
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
        """
        Performs a semantic search for a given query.

        It generates an embedding for the query, searches the FAISS index for
        the most similar vectors, and returns the corresponding document chunks.

        Args:
            query (str): The search query text.
            top_k (int): The maximum number of results to return.

        Returns:
            List[Dict[str, Any]]: A list of matching document chunks, each
                                  enhanced with a 'similarity_score'.
        """
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
                # Convert L2 distance to a normalized similarity score (0-1)
                result["similarity_score"] = float(1 / (1 + dist))
                results.append(result)
        
        return results
    
    def save(self):
        """Saves the FAISS index and document metadata to disk."""
        # Save FAISS index
        faiss_path = self.storage_path / "faiss_index.bin"
        faiss.write_index(self.index, str(faiss_path))
        
        # Save documents
        docs_path = self.storage_path / "documents.pkl"
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
    
    def load(self) -> bool:
        """
        Loads the vector store from disk if it exists.

        If loading fails, it resets the store to an empty state.

        Returns:
            bool: True if the store was loaded successfully, False otherwise.
        """
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
        """
        Clears the vector store, both in memory and on disk.

        Resets the FAISS index and document list, and deletes the saved files.
        """
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
        """
        Gets statistics about the current state of the vector store.

        Returns:
            Dict[str, Any]: A dictionary containing statistics like the number
                            of documents, index size, and model information.
        """
        return {
            "total_documents": len(self.documents),
            "index_size": self.index.ntotal,
            "embedding_model": settings.embedding_model,
            "dimension": self.dimension
        }


# Global instance of the vector store, accessible throughout the application.
vector_store = VectorStore()