import torch
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

class Embedding:
    def __init__(self):
        self.embedidng = None
    def get_embeddings(self):
        self.embedidng = HuggingFaceBgeEmbeddings(
            model_name="BAAI/bge-m3",  # Model name
            encode_kwargs={"normalize_embeddings": True},  # Normalize embeddings
        )
        return self.embedidng
    
