import os
from langchain.chains.summarize import load_summarize_chain
from langchain.llms import OpenAI
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentSummarizer:
    def __init__(self, persist_directory="vector_store"):
        self.persist_directory = persist_directory
        self.llm = OpenAI(model_name="gpt-4", temperature=0.3)
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None
        self.load_vector_store()


    def load_vector_store(self):
        """Load the vector store if it exists."""
        if os.path.exists(self.persist_directory):
            self.vector_store = FAISS.load_local(self.persist_directory, self.embeddings)
        else:
            raise FileNotFoundError("Vector store not found. Please ingest documents first.")


    def retrieve_relevant_chunks(self, query):
        """Retrieve relevant chunks from the vector store based on the query."""
        retriever = self.vector_store.as_retriever()
        return retriever.get_relevant_documents(query)


    def generate_summary(self, query="Summarize the document."):
        """Generate a summary of the document using an LLM."""
        relevant_chunks = self.retrieve_relevant_chunks(query)
        prompt_template = PromptTemplate(
            input_variables=["context"],
            template="Given the following document snippets:\n\n{context}\n\nProvide a concise summary."
        )

        summarize_chain = load_summarize_chain(self.llm, chain_type="stuff", prompt=prompt_template)
        summary = summarize_chain.run(relevant_chunks)
        return summary


if __name__ == "__main__":
    summarizer = DocumentSummarizer()
    summary = summarizer.generate_summary()
    print("\n### Document Summary ###\n")
    print(summary)
