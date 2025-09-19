# Sera Docs - Your Knowledge Companion

A modern, production-ready RAG (Retrieval-Augmented Generation) application built with FastAPI, React, FAISS, and Google Gemini 2.5 Flash. Meet Sera, your warm and intelligent AI companion who helps you discover insights within your documents.

## 🌸 Features

- **Multi-File Upload**: Support for PDF, DOCX, PPTX, TXT, CSV, and HTML files with batch processing
- **Smart Chunking**: Automatic text splitting with configurable chunk size and overlap
- **Semantic Search**: FAISS-powered vector search with sentence-transformers embeddings
- **AI Generation**: Google Gemini 2.5 Flash integration with Sera's warm, feminine personality
- **Voice Features**: Speech-to-text input and text-to-speech output with female voice selection
- **Modern UI**: React + Tailwind CSS + Framer Motion with dark mode support
- **Drag & Drop**: Intuitive multi-file upload interface
- **Source Citations**: View exact document chunks used for generating answers
- **Real-time Chat**: Smooth, flicker-free chat interface with message history
- **Docker Ready**: Complete containerization with docker-compose

## 📋 Prerequisites

- **Option 1: Docker** (Recommended)
  - Docker Desktop installed
  - Docker Compose

- **Option 2: Local Development**
  - Python 3.11+
  - Node.js 18+
  - npm or yarn

## 🔑 API Keys

You'll need a Google Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate an API key
3. Copy it for the setup

## 🛠️ Installation

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RAG
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
RAG/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configuration
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   │   ├── document_processor.py  # Document parsing
│   │   │   ├── vector_store.py       # FAISS operations
│   │   │   └── generation.py         # Gemini integration
│   │   └── main.py        # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatInterface.jsx    # Main chat UI
│   │   │   ├── FileUpload.jsx      # Drag-drop upload
│   │   │   └── SourceViewer.jsx    # Citation viewer
│   │   ├── App.jsx        # Main application
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## 🔧 Configuration

### Backend Configuration (`.env`)

```env
# Required
GEMINI_API_KEY=your_key_here

# Optional (with defaults)
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=500
CHUNK_OVERLAP=100
TOP_K_RESULTS=5
MAX_FILE_SIZE=10485760  # 10MB
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### Response Generation Limits

- **Default max tokens**: 2048 tokens per response
- **Configurable**: Modify `max_tokens` in `backend/app/main.py` line 135
- **Model**: Google Gemini 2.5 Flash

### Supported File Types

- **Documents**: PDF, DOCX, PPTX
- **Text**: TXT, CSV
- **Web**: HTML

## 📊 Architecture

### Backend Components

1. **Document Processor**
   - Extracts text from various file formats
   - Splits text into overlapping chunks
   - Maintains metadata for source tracking

2. **Vector Store (FAISS)**
   - Generates embeddings using sentence-transformers
   - Stores vectors in FAISS index
   - Performs semantic similarity search

3. **Generation Service**
   - Integrates with Google Gemini API
   - Creates context-aware prompts
   - Generates answers with citations

### Frontend Components

1. **Chat Interface**
   - Real-time message display with smooth animations
   - Voice input/output with speech recognition
   - Memoized components to prevent flickering
   - Loading states and error handling

2. **File Upload**
   - Multi-file drag-and-drop support
   - Sequential file processing
   - File validation and size limits
   - Upload progress indication

3. **Source Viewer**
   - Modal display of source chunks
   - Metadata visualization
   - Similarity scores

4. **UI Features**
   - Dark/light mode toggle
   - Responsive design
   - Framer Motion animations
   - Local storage for preferences

## 🚀 Usage

1. **Upload Documents**
   - Drag and drop multiple files into the upload area
   - Or click to select one or more files
   - Files are processed sequentially with progress indication
   - Wait for processing confirmation

2. **Ask Questions**
   - Type your question in the chat interface
   - Use voice input (microphone button) for speech-to-text
   - Press Enter or click Send
   - View Sera's warm, AI-generated answers with sources

3. **Voice Features**
   - Click the microphone to start voice input (Chrome/Edge/Safari)
   - Click the speaker icon to hear responses read aloud
   - Female voice selection for natural conversation

4. **Review Sources**
   - Click on source citations below answers
   - View the exact text chunks used
   - Check similarity scores

5. **Dark Mode**
   - Toggle between light and dark themes
   - Preference saved in browser storage

## 🔄 API Endpoints

### Core Endpoints

- `GET /` - Root endpoint with app status
- `POST /api/upload` - Upload and process documents (single file)
- `POST /api/query` - Query the knowledge base with optional AI generation
- `GET /api/status` - Get vector store statistics
- `DELETE /api/clear` - Clear all documents from vector store

### API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Query Parameters

- `query` (string): Your question
- `top_k` (int, optional): Number of relevant chunks to retrieve (default: 5)
- `use_generation` (bool, optional): Enable AI response generation (default: true)

## 🐛 Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Ensure your `.env` file contains a valid `GEMINI_API_KEY`
   - Restart the backend service after adding the key

2. **File upload fails**
   - Check file size (max 10MB by default)
   - Verify file format is supported
   - Ensure backend is running

3. **No results returned**
   - Upload relevant documents first
   - Try more specific queries
   - Check if documents were processed successfully

### Performance Tips

- For large documents, increase `CHUNK_SIZE` in configuration
- Adjust `TOP_K_RESULTS` for more/fewer sources
- Use Docker for consistent environment
- Voice features work best in Chrome, Edge, or Safari
- Multi-file uploads process sequentially to avoid server overload

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Google Gemini 2.5 Flash for generative AI capabilities
- Sentence Transformers for embeddings
- FAISS for efficient vector search
- React and Tailwind CSS for the modern UI
- Framer Motion for smooth animations
- Web Speech API for voice features

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

