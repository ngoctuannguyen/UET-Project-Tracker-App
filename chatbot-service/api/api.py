from rag_bot.rag import rag_pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_bot.utils.data_loader.load_document import agentic_chunk,embedding_model,sparse_model,qdrant_store
from langchain_community.document_loaders import PyPDFLoader
import tempfile
from werkzeug.utils import secure_filename
app = Flask(__name__)

CORS(app)  # Enable CORS for all routes
@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()  # Get JSON data from the body
    question = data.get('question')  # Extract the 'question' parameter
    
    if not question:
        return jsonify({"error": "Missing 'question' parameter"}), 400

    result = rag_pipeline.generate_response(question)
    return jsonify({
        "response": result
    })

@app.route('/add_pdf_data', methods=['POST'])
def add_pdf_data():
    file = request.files['file']
    if not file or not file.filename.endswith('.pdf'):
        return jsonify({"error": "Invalid file format. Only PDF files are supported."}), 400
    try:
       # Tạo tên file an toàn
        filename = secure_filename(file.filename)

        # Tạo file tạm có hậu tố .pdf, tự động tương thích với hệ điều hành
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            temp_file_path = tmp.name
        # Load PDF and chunk it using Gemini
        loader = PyPDFLoader(temp_file_path)
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = filename

        all_chunks = []
        for doc in docs:
            chunks = agentic_chunk(doc)
            all_chunks.extend(chunks)

        # Store chunks in Qdrant
        qdrant_store.add_documents(all_chunks)

        return jsonify({"message": f"Successfully processed and stored {len(all_chunks)} chunks."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['POST'])
def test():
    return {"message": "Test endpoint works!"}, 200

if __name__ == '__main__':
    app.run(debug=True, port=6000)

# from pydantic import BaseModel
# from typing import Dict
# from fastapi.responses import JSONResponse
# from rag_bot.rag import RAGPipeline
# from api_router import router

# # Initialize FastAPI ap
# # Define request and response models
# class ChatRequest(BaseModel):
#     question: str

# # Mock chatbot logic (replace with your chatbot logic
# # Define API endpoints
# @router.post("/chat", response_model=ChatRequest)
# async def chat(request: ChatRequest):
#     """
#     Endpoint to handle user messages and return chatbot responses.
#     """
#     try:
#         bot_response = chatbot_logic(request.user_message)
#         return ChatRequest(bot_response=bot_response)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
    
# @router.get("/add_pdf_data")


