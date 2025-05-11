from multi_agent.agent import root_agent
import asyncio
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types # For creating message Content/Parts
import os
from fastapi import FastAPI,File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file
# @title Setup Session Service and Runner
from main import db
from uuid import uuid4
from pydantic import BaseModel
from firebase_admin import  firestore
from fastapi.middleware.cors import CORSMiddleware
import requests
# --- Session Management ---
# Key Concept: SessionService stores conversation history & state.
# InMemorySessionService is simple, non-persistent storage for this tutorial.
session_service = InMemorySessionService()

# Define constants for identifying the interaction context
APP_NAME = "report_rag_agent" # Name of the application
USER_ID = "user_1"
SESSION_ID = "session_001" # Using a fixed ID for simplicity


def create_or_get_session(session_service: InMemorySessionService, app_name: str, user_id: str, session_id: str):
    session = session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id
    )

    # Check if Firestore session doc exists
    session_ref = db.collection("chatbot_service").document(session_id)
    if not session_ref.get().exists:
        session_ref.set({
            "user_id": user_id,
            "created_at": firestore.SERVER_TIMESTAMP
        })

    return session

# --- Runner ---
# Key Concept: Runner orchestrates the agent execution loop.
runner = Runner(
    agent=root_agent, # The agent we want to run
    app_name=APP_NAME,   # Associates runs with our app
    session_service=session_service # Uses our session manager
)

print(f"Runner created for agent '{runner.agent.name}'.")

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

# MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; use exact origin in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class QueryRequest(BaseModel):
    query: str
    session_id: str | None = None

@app.post("/question")
async def call_agent_async(request: QueryRequest):
    session_id = request.session_id or str(uuid4())
    query = request.query

    # Create a new session if not already present
    session = create_or_get_session(session_service, APP_NAME, USER_ID, session_id)

    content = types.Content(role='user', parts=[types.Part(text=query)])
    final_response_text = "Agent did not produce a final response."

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=session_id,
        new_message=content
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif event.actions and event.actions.escalate:
                final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
            break

    # Store conversation to Firebase Firestore
    # Store user query
    db.collection("chatbot_service").document(session_id).collection("messages").add({
        "role": "user",
        "text": query,
        "timestamp": firestore.SERVER_TIMESTAMP
    })
    # Create or update session document with metadata
    db.collection("chatbot_service").document(session_id).set({
        "user_id": USER_ID,
        "created_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)  
    # Store agent response
    db.collection("chatbot_service").document(session_id).collection("messages").add({
        "role": "agent",
        "text": final_response_text,
        "timestamp": firestore.SERVER_TIMESTAMP
    })

    return {"session_id": session_id, "response": final_response_text}

@app.get("/chatbot_service")
async def get_all_sessions():
    sessions_ref = db.collection("chatbot_service")
    sessions = sessions_ref.stream()
    session_list = []

    for session in sessions:
        session_id = session.id
        messages_ref = db.collection("chatbot_service").document(session_id).collection("messages")
        messages_query = messages_ref.order_by("timestamp").limit(1).stream()

        first_message_text = "No messages"
        for msg in messages_query:
            msg_data = msg.to_dict()
            first_message_text = msg_data.get("text", "No text")

        session_list.append({
            "id": session_id,
            "title": first_message_text
        })

    return session_list

@app.get("/chatbot_service/{session_id}/messages")
async def get_session_messages(session_id: str):
    messages_ref = db.collection("chatbot_service").document(session_id).collection("messages")
    messages = messages_ref.order_by("timestamp").stream()
    return [msg.to_dict() for msg in messages]

@app.post("/upload_pdf")
async def upload_file(file: UploadFile = File(...)):
    API_URL = "http://127.0.0.1:6000/add_pdf_data"
    try:
        # Tạo form data để gửi file
        form_data = {'file': (file.filename, file.file, file.content_type)}

        # Gửi tệp tới API Flask
        response = requests.post(API_URL, files=form_data)

        # Kiểm tra phản hồi từ API Flask
        if response.status_code == 200:
            return {"message": "File uploaded successfully", "data": response.json()}
        else:
            return JSONResponse(status_code=response.status_code, content={"error": "Failed to upload file to Flask API"})

    except requests.exceptions.RequestException as e:
        # Trả về lỗi nếu có vấn đề khi gọi API Flask
        return JSONResponse(status_code=500, content={"error": f"Error while calling Flask API: {str(e)}"})
