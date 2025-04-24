import google.generativeai as genai
from typing import Optional, Generator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

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
        self.model = ChatGoogleGenerativeAI(model=model_name,
                                            streaming=True,
                                            callbacks=[StreamingStdOutCallbackHandler()],
                                            temperature=0.5,
                                            max_output_tokens=512,
                                            api_key=api_key)
        
        self.chat_session = None  # For chat conversations
    def get_llm(self) -> ChatGoogleGenerativeAI:
        """Get the LLM instance"""
        return self.model

    def start_chat(self):   
        """Start a chat session"""
        self.chat_session = self.model.start_chat()
        return self.chat_session
    
    def chat(self, message: str) -> str:
        """Send a message to the chat session and get a response"""
        if self.chat_session is None:
            raise ValueError("Chat session not started. Call start_chat() first.")
        
        response = self.chat_session.send_message(message)
        return response.text
    
    def generate_response(self, prompt: str) -> str:
        """Generate a response from the LLM"""
        return self.model.generate_text(prompt)
    
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        """Generate a response from the LLM in a streaming manner"""
        return self.model.generate_text(prompt, as_stream=True)
    

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