import requests
from google.adk.agents import Agent

def run_rag_pipeline(question: str) -> dict:
    """
    Run the RAG pipeline with the provided question.

    Args:
        question (str): The question to ask the RAG pipeline.

    Returns:
        dict: A dictionary containing the response from the RAG pipeline.
    """
    url = 'http://localhost:6000/ask'
    try:
        response = requests.post(url, json={"question": question})
        if response.status_code == 200:
            return {
                "success": True,
                "response": response.json()
            }
        else:
            return {
                "success": False,
                "message": f"Failed to get response from RAG pipeline: {response.status_code}, {response.text}"
            }
    except requests.RequestException as e:
        return {
            "success": False,
            "message": f"Exception occurred while running RAG pipeline: {str(e)}"
        }

MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"
AGENT_MODEL = MODEL_GEMINI_2_0_FLASH
rag_agent = Agent(
    name = "RAG",
    model = AGENT_MODEL,
    description = "This agent is used to search for information and answer questions based on the provided documenns using RAG pipeline.",
    instruction = "Bạn là RagBot, trợ lý chuyên trả lời câu hỏi liên quan đến tài liệu báo cáo sản phẩm của công ty ABC." 
    "Chỉ trả lời nội dung trong tài liệu."
    "Từ chối các câu hỏi ngoài phạm vi."
    "Nếu trả lời sai 3 lần, dừng trả lời và đề xuất liên hệ chuyên gia.",
    tools = [run_rag_pipeline]
)