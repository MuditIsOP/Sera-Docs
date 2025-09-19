import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.core.config import settings


class GenerationService:
    """
    A service for generating responses using the Google Gemini API.

    This class encapsulates the logic for interacting with the generative model,
    including prompt engineering to give the AI a specific personality ("Sera").
    """
    
    def __init__(self):
        """
        Initializes the GenerationService.

        Configures the Google Generative AI client with the API key from settings.
        If the API key is not provided, the model is not initialized, and a
        warning is printed.
        """
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
        """
        Generates an AI response based on a query and context.

        This method constructs a detailed prompt, sends it to the Gemini API,
        and returns the generated text. It handles cases where the API key
        is not configured or an error occurs during generation.

        Args:
            query (str): The user's query.
            context_chunks (List[Dict[str, Any]]): A list of context chunks
                                                   retrieved from the vector store.
            max_tokens (int): The maximum number of tokens for the response.

        Returns:
            str: The AI-generated response, or an error message.
        """
        
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
        """
        Formats a list of context chunks into a single string for the prompt.

        Args:
            chunks (List[Dict[str, Any]]): A list of document chunks.

        Returns:
            str: A formatted string containing the content of all chunks,
                 each with a source citation.
        """
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
        """
        Creates the final prompt string to be sent to the Gemini model.

        This includes the persona, instructions, context, and the user query.

        Args:
            query (str): The user's question.
            context (str): The formatted context string.

        Returns:
            str: The complete prompt for the language model.
        """
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


# Global instance of the generation service.
generation_service = GenerationService()