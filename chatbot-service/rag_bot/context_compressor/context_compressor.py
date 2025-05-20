# rag_bot/model/compressor.py
from langchain_core.documents import Document
from typing import List, Tuple
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

class ContextualCompressor:
    def __init__(self, model_name="mixedbread-ai/mxbai-rerank-xsmall-v1"):
        self.cross_encoder = HuggingFaceCrossEncoder(model_name)

    def compress(self, query: str, documents: List[Document], max_chunks_per_doc: int = 3) -> List[Document]:
        compressed_documents = []

        for doc in documents:
            chunks = [c.strip() for c in doc.page_content.split(".") if c.strip() != ""]
            if not chunks:
                continue

            pairs = [(query, chunk) for chunk in chunks]
            scores = self.cross_encoder.score(pairs)

            scored_chunks = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)[:max_chunks_per_doc]
            compressed_text = ". ".join([chunk for chunk, score in scored_chunks])

            compressed_documents.append(Document(page_content=compressed_text, metadata=doc.metadata))

        return compressed_documents
