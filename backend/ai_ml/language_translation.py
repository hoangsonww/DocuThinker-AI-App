from transformers import MarianMTModel, MarianTokenizer


def translate_text(text, source_lang="en", target_lang="fr"):
    """
    Translates the given text from the source language to the target language.

    Args:
        text (str): The text to translate.
        source_lang (str): The source language code (e.g., "en" for English).
        target_lang (str): The target language code (e.g., "fr" for French).

    Returns:
        str: The translated text.
    """
    # Define the translation model and tokenizer based on the language pair
    model_name = f"Helsinki-NLP/opus-mt-{source_lang}-{target_lang}"
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)

    # Tokenize and translate the text
    tokens = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    translated = model.generate(**tokens)

    # Decode the translated tokens
    translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
    return translated_text


if __name__ == "__main__":
    # Example usage
    english_text = "Hello, how are you?"
    french_translation = translate_text(english_text, source_lang="en", target_lang="fr")
    print("French Translation:", french_translation)

    spanish_translation = translate_text(english_text, source_lang="en", target_lang="es")
    print("Spanish Translation:", spanish_translation)

    german_translation = translate_text(english_text, source_lang="en", target_lang="de")
    print("German Translation:", german_translation)

    italian_translation = translate_text(english_text, source_lang="en", target_lang="it")
    print("Italian Translation:", italian_translation)

    vietnamese_translation = translate_text(english_text, source_lang="en", target_lang="vi")
    print("Vietnamese Translation:", vietnamese_translation)

    chinese_translation = translate_text(english_text, source_lang="en", target_lang="zh")
    print("Chinese Translation:", chinese_translation)

    arabic_translation = translate_text(english_text, source_lang="en", target_lang="ar")
    print("Arabic Translation:", arabic_translation)

    thai_translation = translate_text(english_text, source_lang="en", target_lang="th")
    print("Thai Translation:", thai_translation)

    russian_translation = translate_text(english_text, source_lang="en", target_lang="ru")
    print("Russian Translation:", russian_translation)

    japanese_translation = translate_text(english_text, source_lang="en", target_lang="ja")
    print("Japanese Translation:", japanese_translation)

    korean_translation = translate_text(english_text, source_lang="en", target_lang="ko")
    print("Korean Translation:", korean_translation)

    dutch_translation = translate_text(english_text, source_lang="en", target_lang="nl")
    print("Dutch Translation:", dutch_translation)

    portuguese_translation = translate_text(english_text, source_lang="en", target_lang="pt")
    print("Portuguese Translation:", portuguese_translation)

    greek_translation = translate_text(english_text, source_lang="en", target_lang="el")
    print("Greek Translation:", greek_translation)

    turkish_translation = translate_text(english_text, source_lang="en", target_lang="tr")
    print("Turkish Translation:", turkish_translation)

    polish_translation = translate_text(english_text, source_lang="en", target_lang="pl")
    print("Polish Translation:", polish_translation)

    indonesian_translation = translate_text(english_text, source_lang="en", target_lang="id")
    print("Indonesian Translation:", indonesian_translation)

    filipino_translation = translate_text(english_text, source_lang="en", target_lang="fil")
    print("Filipino Translation:", filipino_translation)

    malay_translation = translate_text(english_text, source_lang="en", target_lang="ms")
    print("Malay Translation:", malay_translation)

    hindi_translation = translate_text(english_text, source_lang="en", target_lang="hi")
    print("Hindi Translation:", hindi_translation)

    urdu_translation = translate_text(english_text, source_lang="en", target_lang="ur")
    print("Urdu Translation:", urdu_translation)

    bengali_translation = translate_text(english_text, source_lang="en", target_lang="bn")
    print("Bengali Translation:", bengali_translation)

    punjabi_translation = translate_text(english_text, source_lang="en", target_lang="pa")
    print("Punjabi Translation:", punjabi_translation)

    gujarati_translation = translate_text(english_text, source_lang="en", target_lang="gu")
    print("Gujarati Translation:", gujarati_translation)

    marathi_translation = translate_text(english_text, source_lang="en", target_lang="mr")
    print("Marathi Translation:", marathi_translation)

    afrikaans_translation = translate_text(english_text, source_lang="en", target_lang="af")
    print("Afrikaans Translation:", afrikaans_translation)
