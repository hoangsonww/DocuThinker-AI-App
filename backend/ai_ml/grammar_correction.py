from transformers import pipeline

# Load a pre-trained grammar correction model
grammar_corrector = pipeline("text2text-generation", model="prithivida/grammar_error_correcter_v1")


def correct_grammar(text):
    """
    Corrects grammar and spelling errors in the given text.

    Args:
        text (str): The text to correct.

    Returns:
        str: The text with grammar corrections.
    """
    corrected_text = grammar_corrector(f"gec: {text}", max_length=256, do_sample=False)[0]['generated_text']
    return corrected_text


if __name__ == "__main__":
    # Example
    text_with_errors = "The cat eat a fish yesterday. He enjoy the food."
    corrected_text = correct_grammar(text_with_errors)
    print("Corrected Text:", corrected_text)
