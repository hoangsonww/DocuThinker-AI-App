"""
Helper functions for ONNX model management.

These functions allow you to check if an ONNX model exists in the expected directory
and to construct file paths based on task names (and language codes for translation).
"""

import os


def check_onnx_model_exists(model_path: str) -> bool:
    """
    Checks if an ONNX model exists in the specified directory.

    Assumes that the exported ONNX model file is named 'model.onnx'.

    Parameters:
      model_path (str): The directory path where the ONNX model is expected.

    Returns:
      bool: True if the 'model.onnx' file exists, False otherwise.
    """
    onnx_file = os.path.join(model_path, "model.onnx")
    return os.path.exists(onnx_file)


def get_onnx_model_path(task: str, extra: str = "") -> str:
    """
    Constructs the file path for an ONNX model based on the task and an optional extra string.

    For example, for translation models, `extra` can be the target language code.

    Parameters:
      task (str): The task identifier (e.g., 'summarizer', 'qa', 'discussion', etc.).
      extra (str): Optional extra string to append (e.g., language code).

    Returns:
      str: The constructed ONNX model path.
    """
    base_dir = "onnx_models"
    if extra:
        return os.path.join(base_dir, task, extra)
    return os.path.join(base_dir, task)
