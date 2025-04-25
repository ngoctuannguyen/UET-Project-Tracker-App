import os
from langchain_community.document_loaders import PyPDFLoader
from rag_bot.vector_database.qdrant import QdrantVectorStore
# from langchain.text_splitter import MarkdownHeaderTextSplitter
# from rag_bot.utils.data_loader.semantic_chunking import SemanticChunking
# from langchain_community.embeddings import HuggingFaceBgeEmbeddings
# from langchain_core.documents import Document
# from qdrant_client.models import PointStruct
from typing import List
# from rag_bot.model.embedding import Embedding
# import os
# from docx import Document as DocxDocument
# from langchain_core.documents import Document
# from langchain.text_splitter import MarkdownHeaderTextSplitter
# from rag_bot.utils.data_loader.semantic_chunking import SemanticChunking
# from rag_bot.model.embedding import Embedding
# import re
# from langchain_core.documents import Document

# # Regex nhận diện heading kiểu in hoa hoặc số La Mã
# HEADING_PATTERN = re.compile(r"^([IVXLCDM]+\.)|^[A-Z\s\d\-:,]+$")

# def custom_markdown_chunker(markdown_text: str, source: str = "custom.md"):
#     lines = markdown_text.splitlines()
#     chunks = []
#     current_chunk = []
#     current_title = "Untitled"

#     for line in lines:
#         stripped = line.strip()
#         if not stripped:
#             continue

#         if HEADING_PATTERN.match(stripped):
#             if current_chunk:
#                 chunks.append(Document(page_content="\n".join(current_chunk),
#                                        metadata={"title": current_title, "source": source}))
#                 current_chunk = []
#             current_title = stripped
#         current_chunk.append(stripped)

#     if current_chunk:
#         chunks.append(Document(page_content="\n".join(current_chunk),
#                                metadata={"title": current_title, "source": source}))
#     return chunks


# # Bước 1: Chuyển file .docx thành chuỗi markdown
# def convert_docx_to_markdown(docx_path: str) -> str:
#     docx = DocxDocument(docx_path)
#     markdown_lines = []

#     for para in docx.paragraphs:
#         style = para.style.name
#         text = para.text.strip()
#         if not text:
#             continue

#         if style.startswith("Heading"):
#             level = int(style.replace("Heading", "").strip())
#             markdown_lines.append("#" * level + " " + text)
#         else:
#             markdown_lines.append(text)

#     return "\n\n".join(markdown_lines)

# # Bước 2: Dùng MarkdownHeaderTextSplitter để chia theo tiêu đề
# def split_markdown_by_headers(markdown_text: str, source: str = "doc.docx"):
#     splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")])
#     docs = splitter.split_text(markdown_text)
#     for doc in docs:
#         doc.metadata["source"] = source
#     return docs

# # Bước 3: Semantic Chunking từ mỗi đoạn markdown
# def chunk_docx_semantically_with_markdown(docx_path: str):
#     markdown_text = convert_docx_to_markdown(docx_path)
#     markdown_chunks = split_markdown_by_headers(markdown_text, source=os.path.basename(docx_path))
#     embedding_model = Embedding().get_embeddings()
#     chunker = SemanticChunking(embedding=embedding_model)
#     final_chunks = chunker.transform_documents(markdown_chunks)
#     return final_chunks


# # Load tất cả PDF từ thư mục
# def load_multiple_pdfs(folder_path):
#     all_docs = []
#     for filename in os.listdir(folder_path):
#         if filename.endswith(".pdf"):
#             loader = PyPDFLoader(os.path.join(folder_path, filename))
#             docs = loader.load()
#             for doc in docs:
#                 doc.metadata["source"] = filename
#             all_docs.extend(docs)
#     return all_docs

# # Markdown Splitting theo Header
# def markdown_splitting(docs: List[Document]) -> List[Document]:
#     headers_to_split_on = [
#         ("#", "Header 1"),
#         ("##", "Header 2"),
#         ("###", "Header 3"),
#     ]
#     splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
#     markdown_chunks = []
#     for doc in docs:
#         markdown_chunks.extend(splitter.split_text(doc.page_content))
#     return markdown_chunks

# # Semantic Chunking sau Markdown
# def semantic_chunking(docs: List[Document], embed_model):
#     chunker = SemanticChunking(embedding=embed_model)
#     return chunker.transform_documents(docs)

# # Nhúng và chuyển sang PointStruct
# def embed_and_prepare_points(docs: List[Document], embed_model: HuggingFaceBgeEmbeddings):
#     vectors = embed_model.embed_documents([doc.page_content for doc in docs])
#     return [
#         PointStruct(
#             id=i,
#             vector=vec,
#             payload={
#                 "text": doc.page_content,
#                 "source": doc.metadata.get("source", "unknown")
#             }
#         )
#         for i, (doc, vec) in enumerate(zip(docs, vectors))
#     ]

# # Hàm chính
# def process_pdfs(folder_path):
#     raw_docs = load_multiple_pdfs(folder_path)
#     markdown_docs = markdown_splitting(raw_docs)
#     embed_model = Embedding().get_embeddings()
#     semantic_docs = semantic_chunking(markdown_docs, embed_model)
#     print(len(semantic_docs), semantic_docs)
#     points = embed_and_prepare_points(semantic_docs, embed_model)
#     print(f"✅ Tổng số chunks: {len(points)}")
#     # return points  # bạn có thể upsert vào Qdrant ở đây

# # Chạy chương trình
# # if __name__ == "__main__":
# #     print(process_pdfs(r"C:\Chat-App"))

# if __name__ == "__main__":
#     markdown_text = """
#     I. GIỚI THIỆU
#     Đây là phần giới thiệu của tài liệu.

#     II. PHÂN TÍCH
#     Chúng tôi sẽ phân tích dữ liệu.

#     III. KẾT LUẬN
#     Tài liệu kết thúc tại đây.
#     """
#     chunks = custom_markdown_chunker(markdown_text)
#     for i, doc in enumerate(chunks):
#         print(f"\n--- Chunk {i+1} ---")
#         print(f"Title: {doc.metadata['title']}")
#         print(doc.page_content)

import google.generativeai as genai
from langchain_core.documents import Document
# from langchain.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate
# from langchain.chains import LLMChain

# Prompt mẫu để agent hiểu và chunk
chunking_prompt = PromptTemplate.from_template("""
Bạn là một trợ lý AI. Hãy chia văn bản sau thành các đoạn ngắn, mỗi đoạn là một ý hoặc chủ đề riêng. Mỗi đoạn nên được định dạng như sau:

### [TIÊU ĐỀ PHÙ HỢP]
[Nội dung đoạn văn]

--- Văn bản gốc ---
{document}
""")

genai.configure(api_key="AIzaSyDB4X1KMTv14iWImeD4PtM-6Z0isl3IVEU")

llm = genai.GenerativeModel("gemini-2.0-flash")  # Hoặc gpt-3.5-turbo
# chunking_chain = LLMChain(llm=llm, prompt=chunking_prompt, output_parser=StrOutputParser())

# def agentic_chunk(document: Document) -> list[Document]:
#     output = chunking_chain.invoke({"document": document.page_content})
#     chunks = output.split("### ")
#     doc_chunks = []
#     for chunk in chunks:
#         if chunk.strip():
#             lines = chunk.strip().splitlines()
#             title = lines[0].strip()
#             content = "\n".join(lines[1:]).strip()
#             doc_chunks.append(Document(page_content=content, metadata={"title": title, "source": document.metadata.get("source", "unknown")}))
#     return doc_chunks

def agentic_chunk(text, system_prompt=None):
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    prompt = (
        system_prompt if system_prompt else 
        "You are a document analysis assistant. Given a large document, split it into semantically meaningful chunks of ~200-300 words that are self-contained, well-titled, and suitable for retrieval-based systems."
    )
    
    response = model.generate_content(
        # {"role": "system", "parts": [prompt]},
        {"role": "user", "parts": prompt + f"Please chunk the following text:\n\n{text}"}
    )
    
    return response.text


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
        # elif filename.endswith(".docx"):
        #     loader = Docx2txtLoader(file_path)
        # else:
        #     continue
        # docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = filename
        documents.extend(docs)
    return documents

def agentic_chunk_folder(folder_path: str) -> List[Document]:
    raw_docs = load_documents_from_folder(folder_path)
    all_chunks = []
    for doc in raw_docs:
        chunks = agentic_chunk(doc.page_content)
        all_chunks.extend(chunks)
    return all_chunks

def get_client():
    return QdrantVectorStore().get_client()

def load_document_into_qdrant(documents, qdrant_client, collection_name="my_collection"):
    qdrant_client.add_documents(documents)

if __name__ == "__main__":
    folder = "C:/Chat-App"  # thư mục chứa PDF/DOCX
    chunked_docs = agentic_chunk_folder(folder)
    print(f"✅ Đã chunk {len(chunked_docs)} đoạn.")
    # print(chunked_docs[0].metadata)
    print(chunked_docs)
    # print(chunked_docs[0].page_content[:300])

