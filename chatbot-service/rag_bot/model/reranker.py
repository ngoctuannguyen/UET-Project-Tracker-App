from langchain_community.cross_encoders import HuggingFaceCrossEncoder

class ReRanker:
    def __init__(self):
        self.reranker = None

    def get_reranker(self):
        self.reranker = HuggingFaceCrossEncoder(
            model_name="BAAI/bge-reranker-base",  # Model name
            model_kwargs={"trust_remote_code": True},  # Set device to cuda if available and trust remote code
        )
