# DocuThinker Backend Documentation

The **DocuThinker Backend** is the server-side component of the DocuThinker application that handles user registration, login, document processing, AI interactions, and email verification. This backend is built using Node.js, Express, Firebase for authentication, and Google Generative AI for document summarization and key ideas generation. The backend also uses Swagger for API documentation.

The backend is currently hosted on Render and can be accessed at [https://docuthinker-ai-app.onrender.com](https://docuthinker-ai-app.onrender.com).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [File Structure](#file-structure)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Testing the API](#testing-the-api)
- [Swagger](#swagger)
- [Error Handling](#error-handling)

## Features

- **User Registration & Authentication**: Using Firebase for authentication.
- **Document Upload & Summarization**: Supports PDF and Word documents.
- **AI-Driven Key Ideas & Discussion Points**: Google Generative AI.
- **Password Reset Functionality**: Email-based password reset.
- **Swagger API Documentation**: Self-documenting APIs using Swagger UI.
- **JWT Authentication**: Secured routes using Bearer tokens.

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Firebase Admin SDK** credentials
- **Google Generative AI** credentials
- **.env** file with necessary API keys

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/hoangsonww/DocuThinker-AI-App.git
   cd DocuThinker-AI-App/backend
   ```

2. **Install dependencies**:
   Using npm:
   ```bash
   npm install
   ```
   or using Yarn:
   ```bash
   yarn install
   ```

## Environment Variables

Make sure to create a `.env` file in the `backend` or `root` directory. Here’s an example of what your `.env` should contain:

```bash
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abcde@your-firebase-project-id.iam.gserviceaccount.com

GOOGLE_AI_API_KEY=your-google-generative-ai-api-key
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

Make sure to replace these values with your Firebase and Google Generative AI credentials.

## Running the Server

1. **Start the development server**:

   ```bash
   npm run dev
   ```

   or if using **yarn**:

   ```bash
   yarn dev
   ```

2. The server will be running on `http://localhost:3000` by default.

## File Structure

The backend of **DocuThinker** is structured in a modular way to keep the codebase clean and organized. It follows the **MVC (Model-View-Controller)** pattern for better separation of concerns.
Here’s a breakdown of the file structure:

```
DocuThinker-AI-App/
├── backend/
│   ├── controllers.js        # Controls the flow of data and logic
│   ├── models.js             # Represents the data, logic, and rules of the application
│   ├── services.js           # Models for interacting with database and AI/ML services
│   ├── views.js              # Output formatting for success and error responses
│   ├── .env                  # Environment variables (git-ignored)
│   ├── index.js              # Main entry point for the server
│   └── README.md             # This file
```

- `controllers/`: Contains the core business logic for each route.
- `models/`: Contains the interaction logic with Firebase and Google Generative AI.
- `views/`: Contains helper functions to format success and error responses.
- `routes/`: Contains all the route definitions.
- `swagger/`: Contains Swagger configurations for API documentation.

## API Documentation

Once the server is running, you can access the full API documentation via **Swagger** at:

```
http://localhost:3000/api-docs
```

Here you’ll find all the available routes, their request formats, and responses.

## API Endpoints

The backend of **DocuThinker** provides the following API endpoints:

| **Method** | **Endpoint**                         | **Description**                                                                                     |
| ---------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| POST       | `/register`                          | Register a new user in Firebase Authentication and Firestore, saving their email and creation date. |
| POST       | `/login`                             | Log in a user and return a custom token along with the user ID.                                     |
| POST       | `/upload`                            | Upload a document for summarization. If the user is logged in, the document is saved in Firestore.  |
| POST       | `/generate-key-ideas`                | Generate key ideas from the document text.                                                          |
| POST       | `/generate-discussion-points`        | Generate discussion points from the document text.                                                  |
| POST       | `/chat`                              | Chat with AI using the original document text as context.                                           |
| POST       | `/forgot-password`                   | Reset a user's password in Firebase Authentication.                                                 |
| POST       | `/verify-email`                      | Verify if a user's email exists in Firestore.                                                       |
| GET        | `/documents/{userId}`                | Retrieve all documents associated with the given `userId`.                                          |
| GET        | `/documents/{userId}/{docId}`        | Retrieve a specific document by `userId` and `docId`.                                               |
| GET        | `/document-details/{userId}/{docId}` | Retrieve document details (title, original text, summary) by `userId` and `docId`.                  |
| DELETE     | `/delete-document/{userId}/{docId}`  | Delete a specific document by `userId` and `docId`.                                                 |
| DELETE     | `/delete-all-documents/{userId}`     | Delete all documents associated with the given `userId`.                                            |
| POST       | `/update-email`                      | Update a user's email in both Firebase Authentication and Firestore.                                |
| POST       | `/update-password`                   | Update a user's password in Firebase Authentication.                                                |
| GET        | `/days-since-joined/{userId}`        | Get the number of days since the user associated with `userId` joined the service.                  |
| GET        | `/document-count/{userId}`           | Retrieve the number of documents associated with the given `userId`.                                |
| GET        | `/user-email/{userId}`               | Retrieve the email of a user associated with `userId`.                                              |

### Authentication

Routes that require authentication (such as uploading documents or generating insights) need a **Bearer token** provided in the `Authorization` header.

Example:

```bash
Authorization: Bearer <your-jwt-token>
```

### Testing the API

You can test the API using tools like **Postman** or **curl**.

#### Example Request to Register a User:

```bash
curl --location --request POST 'http://localhost:3000/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@example.com",
    "password": "password123"
}'
```

#### Example Request to Upload a Document:

```bash
curl --location --request POST 'http://localhost:3000/upload' \
--header 'Authorization: Bearer <your-token>' \
--form 'File=@"/path/to/your/file.pdf"'
```

## Swagger

The backend of DocuThinker comes with self-documenting APIs using **Swagger**.

- You can interact with the APIs at `http://localhost:3000/api-docs`.
- This Swagger documentation is automatically generated from the JSDoc comments in `index.js` and `controllers.js`.

### Authorization

For routes that require authentication, you’ll need to provide a Bearer token using JWT.

- The **Authorize** button in the Swagger UI allows you to provide the token.
- To test authenticated routes, make sure to log in and copy the generated token.

## Error Handling

The backend uses centralized error handling to capture and log errors. Responses for failed requests are returned with a proper status code and an error message:

```json
{
  "error": "An internal error occurred",
  "details": "Error details go here"
}
```

## Contributing

1. **Fork the repo**
2. **Create a new branch**: `git checkout -b feature-branch`
3. **Commit your changes**: `git commit -m 'Add new feature'`
4. **Push the branch**: `git push origin feature-branch`
5. **Submit a pull request**

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial License** - see the [LICENSE](LICENSE.md) file for details.

---

Happy coding! 🚀
