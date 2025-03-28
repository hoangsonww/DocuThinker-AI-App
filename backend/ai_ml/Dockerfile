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

# Expose a port for the application
EXPOSE 8000

# Default command (CLI)
CMD ["python", "ai_ml/main.py", "document.txt"]
