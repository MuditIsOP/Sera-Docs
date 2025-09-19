from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uuid
import os
from typing import List

from app.core.config import settings
from app.models.schemas import (
    FileUploadResponse, 
    QueryRequest, 
    QueryResponse,
    DocumentChunk,
    IngestionStatus,
    ErrorResponse
)
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store
from app.services.generation import generation_service

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Sera Docs - Your knowledge companion API"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
static_dir = Path("./static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Create upload directory
UPLOAD_DIR = Path("./data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Initialize services
document_processor = DocumentProcessor()


@app.get("/")
async def root():
    """
    Provides basic application information.

    This root endpoint can be used as a health check to confirm the API is running.

    Returns:
        dict: A dictionary containing the application name, version, and status.
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running"
    }


@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads, processes, and ingests a document into the vector store.

    This endpoint validates the file type and size, saves the file temporarily,
    processes it to extract text and create chunks, and then adds those chunks
    to the vector store.

    Args:
        file (UploadFile): The document to be uploaded.

    Returns:
        FileUploadResponse: A response confirming the successful ingestion,
                            including the number of chunks created.

    Raises:
        HTTPException: 400 for unsupported file types or oversized files.
        HTTPException: 500 for internal errors during processing.
    """
    
    # Validate file extension
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_extension}' not supported. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Validate file size
    contents = await file.read()
    if len(contents) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.max_file_size / 1024 / 1024:.1f}MB"
        )
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}.{file_extension}"
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    try:
        # Process document
        chunks = await document_processor.process_document(
            str(file_path),
            file.filename,
            file_extension
        )
        
        # Add to vector store
        num_chunks = vector_store.add_documents(chunks)
        
        return FileUploadResponse(
            filename=file.filename,
            file_id=file_id,
            message=f"Successfully processed {file.filename}",
            chunks_created=num_chunks
        )
        
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Queries the knowledge base and returns a response.

    Performs a semantic search on the vector store using the user's query.
    If generation is enabled, it uses the search results as context to
    generate a natural language answer.

    Args:
        request (QueryRequest): The user's query and search options.

    Returns:
        QueryResponse: The response containing the answer (if generated)
                       and the source document chunks.
    """
    
    # Perform semantic search
    search_results = vector_store.search(
        query=request.query,
        top_k=request.top_k or settings.top_k_results
    )
    
    # Convert to response format
    sources = [
        DocumentChunk(
            chunk_id=result["chunk_id"],
            content=result["content"],
            metadata=result["metadata"],
            similarity_score=result.get("similarity_score")
        )
        for result in search_results
    ]
    
    # Generate answer if requested
    answer = None
    if request.use_generation and search_results:
        answer = generation_service.generate_response(
            query=request.query,
            context_chunks=search_results,
            max_tokens=2048  # Doubled from default 1024
        )
    
    return QueryResponse(
        query=request.query,
        answer=answer,
        sources=sources
    )


@app.get("/api/status", response_model=IngestionStatus)
async def get_status():
    """
    Retrieves the current status and statistics of the vector store.

    Returns:
        IngestionStatus: An object containing the total number of documents
                         and chunks in the store.
    """
    stats = vector_store.get_stats()
    
    return IngestionStatus(
        status="ready",
        total_documents=stats["total_documents"],
        total_chunks=stats["index_size"]
    )


@app.delete("/api/clear")
async def clear_vector_store():
    """
    Clears all data from the vector store and the upload directory.

    This is a destructive operation and will remove all ingested knowledge.

    Returns:
        dict: A confirmation message.
    """
    vector_store.clear()
    
    # Also clear uploaded files
    for file_path in UPLOAD_DIR.glob("*"):
        if file_path.is_file():
            file_path.unlink()
    
    return {"message": "Vector store cleared successfully"}


# Catch-all route to serve React app
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Serve the React frontend for any non-API routes.
    This allows React Router to handle client-side routing.
    """
    static_dir = Path("./static")
    if static_dir.exists():
        # Try to serve the file if it exists
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            from fastapi.responses import FileResponse
            return FileResponse(file_path)
        
        # For all other routes, serve index.html (React Router)
        index_path = static_dir / "index.html"
        if index_path.exists():
            from fastapi.responses import FileResponse
            return FileResponse(index_path)
    
    # Fallback to API response if no static files
    return {"message": "Frontend not available"}


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom exception handler for HTTPExceptions.

    Ensures that all HTTPExceptions are returned as a consistent
    JSON object with an "error" key.

    Args:
        request: The request that caused the exception.
        exc (HTTPException): The raised exception.

    Returns:
        JSONResponse: A JSON response with the error details.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )