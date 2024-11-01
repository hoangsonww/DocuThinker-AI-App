# Stage 1: Base environment setup
FROM node:18-alpine as base

WORKDIR /app

# Install dependencies needed for the app
COPY package.json yarn.lock ./
RUN yarn install

# Copy the entire project
COPY . .

# Stage 2: Development environment
FROM base as development

# Expose default Expo port
EXPOSE 19000 19001 19002

# Start Expo in development mode
CMD ["yarn", "start"]

# Stage 3: Production environment (Web version)
FROM base as production

RUN yarn global add expo-cli

# Build the Expo app for web output
RUN yarn expo export:web

# Serve static files for web
RUN yarn add -D serve

EXPOSE 5000

CMD ["serve", "-s", "web-build", "-l", "5000"]
