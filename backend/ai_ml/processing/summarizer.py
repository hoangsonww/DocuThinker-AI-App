def summarize_text(text, summarizer_chain, max_chunk_length=1000):
    """
    Summarizes the given text using the provided summarization chain.
    If the text exceeds max_chunk_length, it is split into chunks.
    """
    if len(text) <= max_chunk_length:
        chunks = [text]
    else:
        chunks = [text[i:i+max_chunk_length] for i in range(0, len(text), max_chunk_length)]

    summaries = []
    for chunk in chunks:
        summary = summarizer_chain.run(text=chunk)
        summaries.append(summary.strip())
    return " ".join(summaries)
