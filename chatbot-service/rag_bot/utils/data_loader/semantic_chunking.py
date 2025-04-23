from langchain_experimental.text_splitter import SemanticChunker
from typing import List
from langchain_core.documents import Document
from rag_bot.model.embedding import Embedding

class SemanticChunking:
    def __init__(self, 
                 embedding,
                 breakpoint_threshold_type="standard_deviation"):
        self.chunker = SemanticChunker(embeddings=embedding, 
                                       breakpoint_threshold_type=breakpoint_threshold_type,
                                       breakpoint_threshold_amount=100,
                                       number_of_chunks=200)  # Ngưỡng quyết định điểm chia
        
    def chunk(self, documents: List[Document]):
        """Chunk documents using semantic chunking.
        
        Args:
            documents (List[Document]): List of documents to be chunked.
        
        Returns:
            List[Document]: List of chunked documents.
        """
        return self.chunker.split_documents(documents)
    
    def transform_documents(self, documents: List[Document]):
        """Transform documents using semantic chunking.
        
        Args:
            documents (List[Document]): List of documents to be transformed.
        
        Returns:
            List[Document]: List of transformed documents.
        """
        return self.chunker.transform_documents(documents)
    
if __name__ == "__main__":
    texts=[
            "Self-driving cars use AI for navigation. Hello chào các bạn, tôi là người Việt Nam",
            "Electric vehicles reduce carbon emissions",
            "N",
        ]
    metadata=[
            {"source": "doc1"},
            {"source": "doc2"},
            {"source": "doc3"},
        ]

    docs = [Document(page_content=text, metadata=meta) for text, meta in zip(texts, metadata)]
    embeddings = Embedding().get_embeddings()
    semantic_chunker = SemanticChunking(embeddings)
    results = semantic_chunker.chunk(docs)
    print(results)