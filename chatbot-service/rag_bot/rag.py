from langchain_core.documents import Document
from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from langchain.chains.question_answering import load_qa_chain
from langchain.chains.llm import LLMChain
from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import PromptTemplate
from rag_bot.retrieval.retrieval import HybridSearch  # Your custom retriever
from rag_bot.utils.llm import GeminiLLM  # Your LLM initialization function
import os
from dotenv import load_dotenv

class RAGPipeline:
    """
    Retrieval-Augmented Generation (RAG) pipeline for chatbot responses.
    Uses custom Retrieval class for document retrieval.
    """
    def __init__(self, retriever, llm):
        """
        Initialize the RAG pipeline.
        :param retriever: Instance from rag_bot.retrieval.retrieval.Retrieval
        :param llm: Initialized language model
        """
        self.retriever = retriever
        self.llm = llm

        # Improved QA prompt template
        qa_prompt = PromptTemplate.from_template(
            """Answer using this context:
            {context}

            Question: {question}
            If the answer isn't in the context, say "I don't know".
            Answer:"""
        )

        # Configure document chain
        self.doc_chain = load_qa_chain(
            llm=self.llm,
            chain_type="stuff",
            prompt=qa_prompt,
            verbose=True
        )

        # Configure memory with proper key alignment
        self.memory = ConversationSummaryBufferMemory(
            llm=self.llm,
            memory_key="chat_history",
            input_key="question",
            output_key="answer",
            return_messages=True
        )

        self.qa_chain = ConversationalRetrievalChain(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            combine_docs_chain=self.doc_chain,
            verbose=True
        )
        

    def generate_response(self, query: str) -> dict:
        """
        Generate response with custom retriever integration
        """
        result = self.qa_chain({"question": query})
        return {
            "answer": result["answer"],
            "sources": [doc.metadata.get("source", "unknown") for doc in result["source_documents"]]
        }

# Example usage with your custom Retrieval class
if __name__ == "__main__":

    # Example documents
    documents = [
        Document(
            page_content="LangChain is a framework for building LLM-powered applications.",
            metadata={"source": "doc1"}
        ),
        Document(
            page_content="FAISS is a library for efficient similarity search.",
            metadata={"source": "doc2"}
        )
    ]

    # Initialize your custom retriever
    retriever = HybridSearch()  # Using your class

    load_dotenv()

    llm = GeminiLLM(api_key=os.environ["GEMINI_API_KEY"])

    # Create pipeline
    rag_pipeline = RAGPipeline(retriever=retriever, llm=llm)

    # Test query
    response = rag_pipeline.generate_response("What is LangChain?")
    print(f"Answer: {response['answer']}\nSources: {response['sources']}")