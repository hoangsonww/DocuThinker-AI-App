"""
Utility functions for model inference, post-processing, ensemble outputs,
and safe execution with error handling.
"""

import logging
import time
from typing import Callable, Any, Tuple

logger = logging.getLogger(__name__)


def time_function(func: Callable, *args, **kwargs) -> Tuple[Any, float]:
    """
    Times the execution of a function.

    Returns:
      A tuple (result, elapsed_time) where elapsed_time is in seconds.
    """
    start_time = time.time()
    result = func(*args, **kwargs)
    elapsed_time = time.time() - start_time
    logger.info("Function '%s' executed in %.2f seconds", func.__name__, elapsed_time)
    return result, elapsed_time


def postprocess_text(text: str) -> str:
    """
    Performs basic post-processing on text:
      - Trims extra whitespace.
      - Ensures the text ends with a period.

    Returns:
      The cleaned text.
    """
    if text:
        text = " ".join(text.strip().split())
        if not text.endswith('.'):
            text += '.'
    return text


def ensemble_outputs(outputs: list, method: str = "first") -> str:
    """
    Combines outputs from multiple models.

    Currently supports a simple "first" method that returns the first output.
    You can extend this to support voting or averaging.

    Parameters:
      outputs (list): List of output strings.
      method (str): Ensemble strategy ("first", "vote", etc.).

    Returns:
      The ensembled output as a string.
    """
    if not outputs:
        return ""
    if method == "first":
        return outputs[0]
    # Extend with additional methods as needed.
    return outputs[0]


def safe_execute(func: Callable, *args, **kwargs) -> Tuple[Any, Exception]:
    """
    Safely executes a function and captures exceptions.

    Returns:
      A tuple (result, error), where error is None if the function executed successfully.
    """
    try:
        result = func(*args, **kwargs)
        return result, None
    except Exception as e:
        logger.exception("Error executing function '%s': %s", func.__name__, e)
        return None, e
