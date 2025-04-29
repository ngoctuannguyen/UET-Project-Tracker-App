import os
from langchain_community.document_loaders import PyPDFLoader
from rag_bot.vector_database.qdrant import QdrantVectorStore
from rag_bot.model.embedding import Embedding
from typing import List
import google.generativeai as genai
from langchain_core.documents import Document
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

llm = genai.GenerativeModel("gemini-2.0-flash")  

from typing import List
from langchain_core.documents import Document
import re

def clean_newlines(text: str) -> str:
    # 1. Gộp nhiều hơn 2 dòng trống -> chỉ còn 2 dòng
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 2. Nếu \n nằm giữa một câu (không có dấu chấm câu trước đó), thay bằng khoảng trắng
    text = re.sub(r'(?<![\.\?\!])\n(?![\n])', ' ', text)

    # 3. Xóa dòng trống ở đầu cuối (nếu có)
    text = text.strip()

    return text


def agentic_chunk(doc: Document, system_prompt=None) -> List[Document]:
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    prompt = (
        system_prompt if system_prompt else 
        """You are a document analysis assistant. Given a large document, 
        split it into semantically meaningful chunks of ~200-300 words that are self-contained,
        well-titled, and suitable for retrieval-based systems. 
        Each section should be semantically complete.

        Important: Return the output with each section starting with '### Section Title'.
        """
    )
    
    # 1. Call Gemini
    response = model.generate_content(
        {
            "role": "user",
            "parts": prompt + f"\n\nPlease chunk the following text:\n\n{doc.page_content}"
        }
    )
    
    # 2. Extract text
    raw_text = response.text

    raw_text = clean_newlines(raw_text)

    # 3. Split by '###' (but keep the section title)
    # Split where a line starts with ### and optional spaces
    chunks = re.split(r'\n\s*###\s*', raw_text)
    chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

    # 4. Wrap each chunk as a Document
    documents = []
    for chunk in chunks:
        new_doc = Document(
            page_content=chunk,
            metadata={"source": doc.metadata.get("source", "unknown")}
        )
        documents.append(new_doc)
    
    return documents


def load_documents_from_folder(folder_path: str) -> List[Document]:
    
    documents = []
    docs = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            docs = loader.load()
        else:
            continue
        for doc in docs:
            doc.metadata["source"] = filename
        documents.extend(docs)
    return documents

def agentic_chunk_folder(folder_path: str) -> List[Document]:
    raw_docs = load_documents_from_folder(folder_path)
    all_chunks = []
    for doc in raw_docs:
        chunks = agentic_chunk(doc)
        all_chunks.extend(chunks)
    return all_chunks

def get_client(embedding, spare_embedding, collection_name="my_collection"):
    return QdrantVectorStore(collection_name=collection_name, embeddings=embedding, sparse_embeddings=spare_embedding).get_client()

def load_document_into_qdrant(documents, qdrant_store, collection_name="my_collection"):
    qdrant_store.add_documents(documents)

if __name__ == "__main__":
    folder = "C:/Chat-App"  # thư mục chứa PDF/DOCX
    embedding_model = Embedding().get_embeddings()
    sparse_model = Embedding().get_sparse_embeddings()
    qdrant_store = QdrantVectorStore(collection_name="my_collection", embeddings=embedding_model, sparse_embeddings=sparse_model)
    chunked_docs = agentic_chunk_folder(folder)
    print(chunked_docs)
    # print(f"✅ Đã chunk {len(chunked_docs)} đoạn.")
    # load_document_into_qdrant(chunked_docs, qdrant_store)

