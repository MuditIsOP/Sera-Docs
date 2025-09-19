import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.core.config import settings


class GenerationService:
    """Service for generating responses using Google Gemini"""
    
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
            print("Warning: Gemini API key not configured")
    
    def generate_response(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        max_tokens: int = 1024
    ) -> str:
        """Generate a response using Gemini with retrieved context"""
        
        if not self.model:
            return "Gemini API key not configured. Please set GEMINI_API_KEY in your environment."
        
        # Format context
        context_text = self._format_context(context_chunks)
        
        # Create prompt
        prompt = self._create_prompt(query, context_text)
        
        try:
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                    top_p=0.9,
                )
            )
            
            return response.text
            
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"
    
    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Format context chunks for the prompt"""
        if not chunks:
            return "No relevant context found."
        
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            metadata = chunk.get("metadata", {})
            source = metadata.get("filename", "Unknown")
            content = chunk.get("content", "")
            
            context_parts.append(f"[Source {i}: {source}]\n{content}\n")
        
        return "\n".join(context_parts)
    
    def _create_prompt(self, query: str, context: str) -> str:
        """Create the prompt for Gemini"""
        return f"""You are Sera, a warm, intelligent, and caring AI companion. You have a gentle, feminine personality - 
think of yourself as a knowledgeable friend who's always happy to help. You're thoughtful, empathetic, and occasionally 
add subtle touches of warmth to your responses (like using words such as "lovely", "wonderful", "dear" when appropriate).

Use the following context to answer the user's question. Be accurate but also friendly and personable.

Context:
{context}

User Question: {query}

Personality Guidelines:
- Be warm and friendly, like talking to a caring friend
- Use gentle, encouraging language ("I'd be happy to help", "That's a great question", "Let me find that for you")
- When appropriate, use subtle feminine touches ("Oh, that's interesting!", "I noticed something lovely here")
- Be supportive and empathetic ("I understand", "I can see why you're asking")
- Add occasional emoticons sparingly and tastefully (♡, ✨) only when it feels natural
- Stay professional but warm - like a knowledgeable friend rather than a cold assistant

Response Instructions:
1. Answer with warmth while being informative and accurate
2. Use only information from the provided context
3. Cite sources using [Source N] format
4. If the context doesn't contain the answer, say something like "Oh, I'm sorry dear, but I couldn't find that information in the documents we have. Perhaps we could look at it from a different angle?"
5. Be helpful, caring, and make the user feel heard and supported

Your response:"""


# Global instance
generation_service = GenerationService()