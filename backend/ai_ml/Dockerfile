# Use an official lightweight Python image
FROM python:3.8-slim

# Set working directory in the container
WORKDIR /app

# Copy the notebook and relevant scripts to the container
COPY . /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install jupyter && \
    pip install transformers==4.21.1 torch==1.11.0 keybert

# Expose port for Jupyter Notebook
EXPOSE 8888

# Start Jupyter Notebook
CMD ["jupyter", "notebook", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--NotebookApp.token=''"]
