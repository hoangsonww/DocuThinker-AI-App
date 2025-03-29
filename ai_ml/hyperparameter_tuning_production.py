#!/usr/bin/env python
import os
import json
import logging
import optuna
import numpy as np
import requests
from transformers import pipeline
from rouge_score import rouge_scorer

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Public URL for validation data.
# For production, this endpoint should return a JSON list of objects with keys "document" and "reference_summary".
VALIDATION_DATA_URL = "https://raw.githubusercontent.com/optuna/optuna-tutorial/main/validation_data.json"

# File where the best hyperparameters will be saved.
BEST_PARAMS_FILE = "best_params.json"


def fetch_validation_data():
    """
    Fetch validation data from the public URL.
    Expected format: a JSON list of objects with keys 'document' and 'reference_summary'.
    """
    try:
        logger.info("Fetching validation data from %s", VALIDATION_DATA_URL)
        response = requests.get(VALIDATION_DATA_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info("Fetched %d validation examples.", len(data))
        return [(item["document"], item["reference_summary"]) for item in data]
    except Exception as e:
        logger.error("Failed to fetch validation data: %s", e)
        raise RuntimeError("Unable to load validation data for hyperparameter tuning.")


def objective(trial):
    # Suggest hyperparameters for the summarization pipeline.
    max_length = trial.suggest_int("max_length", 50, 200)
    min_length = trial.suggest_int("min_length", 20, max_length - 10)
    do_sample = trial.suggest_categorical("do_sample", [True, False])
    temperature = trial.suggest_float("temperature", 0.7, 1.5) if do_sample else 1.0

    # Create the summarization pipeline.
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

    # Use ROUGE-L as the evaluation metric.
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)

    validation_data = fetch_validation_data()
    scores = []
    for doc, ref in validation_data:
        try:
            summary = summarizer(
                doc,
                max_length=max_length,
                min_length=min_length,
                do_sample=do_sample,
                temperature=temperature
            )[0]["summary_text"]
            # Compute ROUGE-L F-measure.
            score = scorer.score(ref, summary)["rougeL"].fmeasure
            scores.append(score)
        except Exception as e:
            logger.error("Error processing validation sample: %s", e)
            continue

    average_score = np.mean(scores) if scores else 0.0
    logger.info("Trial average ROUGE-L F-measure: %.4f", average_score)
    return average_score


def save_best_params(params: dict):
    """
    Saves the best hyperparameters to a JSON file.
    """
    with open(BEST_PARAMS_FILE, "w") as f:
        json.dump(params, f, indent=4)
    logger.info("Saved best hyperparameters to %s", BEST_PARAMS_FILE)


def main():
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=20)
    best_trial = study.best_trial
    logger.info("Best Trial ROUGE-L F-measure: %.4f", best_trial.value)
    logger.info("Best Hyperparameters: %s", best_trial.params)
    save_best_params(best_trial.params)


if __name__ == "__main__":
    main()
