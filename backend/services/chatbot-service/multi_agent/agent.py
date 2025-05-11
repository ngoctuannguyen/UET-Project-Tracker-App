import requests
from google.adk.agents import Agent
# @title Import necessary libraries
from google.adk.agents import Agent
import requests

def get_reports_by_productCode(productCode: int) -> dict:
    """
    Fetches all reports from the API for a specific productCode.

    Args:
        productCode (int): The product code to fetch reports for.

    Returns:
        dict: A dictionary containing success status, message, and reports (if successful).
    """
    url = f'http://localhost:3000/api/reports/{productCode}'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return {
                "success": True,
                "reports": response.json()
            }
        else:
            return {
                "success": False,
                "message": f"Failed to fetch reports: {response.status_code}, {response.text}"
            }
    except requests.RequestException as e:
        return {
            "success": False,
            "message": f"Exception occurred while fetching reports: {str(e)}"
        }


import requests

def send_reports(image_path: str, content: str) -> dict:
    """
    Send a report with an image to the API.

    Args:
        image_path (str): The local path to the image file.
        content (str): The content of the report.

    Returns:
        dict: A dictionary containing success status and the server response.
    """
    url = 'http://localhost:3000/api/scan-and-report'
    try:
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            data = {
                'content': content,
                'reportText': content
            }
            response = requests.post(url, files=files, data=data)

        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False,
                "message": f"Failed to send report: {response.status_code}, {response.text}"
            }
    except FileNotFoundError:
        return {
            "success": False,
            "message": "Image file not found."
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "message": f"Request failed: {str(e)}"
        }

            
import requests

def send_report_without_image(barcode: int, content: str) -> dict:
    """
    Send report without image to the API.

    Args:
        barcode (int): The barcode of the product.
        content (str): The content of the report.

    Returns:
        dict: The response from the API.
    """
    url = 'http://localhost:3000/api/submit-report'
    try:
        response = requests.post(url, json={'barcode': barcode, 'reportText': content})

        if response.status_code == 200:
            return response.json()
        else:
            # Nếu lỗi thì trả thành 1 dict phẳng, không dùng set
            return {
                "success": False,
                "message": f"Failed to send report: {response.text}"
            }

    except Exception as e:
        # Bắt exception trường hợp lỗi mạng, API chết,...
        return {
            "success": False,
            "message": f"Exception occurred: {str(e)}"
        }

def get_employees_performance(employee_id: int) -> dict:
    """
    Fetches employee performance data from the API.

    Args:
        employee_id (int): The ID of the employee.

    Returns:
        dict: A dictionary containing success status and performance data (if successful).
    """
    url = f'http://localhost:3000/api/reports/employee/{employee_id}'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return {
                "success": True,
                "performance": response.json()
            }
        else:
            return {
                "success": False,
                "message": f"Failed to fetch performance data: {response.status_code}, {response.text}"
            }
    except requests.RequestException as e:
        return {
            "success": False,
            "message": f"Exception occurred while fetching performance data: {str(e)}"
        }
         
        
MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"
# @title Define the Weather Agent
# Use one of the model constants defined earlier
AGENT_MODEL = MODEL_GEMINI_2_0_FLASH # Starting with Gemini
root_agent = Agent(
    name="report",
    model=AGENT_MODEL, # Can be a string for Gemini or a LiteLlm object
    description="Provides users with report servies.",
    instruction="You are a helpful report assistant of ABC company. "
                "You must always be polite and helpful. "
                "You must make sure user provides necessary information before using the tools. "
                "You must get user confirmation one last time before using the tools"
                "When the user asks for reports of a spefict product, "
                "use the 'get_report_tool' tool to find the information. "
                "If the tool returns an error, inform the user politely. "
                "If the tool is successful, present the report cleary."
                "If the user ask for spefic info of report try to answer based on what you just got"
                "When the users ask to submit a new report, simply return the result annoucment"
                "If the user ask to submit a report without image, use the 'send_report_without_image' tool.",
    tools=[get_reports_by_productCode,send_reports,send_report_without_image,get_employees_performance], # Pass the function directly
)


