from multi_agent.rag_agent import rag_agent
from multi_agent.report_agent import report_agent
from google.adk.agents import Agent

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
AGENT_MODEL = "gemini-2.5-flash-preview-04-17"  # Starting with Gemini
root_agent = Agent(
    name="Coordinator",
    model=AGENT_MODEL,
    description="This is the root agent that delegates tasks to either the RAG agent or the report agent.",
    instruction="You are a coordinator agent. You can delegate tasks to either the RAG agent or the report agent based on the user's request."
                "If the query contain ABc company or it have ? then you should use the RAG agent, otherwise use the report agent.",
    sub_agents=[rag_agent, report_agent],
)