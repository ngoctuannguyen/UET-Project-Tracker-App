import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import openai
from typing import List, Dict, Any

class ContextCompressor:
    def __init__(self, embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        # Khởi tạo models
        self.embedding_model = SentenceTransformer(embedding_model)
        self.llm_model = "gpt-3.5-turbo"  # Có thể thay bằng model khác
        
    def hybrid_search(self, query: str, k: int = 10) -> List[Dict]:
        """ 
        Giả định bạn đã có hàm hybrid search trả về documents dạng:
        [{"text": "content", "metadata": {...}, "score": 0.8}, ...]
        """
        # Triển khai logic hybrid search của bạn ở đây
        # Return danh sách documents kết hợp từ multiple retrievers
        return simulated_hybrid_search(query, k)
    
    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """ Tính embeddings cho nhiều text cùng lúc """
        return self.embedding_model.encode(texts, convert_to_tensor=False)
    
    def redundancy_filter(self, documents: List[Dict], threshold: float = 0.85) -> List[Dict]:
        """ Loại bỏ documents trùng lặp về ngữ nghĩa """
        if len(documents) < 2:
            return documents
            
        texts = [doc["text"] for doc in documents]
        embeddings = self._get_embeddings(texts)
        
        unique_docs = []
        seen_indices = set()
        
        for i in range(len(documents)):
            if i not in seen_indices:
                unique_docs.append(documents[i])
                # Tìm các documents tương tự với document hiện tại
                similarities = cosine_similarity([embeddings[i]], embeddings)[0]
                duplicates = np.where(similarities > threshold)[0]
                seen_indices.update(duplicates)
                
        return unique_docs
    
    def similarity_filter(self, query: str, documents: List[Dict], threshold: float = 0.7) -> List[Dict]:
        """ Lọc documents dựa trên độ tương đồng với query """
        query_embedding = self._get_embeddings([query])[0]
        doc_embeddings = self._get_embeddings([doc["text"] for doc in documents])
        
        similarities = cosine_similarity([query_embedding], doc_embeddings)[0]
        return [doc for doc, sim in zip(documents, similarities) if sim > threshold]
    
    def llm_based_filter(self, query: str, documents: List[Dict]) -> List[Dict]:
        """ Dùng LLM đánh giá relevance của từng document """
        filtered = []
        
        for doc in documents:
            prompt = f"""Đánh giá mức độ liên quan của tài liệu sau với câu hỏi (trả lời 'yes' hoặc 'no'):
            Câu hỏi: {query}
            Tài liệu: {doc['text'][:1000]} 
            Liên quan?"""
            
            response = openai.ChatCompletion.create(
                model=self.llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            
            if "yes" in response.choices[0].message["content"].lower():
                filtered.append(doc)
        
        return filtered
    
    def compress_context(
        self,
        query: str,
        similarity_threshold: float = 0.65,
        redundancy_threshold: float = 0.88,
        use_llm_filter: bool = True
    ) -> List[Dict]:
        # Bước 1: Thực hiện hybrid search
        initial_results = self.hybrid_search(query, k=20)
        
        # Bước 2: Lọc trùng lặp
        deduped = self.redundancy_filter(initial_results, redundancy_threshold)
        
        # Bước 3: Lọc theo similarity
        similarity_filtered = self.similarity_filter(query, deduped, similarity_threshold)
        
        # Bước 4: Lọc bằng LLM (tuỳ chọn)
        if use_llm_filter:
            final_results = self.llm_based_filter(query, similarity_filtered)
        else:
            final_results = similarity_filtered
            
        return final_results[:10]  # Giữ lại top 10 documents

# *************************
# Example Usage
# *************************

compressor = ContextCompressor()

def get_final_answer(query: str):
    # Nén context
    compressed_docs = compressor.compress_context(query)
    
    # Tạo context string
    context = "\n\n".join([f"Document {i+1}: {doc['text']}" for i, doc in enumerate(compressed_docs)])
    
    # Tạo prompt cho LLM
    prompt = f"""Dựa vào các tài liệu sau, trả lời câu hỏi:
    
    {context}
    
    Câu hỏi: {query}
    Trả lời:"""
    
    # Gọi LLM
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message["content"]

# Sử dụng
answer = get_final_answer("Cách mạng công nghiệp 4.0 có những rủi ro chính nào?")
print(answer)