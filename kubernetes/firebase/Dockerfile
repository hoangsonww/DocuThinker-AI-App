# Use an official Node.js image as the base, as Firebase CLI requires Node.js
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install the Firebase CLI globally
RUN npm install -g firebase-tools

# Copy the Firebase project files (if any additional files are needed)
COPY . .

# Set permissions on the working directory
RUN chmod -R 755 /app

# Start Firebase CLI in emulators mode (adjust as necessary)
CMD ["firebase", "emulators:start", "--only", "firestore,auth,functions"]
