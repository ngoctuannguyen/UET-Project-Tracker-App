from langchain_core.prompts import PromptTemplate
from langchain.schema import BaseRetriever, Document
from typing import List, Dict, Any
from langchain.memory import ConversationSummaryBufferMemory
from langchain.chains.llm import LLMChain
from rag_bot.vector_database.qdrant import QdrantVectorStore
from rag_bot.retrieval.retrieval import HybridSearch
from rag_bot.model.embedding import Embedding
from rag_bot.model.reranker import ReRanker
from rag_bot.utils.llm import GeminiLLM
from dotenv import load_dotenv
import os

class CustomQAChain:
    """Custom QA chain using HybridSearch for retrieval"""
    
    def __init__(self, hybrid_search: HybridSearch, llm, memory):
        self.hybrid_search = hybrid_search
        self.llm = llm
        self.memory = memory
        
        self.qa_prompt = PromptTemplate.from_template(
            """Answer the question using only the following context and chat history.
            If you don't know the answer, say "I don't know".
            
            Chat History:
            {chat_history}
            
            Context:
            {context}
            
            Question: {question}
            Answer:"""
        )
        self.llm_chain = LLMChain(llm=llm, prompt=self.qa_prompt, verbose=True)

    def __call__(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        # Retrieve relevant documents
        docs = self.hybrid_search.get_relevant_documents(inputs["question"])
        
        # Get chat history from memory
        chat_history = self.memory.load_memory_variables({})["chat_history"]
        
        # Format context from documents
        context = "\n".join([doc.page_content for doc in docs])
        
        # Generate answer
        response = self.llm_chain.run(
            question=inputs["question"],
            context=context,
            chat_history=chat_history
        )
        
        # Save to memory
        self.memory.save_context(
            {"question": inputs["question"]},
            {"answer": response}
        )
        
        return {"answer": response, "sources": [doc.metadata for doc in docs]}

class RAGPipeline:
    """Modified RAG Pipeline with HybridSearch integration"""
    
    def __init__(self, hybrid_search: HybridSearch, llm):
        self.hybrid_search = hybrid_search
        self.llm = llm
        
        # Initialize memory
        self.memory = ConversationSummaryBufferMemory(
            llm=llm,
            memory_key="chat_history",
            input_key="question",
            output_key="answer",
            return_messages=True
        )
        
        # Create custom QA chain
        self.qa_chain = CustomQAChain(
            hybrid_search=hybrid_search,
            llm=llm,
            memory=self.memory
        )

    def generate_response(self, query: str) -> dict:
        """Execute the full RAG pipeline"""
        result = self.qa_chain({"question": query})
        return {
            "answer": result["answer"],
            "sources": result["sources"]
        }

# Usage Example
if __name__ == "__main__":

    documents = [
        Document(page_content="Quantum computing is a type of computation that uses quantum bits (qubits).", metadata={"source": "doc1"}),
        Document(page_content="Classical computers use bits, which can be either 0 or 1.", metadata={"source": "doc2"}),
        Document(page_content="Quantum computers can perform certain calculations much faster than classical computers.", metadata={"source": "doc3"})
    ]

    # Load documents into Qdrant
    # Initialize components
    embedding_model = Embedding().get_embeddings()
    sparse_model = Embedding().get_sparse_embeddings()
    qdrant_store = QdrantVectorStore("my_collection", embedding_model, sparse_model)
    qdrant_store.add_documents(documents)
    qdrant_client = qdrant_store.get_client()
    reranker = ReRanker().get_reranker()
    hybrid_search = HybridSearch(
        qdrant_client=qdrant_client,
        embedding_model=embedding_model,
        sparse_embedding_model=sparse_model,
        reranker=reranker
    )
   
    load_dotenv()

    llm = GeminiLLM(os.environ["GEMINI_API_KEY"], model_name="gemini-2.0-flash").get_llm()
    
    # Create pipeline
    rag_pipeline = RAGPipeline(hybrid_search, llm)
    
    # Query the pipeline
    response = rag_pipeline.generate_response("What is quantum computing?")
    print("Answer:", response["answer"])
    print("Sources:", response["sources"])