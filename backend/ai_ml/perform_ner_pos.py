import spacy

# Load pre-trained spaCy model
nlp = spacy.load("en_core_web_sm")


def perform_ner_and_pos(text):
    """
    Performs Named Entity Recognition (NER) and Part-of-Speech (POS) tagging on the provided text.

    Args:
        text (str): The text to analyze.

    Returns:
        dict: A dictionary containing named entities and their labels, and a list of POS tags.
    """
    doc = nlp(text)

    # Extract named entities
    named_entities = [(ent.text, ent.label_) for ent in doc.ents]

    # Extract POS tags
    pos_tags = [(token.text, token.pos_) for token in doc]

    return {
        'named_entities': named_entities,
        'pos_tags': pos_tags
    }


if __name__ == '__main__':
    # Example text for NER and POS tagging
    text = "Apple is a major tech company based in Cupertino, California. It was founded by Steve Jobs."

    # Perform NER and POS tagging
    ner_pos_results = perform_ner_and_pos(text)
    print("Named Entities:", ner_pos_results['named_entities'])
    print("POS Tags:", ner_pos_results['pos_tags'])
