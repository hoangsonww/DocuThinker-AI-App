# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies (e.g., build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
 && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the dependency file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . .

# Expose a port if you later integrate a webserver (e.g., with FastAPI/Uvicorn)
# EXPOSE 8000

# Define the default command.
# This example runs the CLI entry point with a sample document.
# Adjust the command and arguments as needed.
CMD ["python", "ai_ml/main.py", "document.txt", "--question", "What is the main idea?", "--translate_lang", "de"]
