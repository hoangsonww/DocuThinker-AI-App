# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install Firebase CLI globally
RUN npm install -g firebase-tools

# Copy any Firebase configuration (if needed)
COPY . .

# Expose any necessary Firebase ports
EXPOSE 9099 5001

# Start Firebase emulators
CMD ["firebase", "emulators:start"]
