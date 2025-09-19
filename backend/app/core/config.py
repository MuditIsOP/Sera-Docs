from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import json


class Settings(BaseSettings):
    # App
    app_name: str = Field(default="RAG Application")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)
    
    # Google Gemini
    gemini_api_key: str = Field(default="")
    
    # CORS
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173"])
    
    # Vector Store
    embedding_model: str = Field(default="all-MiniLM-L6-v2")
    chunk_size: int = Field(default=500)
    chunk_overlap: int = Field(default=100)
    top_k_results: int = Field(default=5)
    
    # File Upload
    max_file_size: int = Field(default=10485760)  # 10MB
    allowed_extensions: List[str] = Field(default=["pdf", "docx", "pptx", "txt", "csv", "html"])
    
    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    
    class Config:
        env_file = ".env"
        
    def model_post_init(self, __context):
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