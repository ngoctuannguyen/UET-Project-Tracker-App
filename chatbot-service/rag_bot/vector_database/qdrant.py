from langchain_community.vectorstores import Qdrant  # Updated import path
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from langchain_core.documents import Document
from typing import List
from dotenv import load_dotenv
import os
# from rag_bot.model.embedding import Embedding
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from qdrant_client import models
from qdrant_client.models import SparseVectorParams, SparseVectorsConfig
from functools import lru_cache
from fastembed import SparseTextEmbedding


class QdrantVectorStore:
    def __init__(self, collection_name: str, embeddings = None, sparse_embeddings: SparseTextEmbedding = None):
        """
        Initialize the Qdrant vector store.
        :param embeddings: Embedding function to generate vector representations.
        :param collection_name: Name of the Qdrant collection.
        :param host: Qdrant server host (default: localhost).
        :param port: Qdrant server port (default: 6333).
        """
        load_dotenv()
        self.url = os.environ.get("QDRANT_CLIENT_URL")
        api_key = os.environ.get("QDRANT_API_KEY")
        self.embeddings = embeddings
        self.sparse_embeddings = sparse_embeddings
        self.collection_name = collection_name
        self.client = QdrantClient(url=self.url, api_key=api_key, timeout=60)  # Use gRPC for better performance
        # self.client = QdrantClient("http://localhost:6333")  # Use gRPC for better performance
        self.embedding_dimension = len(self.embeddings.embed_query("test"))
        # Ensure the collection exists
        if not self.client.collection_exists(self.collection_name):
            self._create_collection()
    
    def _create_collection(self):
        """Create collection if it doesn't exist"""
        from qdrant_client.http.exceptions import UnexpectedResponse
        
        try:
            collection_info = self.client.get_collection(self.collection_name)
            current_dim = collection_info.config.params.vectors.size
            if current_dim != self.embedding_dimension:
                raise ValueError(f"Existing collection has different dimension {current_dim} "
                                 f"vs new model dimension {self.embedding_dimension}")
        except (UnexpectedResponse, ValueError):
             self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE,  # Use cosine distance for similarity search
                    )
                },
                sparse_vectors_config={
                    "bm42": SparseVectorParams(
                        modifier=models.Modifier.IDF
                    )
                }
        )

    def get_client(self):
        """
        Get the Qdrant client.
        :return: Qdrant client.
        """
        return self.client

    def add_documents(self, documents: List[Document]):
        """
        Add documents to the Qdrant vector store.
        :param documents: List of LangChain Document objects.
        """
        points = []

        for i, doc in enumerate(documents):
            # Dense embedding
            dense_vec = self.embeddings.embed_query(doc.page_content)

            # print(dense_vec)

            # Sparse embedding (BM42)
            sparse = list(self.sparse_embeddings.embed([doc.page_content]))[0]
            sparse_vec = models.SparseVector(
                values=sparse.values.tolist(),
                indices=sparse.indices.tolist(),
            )

            # Build point
            points.append(
                models.PointStruct(
                    id=i,
                    vector={
                        "dense": dense_vec,
                        "bm42": sparse_vec,
                    },
                    payload={
                        "text": doc.page_content,
                        "source": doc.metadata.get("source", "unknown"),
                    },
                )
            )

        # Upsert to Qdrant
        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )


    # def get_relevant_documents(self, query: str, score_threshold: float = 0.5, k: int = 3) -> List[Document]:
    #     """
    #     Retrieve relevant documents using the Qdrant retriever.
    #     :param query: Query string to search for.
    #     :param score_threshold: Minimum similarity score for retrieval.
    #     :param k: Number of top results to return.
    #     :return: List of relevant documents.
    #     """

    #     query_vector = self.embeddings.embed_query(query)
    #     sparse_query = self.sparse_embeddings.embed([query])[0]

    #     # Get the retriever
    #     retriever = self.client.get_retriever(
    #         collection_name=self.collection_name,
    #         query_vector=query_vector,
    #         distance=Distance.COSINE,
    #         limit=k,
    #         score_threshold=score_threshold,
    #         with_payload=True,
    #     )

    #     # Perform the search
    #     results = retriever.query(
    #         query_vector=query_vector,
    #         distance=Distance.COSINE,
    #         limit=k,
    #         score_threshold=score_threshold,
    #     )

    #     # Extract the document number, score, and text from the payload of each scored point
    #     documents = [
    #         Document(
    #             page_content=result.payload["text"],
    #             metadata={"source": result.payload.get("source", "unknown")}
    #         )
    #         for result in results.points
    #     ]

    #     return documents


if __name__ == "__main__":
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain_core.documents import Document

    # Example documents
    texts = [
        "LangChain is a framework for building LLM-powered applications.",
        "Qdrant is a vector database for storing embeddings.",
        "RAG combines retrieval and generation for better answers.",
    ]
    metadata = [{"source": f"doc{i+1}"} for i in range(len(texts))]
    documents = [Document(page_content=text, metadata=meta) for text, meta in zip(texts, metadata)]

    # Initialize Qdrant vector store
    qdrant_store = QdrantVectorStore(collection_name="my_collection")

    # Add documents to Qdrant
    qdrant_store.add_documents(documents)

    # Perform a search
    query = "What is LangChain?"
    results = qdrant_store.get_relevant_documents(query, score_threshold=0.5, k=3)

    # Print results
    for result in results:
        print(f"Content: {result.page_content}, Metadata: {result.metadata}")