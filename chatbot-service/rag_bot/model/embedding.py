import torch
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
import os
from functools import lru_cache
from fastembed import SparseTextEmbedding
import time

class Embedding:
    def __init__(self):
        self.embedidng = None
    
    def get_embeddings(self):
        os.environ["HUGGINGFACE_HUB_TOKEN"] = "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"  # Disable parallelism for tokenizers to avoid warning
        self.embedidng = HuggingFaceBgeEmbeddings(
            model_name="BAAI/bge-small-en-v1.5",  # Model name
            # cache_folder=os.path.join(os.path.abspath("."), "rag_bot\model\hub"),  # Path to the cache folder
            encode_kwargs={"normalize_embeddings": True},  # Normalize embeddings
            model_kwargs={"trust_remote_code": True, "device": "cpu"},  # Set device to cuda if available and trust remote code
        )
        return self.embedidng
    
    def get_sparse_embeddings(self):
        self.sparse_embedding = SparseTextEmbedding(model_name="Qdrant/bm42-all-minilm-l6-v2-attentions")
        return self.sparse_embedding
    
if __name__ == "__main__":
    start_time = time.time()
    embedding = Embedding()
    embed_model = embedding.get_embeddings()
    end_time = time.time()
    # print(os.path.join(os.path.abspath("."), "rag_bot\model\hub"))
    print(f"Embedding model loaded in {end_time - start_time:.2f} seconds")