from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
from fastapi.responses import JSONResponse
from rag_bot.rag import RAGPipeline
from api_router import router

# Initialize FastAPI ap
# Define request and response models
class ChatRequest(BaseModel):
    question: str

# Mock chatbot logic (replace with your chatbot logic
# Define API endpoints
@router.post("/chat", response_model=ChatRequest)
async def chat(request: ChatRequest):
    """
    Endpoint to handle user messages and return chatbot responses.
    """
    try:
        bot_response = chatbot_logic(request.user_message)
        return ChatRequest(bot_response=bot_response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/add_pdf_data")


