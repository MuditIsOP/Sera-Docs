from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class FileUploadResponse(BaseModel):
    """
    Response model for a successful file upload.

    Attributes:
        filename (str): The name of the uploaded file.
        file_id (str): A unique identifier for the uploaded file.
        message (str): A status message confirming the upload and processing.
        chunks_created (int): The number of text chunks created from the document.
    """
    filename: str
    file_id: str
    message: str
    chunks_created: int


class DocumentChunk(BaseModel):
    """
    Represents a single chunk of a processed document.

    Attributes:
        chunk_id (str): A unique identifier for the chunk.
        content (str): The text content of the chunk.
        metadata (Dict[str, Any]): Metadata associated with the chunk, e.g., source filename.
        similarity_score (Optional[float]): The similarity score of the chunk to a query.
    """
    chunk_id: str
    content: str
    metadata: Dict[str, Any]
    similarity_score: Optional[float] = None


class QueryRequest(BaseModel):
    """
    Request model for querying the document store.

    Attributes:
        query (str): The user's query string.
        top_k (Optional[int]): The number of relevant chunks to retrieve.
        use_generation (Optional[bool]): Flag to enable or disable AI response generation.
    """
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: Optional[int] = Field(default=5, ge=1, le=20)
    use_generation: Optional[bool] = Field(default=True)


class QueryResponse(BaseModel):
    """
    Response model for a query result.

    Attributes:
        query (str): The original query string.
        answer (Optional[str]): The AI-generated answer, if requested.
        sources (List[DocumentChunk]): A list of source document chunks.
        timestamp (datetime): The timestamp of when the response was generated.
    """
    query: str
    answer: Optional[str] = None
    sources: List[DocumentChunk]
    timestamp: datetime = Field(default_factory=datetime.now)


class IngestionStatus(BaseModel):
    """
    Represents the current status of the vector store.

    Attributes:
        status (str): The current status (e.g., "ready").
        total_documents (int): The total number of documents ingested.
        total_chunks (int): The total number of chunks in the vector store.
    """
    status: str
    total_documents: int
    total_chunks: int


class ErrorResponse(BaseModel):
    """
    Standard error response model.

    Attributes:
        error (str): A high-level error message.
        details (Optional[str]): Optional detailed information about the error.
    """
    error: str
    details: Optional[str] = None