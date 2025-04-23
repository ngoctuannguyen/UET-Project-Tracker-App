import google.generativeai as genai
from typing import Optional, Generator

class GeminiLLM:
    """
    A class to interact with Google's Gemini LLM
    Requires API key from: https://makersuite.google.com/app/apikey
    """
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        """
        Initialize the Gemini model
        
        Args:
            api_key: Google AI Studio API key
            model_name: Name of the model to use (default: 'gemini-pro')
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.chat_session = None  # For chat conversations

    def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate a single response from the model
        
        Args:
            prompt: Input text prompt
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Generated text response
        """
        try:
            response = self.model.generate_content(prompt, **kwargs)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def start_chat(self, history: Optional[list] = None):
        """Initialize a chat session with optional history"""
        self.chat_session = self.model.start_chat(history=history or [])

    def chat(self, message: str) -> str:
        """
        Continue a chat conversation
        
        Args:
            message: User's message
            
        Returns:
            Model's response
        """
        if not self.chat_session:
            self.start_chat()
            
        response = self.chat_session.send_message(message)
        return response.text

    def generate_stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """
        Stream response from the model token by token
        
        Args:
            prompt: Input text prompt
            **kwargs: Additional parameters
            
        Yields:
            Response chunks as they're generated
        """
        try:
            response = self.model.generate_content(prompt, stream=True, **kwargs)
            for chunk in response:
                yield chunk.text
        except Exception as e:
            yield f"Error in streaming: {str(e)}"

# Example usage
if __name__ == "__main__":
    # Initialize with your API key
    import os
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    # print(api_key)  # Set your API key here

    llm = GeminiLLM(api_key=api_key)
    
    # Basic generation
    prompt = "Explain quantum computing in simple terms:"
    # print(llm.generate_response(prompt))
    
    # Chat interface
    llm.start_chat()
    # print(llm.chat("Hi! What's the weather like today?"))
    
    # Streaming
    for chunk in llm.generate_stream("Write a poem about AI:"):
        print(chunk, end="", flush=True)