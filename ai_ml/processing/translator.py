def translate_text(text, translator, max_length=512):
    """
    Translates the text using the provided translation pipeline.
    """
    translation_result = translator(text, max_length=max_length)
    return translation_result[0]["translation_text"]
