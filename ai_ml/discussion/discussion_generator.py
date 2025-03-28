def generate_discussion_points(text, discussion_chain):
    """
    Generates discussion points for the given text using the discussion chain.
    """
    discussion = discussion_chain.run(text=text)
    return discussion.strip()
