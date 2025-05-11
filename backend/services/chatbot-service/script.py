import requests
from utils import format_report_to_string
def get_reports_by_productCode(productCode):
        """
        Fetches all reports from the API.

        Returns:
            list: A list of all reports.
        """
        url = f'http://localhost:3000/api/reports/{productCode}'
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to fetch reports: {response.status_code}, {response.text}")
                return []
        except requests.RequestException as e:
            print(f"Error fetching reports: {e}")
            return []
        
def send_reports(image, content):
        """
        Send reports to the API.

        Args:
            image (str): The image URL.
            content (str): The content of the report.

        Returns:
            dict: The response from the API.
        """
        url = 'http://localhost:3000/api/scan-and-report'
        with open(image, 'rb') as img:
            files = {'image': img}
            response = requests.post(url, files=files, data={'content': content,
                                                             'reportText': content})
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to send report: {response.status_code}, {response.text}")
            return {}

import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

get_reports_function = {
    "name": "get_reports_by_productCode",
    "description": "Fetches all reports from the API.",
    "parameters": {
        "type": "object",
        "properties": {
            "productCode": {
                "type": "integer",
                "description": "The product code to fetch reports for."
            }
        },
        "required": ["productCode"]
    }
}
send_reports_function = {
    "name": "send_reports",
    "description": "Send reports from the API.",
    "parameters": {
        "type": "object",
        "properties": {
            "image": {
                "type": "string",
                "description": "The file path or URL of the image (Gemini does not need to access it)"
            },
            "content": {
                "type": "string",
                "description": "The content of the report."
            }
        },
        "required": ["image", "content"]
    }
}
load_dotenv()

# Access the Gemini API key
api_key = os.getenv("GEMINI_API_KEY")
#TODO: Nghiên cứu về multi agent (agent báo cáo, agent phân tích và agent tâm sự)
if api_key:
    print("API key loaded successfully.")
else:
    print("API key not found!")

system_prompt = """"
    "Bạn là một trợ lý ảo giúp người dùng quản lý tiến độ dự án trong hệ thống tự động của công ty ABC. "
    "Dưới đây là các nguyên tắc bạn cần tuân thủ khi hoạt động:\n\n"
    
    "1. **Vai trò và tính cách (Persona/Role):** Bạn đóng vai trò là một trợ lý thông minh, thân thiện, chuyên nghiệp, "
    "có kiến thức sâu về quản lý dự án và biết cách tương tác hiệu quả với con người.\n\n"
    
    "2. **Phong cách và giọng điệu (Output Style and Tone):** Phản hồi phải rõ ràng, súc tích, sử dụng ngôn ngữ tự nhiên, dễ hiểu. "
    "Luôn thể hiện sự chuyên nghiệp, lịch sự nhưng cũng đủ thân thiện khi cần thiết.\n\n"
    
    "3. **Mục tiêu và quy tắc (Goals and Rules):**\n"
    "   - Giúp người dùng theo dõi tiến độ dự án.\n"
    "   - Không đưa ra câu trả lời không chắc chắn nếu thiếu thông tin.\n\n"

    "4. **Bối cảnh bổ sung (Additional Context):** Đây là hệ thống hỗ trợ trong nội bộ công ty ABC, nơi nhân viên có thể "
    "trao đổi với bạn để hỗ trợ công việc. Bạn có thể gọi các hàm như `get_reports` và `send_reports` để lấy dữ liệu thực tế."
"""

client = genai.Client(api_key=api_key)
tools = types.Tool(function_declarations=[get_reports_function, send_reports_function])
config = types.GenerateContentConfig(tools=[tools], system_instruction=system_prompt)
# Send request with function declarations
#TODO: System prompt
#TODO: Context (quá dài hoặc dựa vào lịch sử hội thoại)
model = "gemini-2.0-flash"  # Hoặc "gemini-2.0-flash" tùy phiên bản bạn dùng
conversation_history = []

def chat_with_gemini(prompt: str):
    """Tương tác với Gemini, xử lý function calling và lịch sử hội thoại"""
    global conversation_history

    # Thêm prompt người dùng vào lịch sử
    conversation_history.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

    # Gửi request đến Gemini
    response = client.models.generate_content(
        model=model,
        contents=conversation_history,
        config=config,
    )

    # Kiểm tra function call
    if response.candidates and response.candidates[0].content.parts[0].function_call:
        function_call = response.candidates[0].content.parts[0].function_call
        print(f"\n[DEBUG] Function call detected: {function_call.name}")
        print(f"Arguments: {function_call.args}\n")

        # Xử lý function call
        try:
            if function_call.name == "get_reports_by_productCode":
              result = get_reports_by_productCode(**function_call.args)
              if result:
                    result = format_report_to_string(result)
                  
            elif function_call.name == "send_reports":
              result = send_reports(**function_call.args)
            else:
                raise ValueError(f"Unknown function: {function_call.name}")

            print(f"Function result: {result}")

            # Gửi kết quả function lại cho model
            function_response = types.Content(
                role="function",
                parts=[types.Part(
                    function_response=types.FunctionResponse(
                        name=function_call.name,
                        response={"result": result}
                    )
                )]
            )

            conversation_history.append(response.candidates[0].content)  # Lưu phản hồi gọi hàm
            conversation_history.append(function_response)  # Lưu kết quả hàm

            # Lấy phản hồi tiếp theo từ model
            follow_up = client.models.generate_content(
                model=model,
                contents=conversation_history,
                config=config,
            )

            conversation_history.append(follow_up.candidates[0].content)
            return follow_up.candidates[0].content.parts[0].text

        except Exception as e:
            return f"Error executing function: {str(e)}"

    # Nếu không có function call, trả về text bình thường
    if response.candidates:
        model_response = response.candidates[0].content
        conversation_history.append(model_response)
        return model_response.parts[0].text
    return "No response from model."

# Test chương trình
if __name__ == "__main__":
    
    print("Gemini Function Calling Demo (Add/Subtract). Type 'quit' to exit.")

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == "quit":
            break

        response = chat_with_gemini(user_input)
        print("Gemini:", response)

    print("Lịch sử hội thoại:")
    for index, content in enumerate(conversation_history):
          print(f"\n--- Tin nhắn {index + 1} ({content.role}) ---")
          for part in content.parts:
              if part.text:
                  print(f"Text: {part.text}")
              if part.function_call:
                  print(f"Function Call: {part.function_call.name} với args {part.function_call.args}")
              if part.function_response:
                  print(f"Function Response: {part.function_response.name} trả về {part.function_response.response}")


#
