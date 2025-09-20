from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import json


class Settings(BaseSettings):
    """
    Manages application settings using Pydantic's BaseSettings.

    This class defines all the configuration parameters for the application.
    It loads settings from environment variables and a `.env` file, providing
    default values for each setting.

    Attributes:
        app_name (str): The name of the application.
        app_version (str): The version of the application.
        debug (bool): Flag to enable or disable debug mode.
        gemini_api_key (str): The API key for Google Gemini.
        cors_origins (List[str]): A list of allowed CORS origins.
        embedding_model (str): The name of the sentence-transformer model for embeddings.
        chunk_size (int): The size of text chunks for document processing.
        chunk_overlap (int): The overlap size between text chunks.
        top_k_results (int): The default number of search results to return.
        max_file_size (int): The maximum allowed file size for uploads in bytes.
        allowed_extensions (List[str]): A list of allowed file extensions for uploads.
        host (str): The host address for the server to bind to.
        port (int): The port for the server to listen on.
    """
    # App
    app_name: str = Field(default="RAG Application")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)
    
    # Google Gemini
    gemini_api_key: str = Field(default="")
    
    # CORS
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173", "https://muditisop.github.io"])
    
    # Vector Store
    embedding_model: str = Field(default="all-MiniLM-L6-v2")
    chunk_size: int = Field(default=500)
    chunk_overlap: int = Field(default=100)
    top_k_results: int = Field(default=5)
    
    # File Upload
    max_file_size: int = Field(default=52428800)  # 50MB
    allowed_extensions: List[str] = Field(default=["pdf", "docx", "pptx", "txt", "csv", "html"])
    
    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    
    class Config:
        """Pydantic model configuration."""
        env_file = ".env"
        
    def model_post_init(self, __context):
        """
        Post-initialization hook to process string-based list fields.

        This method is automatically called by Pydantic after the model is
        initialized. It checks if `cors_origins` or `allowed_extensions` have been
        provided as a comma-separated string (common for environment variables)
        and parses them into a proper list of strings. It also supports JSON-formatted
        strings for `cors_origins`.

        Args:
            __context: The Pydantic context, not used here.
        """
        # Parse CORS origins if they're a string
        if isinstance(self.cors_origins, str):
            try:
                self.cors_origins = json.loads(self.cors_origins)
            except:
                self.cors_origins = [origin.strip() for origin in self.cors_origins.split(',')]
        
        # Parse allowed extensions if they're a string
        if isinstance(self.allowed_extensions, str):
            self.allowed_extensions = [ext.strip() for ext in self.allowed_extensions.split(',')]


settings = Settings()