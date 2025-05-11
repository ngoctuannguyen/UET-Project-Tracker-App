from langchain_community.cross_encoders import HuggingFaceCrossEncoder
import os
from functools import lru_cache
import time

class ReRanker:
    def __init__(self):
        self.reranker = None

    def get_reranker(self):
        os.environ["HUGGINGFACE_HUB_TOKEN"] = "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"  # Disable parallelism for tokenizers to avoid warning
        self.reranker = HuggingFaceCrossEncoder(
            model_name="BAAI/bge-reranker-base",
            model_kwargs={"trust_remote_code": True, 
                          "device": "cpu"})
        return self.reranker
    
if __name__ == "__main__":
    start_time = time.time()
    reranker = ReRanker()
    reranker_model = reranker.get_reranker()
    end_time = time.time()
    print(f"Reranker model loaded in {end_time - start_time:.2f} seconds")