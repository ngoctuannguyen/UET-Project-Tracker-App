from google.adk.evaluation.agent_evaluator import AgentEvaluator

def test_with_single_test_file():
    """Test the agent's basic ability via a session file."""
    AgentEvaluator.evaluate(
        agent_module="multi_agent",
        eval_dataset_file_path_or_dir="C:/Users/ADMIN\Documents/code/UET-Project-Tracker-App/chatbot-service/multi_agent/evalseta9aa6f.evalset.json",
    )