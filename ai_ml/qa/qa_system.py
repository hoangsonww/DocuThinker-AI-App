def answer_question(context, question, qa_chain):
    """
    Answers the given question based on the provided context using the QA chain.
    """
    answer = qa_chain.run(context=context, question=question)
    return answer.strip()
