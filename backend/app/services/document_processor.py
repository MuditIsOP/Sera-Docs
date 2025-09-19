import os
from typing import List, Dict, Any
from pathlib import Path
import hashlib

# Document processors
from pypdf import PdfReader
from docx import Document as DocxDocument
from pptx import Presentation
from bs4 import BeautifulSoup
import pandas as pd

from app.core.config import settings


class DocumentProcessor:
    """Service to handle document processing and text extraction"""
    
    def __init__(self):
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap
        
    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text from various document types"""
        extractors = {
            'pdf': self._extract_pdf,
            'docx': self._extract_docx,
            'pptx': self._extract_pptx,
            'txt': self._extract_txt,
            'csv': self._extract_csv,
            'html': self._extract_html,
        }
        
        extractor = extractors.get(file_type.lower())
        if not extractor:
            raise ValueError(f"Unsupported file type: {file_type}")
            
        return extractor(file_path)
    
    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = DocxDocument(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    
    def _extract_pptx(self, file_path: str) -> str:
        """Extract text from PPTX"""
        prs = Presentation(file_path)
        text = ""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text
    
    def _extract_txt(self, file_path: str) -> str:
        """Extract text from TXT"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _extract_csv(self, file_path: str) -> str:
        """Extract text from CSV"""
        df = pd.read_csv(file_path)
        return df.to_string()
    
    def _extract_html(self, file_path: str) -> str:
        """Extract text from HTML"""
        with open(file_path, 'r', encoding='utf-8') as file:
            soup = BeautifulSoup(file.read(), 'html.parser')
            return soup.get_text()
    
    def create_chunks(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = " ".join(chunk_words)
            
            if chunk_text.strip():  # Skip empty chunks
                chunk_id = hashlib.md5(chunk_text.encode()).hexdigest()
                chunks.append({
                    "chunk_id": chunk_id,
                    "content": chunk_text,
                    "metadata": {
                        **metadata,
                        "chunk_index": len(chunks),
                        "start_index": i,
                        "end_index": min(i + self.chunk_size, len(words))
                    }
                })
        
        return chunks
    
    async def process_document(self, file_path: str, filename: str, file_type: str) -> List[Dict[str, Any]]:
        """Process a document and return chunks"""
        # Extract text
        text = self.extract_text(file_path, file_type)
        
        # Create metadata
        metadata = {
            "filename": filename,
            "file_type": file_type,
            "file_path": file_path,
        }
        
        # Create chunks
        chunks = self.create_chunks(text, metadata)
        
        return chunks