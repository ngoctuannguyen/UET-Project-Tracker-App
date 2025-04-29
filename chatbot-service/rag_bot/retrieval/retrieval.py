from rag_bot.model.reranker import ReRanker
from rag_bot.model.embedding import Embedding
from rag_bot.vector_database.qdrant import QdrantVectorStore
from langchain_core.documents import Document
from langchain.schema.runnable import Runnable
from typing import List, Union
import time
from qdrant_client import models
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.schema.retriever import BaseRetriever
    
class HybridSearch():
    """
    Class for performing hybrid search using dense and sparse embeddings.
    """

    def __init__(self, qdrant_client, embedding_model, sparse_embedding_model, reranker) -> None:
        """
        Initialize the HybridSearch object with dense and sparse embedding models and a Qdrant client.
        """
        self.qdrant_client = qdrant_client
        self.embedding_model = embedding_model  # Initialize embedding_model
        self.sparse_embedding_model = sparse_embedding_model  # Initialize sparse_embedding_model
        self.reranker = reranker  # Initialize reranker

    def metadata_filter(self, file_names: Union[str, List[str]]) -> models.Filter:
        
        if isinstance(file_names, str):
            # Single file name
            file_name_condition = models.FieldCondition(
                key="file_name",
                match=models.MatchValue(value=file_names)
            )
        else:
            # List of file names
            file_name_condition = models.FieldCondition(
                key="file_name",
                match=models.MatchAny(any=file_names)
            )

        return models.Filter(
            must=[file_name_condition]
        )
    
    def get_query_embedding(self, query):
        return self.embedding_model.embed_query(query)

    def query_hybrid_search(self, query, metadata_filter=None, limit=5, collection_name="my_collection"):
        
        # Embed the query using the dense embedding model
        dense_query = list(self.get_query_embedding(query))

        # Embed the query using the sparse embedding model
        sparse_query = list(self.sparse_embedding_model.embed([query]))[0]

        results = self.qdrant_client.query_points(
            collection_name=collection_name,
            prefetch=[
                models.Prefetch(
                    query=dense_query,
                    using="dense",
                    limit=limit,
                ),
                models.Prefetch(
                    query=models.SparseVector(**sparse_query.as_object()),
                    using="bm42",
                    limit=limit,
                ),
            ],
            query_filter=metadata_filter,
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=10
        )
        
        # Extract the document number, score, and text from the payload of each scored point
        documents = [Document(page_content=point.payload['text'],
                               metadata={"source": point.payload['source']}) \
                               for point in results.points]

        return documents
    
    def _get_relevant_documents(self, query, documents):
        # Compute the similarity scores between the query and each document
        scores = self.reranker.score([(query, doc.page_content) for doc in documents])

        # Sort the documents based on their similarity scores
        ranked_documents = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)

        # Select the top 2 documents
        top_documents = [Document(page_content=doc.page_content, metadata=doc.metadata) for doc, score in ranked_documents[:6]]

        return top_documents

    def get_relevant_documents(self, query: str) -> List[Document]:
        """
        Retrieve relevant documents for a given query.
        """
        initial_docs = self.query_hybrid_search(query)
        if initial_docs is None or len(initial_docs) == 0:
            return []
        else :
            return self._get_relevant_documents(query, initial_docs)

if __name__ == "__main__":
    start_time = time.time()
    embedding_model = Embedding().get_embeddings()
    sparse_embedding_model = Embedding().get_sparse_embeddings()
    qdrant_client = QdrantVectorStore("my_collection", embedding_model, sparse_embedding_model).get_client()
    reranker = ReRanker().get_reranker()
    hybrid = HybridSearch(qdrant_client, embedding_model, sparse_embedding_model, reranker)
    initial_docs = hybrid.query_hybrid_search("What is a MAC address?")
    if initial_docs is None or len(initial_docs) == 0:
        print("No documents found.")
    else:
        top_docs = hybrid.get_relevant_documents("What is a MAC address?", initial_docs)
        for doc in top_docs:
            print(doc)   
    # # top_docs = re_ranker.rerank_documents("What is a MAC address?", initial_docs)
    # # print(len(initial_docs))
    # qdrant_client = QdrantVectorStore("my_collection").get_client()
    end_time = time.time()
    print(f"Search Time: {end_time - start_time} seconds")
