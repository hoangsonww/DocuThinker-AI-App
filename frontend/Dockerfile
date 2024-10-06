# Use an official Node.js runtime as a parent image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code to the container
COPY . .

# Build the React app
RUN npm run build

# Install serve for production build serving
RUN npm install -g serve

# Expose the port the app will run on
EXPOSE 3001

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3001"]
