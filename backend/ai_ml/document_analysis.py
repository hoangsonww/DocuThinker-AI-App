from langchain.chains import LLMChain, RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from document_ingestion import DocumentIngestion


class DocumentAnalysis:
    def __init__(self, model_name="gpt-4", temperature=0.7):
        self.llm = ChatOpenAI(model_name=model_name, temperature=temperature)
        self.ingestion = DocumentIngestion()
        self.ingestion.load_vector_store()


    def generate_summary(self):
        """Generates a summary of the indexed document"""
        template = """
        Given the following document text, generate a concise summary:
        {context}
        Summary:
        """
        prompt = PromptTemplate(template=template, input_variables=["context"])
        chain = LLMChain(llm=self.llm, prompt=prompt)

        document_chunks = self.ingestion.retrieve_relevant_chunks("Summarize this document", top_k=5)
        context = " ".join(document_chunks)
        return chain.run(context=context)


    def generate_insights(self):
        """Generates key insights from the document"""
        template = """
        Extract key insights from the following document content:
        {context}
        Insights:
        """
        prompt = PromptTemplate(template=template, input_variables=["context"])
        chain = LLMChain(llm=self.llm, prompt=prompt)

        document_chunks = self.ingestion.retrieve_relevant_chunks("Extract key insights", top_k=5)
        context = " ".join(document_chunks)
        return chain.run(context=context)


    def query_document(self, query):
        """Retrieves relevant document chunks and answers the query using RAG"""
        retriever = self.ingestion.vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
        qa_chain = RetrievalQA.from_chain_type(llm=self.llm, retriever=retriever)
        return qa_chain.run(query)


# Example usage
if __name__ == "__main__":
    analysis = DocumentAnalysis()

    print("Summary:")
    print(analysis.generate_summary())

    print("\nKey Insights:")
    print(analysis.generate_insights())

    user_query = "What are the key takeaways from this document?"
    print("\nQuery Response:")
    print(analysis.query_document(user_query))
