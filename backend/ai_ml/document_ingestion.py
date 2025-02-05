import os
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentIngestion:
    def __init__(self, persist_directory="vector_store"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None


    def load_document(self, file_path):
        """Loads document based on its file type"""
        ext = os.path.splitext(file_path)[-1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext in [".docx", ".doc"]:
            loader = Docx2txtLoader(file_path)
        elif ext in [".txt"]:
            loader = TextLoader(file_path)
        else:
            raise ValueError("Unsupported file format")

        documents = loader.load()
        return documents


    def index_document(self, file_path):
        """Indexes document and stores embeddings"""
        documents = self.load_document(file_path)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        texts = text_splitter.split_documents(documents)

        # Create or load FAISS vector store
        self.vector_store = FAISS.from_documents(texts, self.embeddings)
        self.vector_store.save_local(self.persist_directory)

        return f"Document indexed successfully! ({file_path})"


    def load_vector_store(self):
        """Loads vector store from the persisted directory"""
        if os.path.exists(self.persist_directory):
            self.vector_store = FAISS.load_local(self.persist_directory, self.embeddings)
            return True
        return False


    def retrieve_relevant_chunks(self, query, top_k=3):
        """Retrieves top-k relevant document chunks for a query"""
        if not self.vector_store:
            if not self.load_vector_store():
                raise ValueError("Vector store not found. Please index a document first.")

        docs = self.vector_store.similarity_search(query, k=top_k)
        return [doc.page_content for doc in docs]
