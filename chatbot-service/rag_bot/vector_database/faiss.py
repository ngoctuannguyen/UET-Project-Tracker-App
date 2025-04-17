import faiss
import numpy

dimension = 768  # Dimension of the embeddings

index = faiss.IndexFlatL2(dimension)

class VectorStore: 
    def __init__(self):
        self.index = None

    def get_index(self):
        self.index = faiss.IndexFlatL2(dimension)
        return self.index
    
    def add_embeddings(self, embeddings):
        self.index.add(embeddings)
        return self.index
    