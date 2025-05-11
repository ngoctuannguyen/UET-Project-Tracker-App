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
from rag_bot.utils.prompt import SYSTEM_PROMPT

class CustomQAChain:
    """Custom QA chain using HybridSearch for retrieval"""
    
    def __init__(self, hybrid_search: HybridSearch, llm, memory):
        self.hybrid_search = hybrid_search
        self.llm = llm
        self.memory = memory

        self.system_prompt = PromptTemplate.from_template(
            SYSTEM_PROMPT
        )
        
        self.llm_chain = LLMChain(llm=llm, prompt=self.system_prompt, verbose=True)

    def __call__(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        # Retrieve relevant documents
        docs = self.hybrid_search.get_relevant_documents(inputs["question"])
        
        # Get chat history from memory
        chat_history = self.memory.load_memory_variables({})["chat_history"]
        
        # Format context from documents
        context = "\n".join([doc.page_content for doc in docs])
        
        # Generate answer
        response = self.llm_chain.invoke({
            "question": inputs["question"],
            "context": context,
            "chat_history": chat_history
        })
        
        # Save to memory
        # self.memory.save_context(
        #     {"question": inputs["question"]},
        #     {"answer": response}
        # )
        
        return {"answer": response, "sources": [doc.metadata for doc in docs]}

class RAGPipeline:
    """Modified RAG Pipeline with HybridSearch integration"""
    
    def __init__(self, hybrid_search: HybridSearch, llm):
        self.hybrid_search = hybrid_search
        self.llm = llm
        self.sessions = {}
        self.create_session("1")

    def create_session(self, session_id: str):
        """Create a new session for the RAG pipeline"""
        if session_id in self.sessions:
            raise ValueError(f"Session {session_id} already exists.")
        
        memory = ConversationSummaryBufferMemory(
            llm=self.llm,
            max_token_limit=1024,
            memory_key="chat_history",
            return_messages=True
        )

        self.qa_chain = CustomQAChain(
            hybrid_search=self.hybrid_search,
            llm=self.llm,
            memory=memory
        )

        self.sessions[session_id] = {
            "memory": memory,
            "qa_chain": self.qa_chain
        }

    def reset_session(self, session_id: str) -> None:
        """
        Reset an existing session by clearing its memory.
        """
        if session_id not in self.sessions:
            raise ValueError(f"Session with ID '{session_id}' does not exist.")
        
        # Clear the memory for the session
        self.sessions[session_id]["memory"].clear()

    def generate_response(self, query: str) -> dict:
        """Execute the full RAG pipeline"""
        result = self.qa_chain({"question": query})
        return {
            "answer": result["answer"],
            "sources": result["sources"]
        }

# Usage Example


    # documents = [
    #     Document(page_content="Quantum computing is a type of computation that uses quantum bits (qubits).", metadata={"source": "doc1"}),
    #     Document(page_content="Classical computers use bits, which can be either 0 or 1.", metadata={"source": "doc2"}),
    #     Document(page_content="Quantum computers can perform certain calculations much faster than classical computers.", metadata={"source": "doc3"})
    # ]

    # Load documents into Qdrant
    # Initialize components
embedding_model = Embedding().get_embeddings()
sparse_model = Embedding().get_sparse_embeddings()
qdrant_store = QdrantVectorStore("my_collection", embedding_model, sparse_model)
    # qdrant_store.add_documents(documents)
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
