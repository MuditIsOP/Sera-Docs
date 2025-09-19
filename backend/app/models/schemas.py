from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class FileUploadResponse(BaseModel):
    filename: str
    file_id: str
    message: str
    chunks_created: int
    
    
class DocumentChunk(BaseModel):
    chunk_id: str
    content: str
    metadata: Dict[str, Any]
    similarity_score: Optional[float] = None
    

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: Optional[int] = Field(default=5, ge=1, le=20)
    use_generation: Optional[bool] = Field(default=True)
    

class QueryResponse(BaseModel):
    query: str
    answer: Optional[str] = None
    sources: List[DocumentChunk]
    timestamp: datetime = Field(default_factory=datetime.now)
    

class IngestionStatus(BaseModel):
    status: str
    total_documents: int
    total_chunks: int
    

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None