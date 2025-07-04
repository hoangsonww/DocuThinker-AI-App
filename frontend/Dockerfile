# Use Node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only frontend files
COPY ./frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy rest of the frontend app
COPY ./frontend .

# Build production React app
RUN npm run build

# Install serve to serve static build
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Start
CMD ["serve", "-s", "build", "-l", "3001"]
