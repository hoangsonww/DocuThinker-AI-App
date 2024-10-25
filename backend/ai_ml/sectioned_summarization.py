from transformers import pipeline

# Load pre-trained summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")


def summarize_sectioned_text(text, section_headers, max_length=150):
    """
    Summarizes the document by sections, based on section headers.

    Args:
        text (str): The full document to summarize.
        section_headers (list): A list of section headers found in the text.
        max_length (int): Maximum length of each section summary.

    Returns:
        dict: A dictionary where each section header is associated with its summary.
    """
    summaries = {}
    sections = text.split("\n")

    for header in section_headers:
        header_index = [i for i, section in enumerate(sections) if header in section]
        if header_index:
            header_index = header_index[0]
            section_content = "\n".join(sections[header_index+1:header_index+5])  # Grab some lines after the header
            summary = summarizer(section_content, max_length=max_length, min_length=50, do_sample=False)[0]['summary_text']
            summaries[header] = summary

    return summaries


if __name__ == "__main__":
    # Example
    document_text = """
    Introduction
    The company achieved significant milestones...
    Financial Performance
    Revenue increased by 25% this quarter...
    Market Expansion
    The company expanded into new regions...
    """
    section_headers = ["Introduction", "Financial Performance", "Market Expansion"]
    section_summaries = summarize_sectioned_text(document_text, section_headers)
    print("Sectioned Summaries:", section_summaries)
