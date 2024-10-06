# DocuThinker API Documentation

This API allows for document upload, summarization, generating key ideas, discussion points, and an AI-powered chat interface using the Gemini AI model.

## Base URL
```
https://<your-backend-url>
```

---

## 1. **Register User**

### **POST** `/register`

Registers a new user in the system.

- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

- **Response**:
  - **Success (201)**:
    ```json
    {
      "message": "User registered successfully",
      "userId": "<firebase-uid>"
    }
    ```
  - **Error (400)**:
    ```json
    {
      "error": "User registration failed",
      "details": "Email already exists" // (or other Firebase errors)
    }
    ```

---

## 2. **Login User**

### **POST** `/login`

Logs in the user and generates a Firebase custom token.

- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **Response**:
  - **Success (200)**:
    ```json
    {
      "customToken": "<firebase-custom-token>"
    }
    ```
  - **Error (401)**:
    ```json
    {
      "error": "Invalid credentials",
      "details": "User not found" // (or other Firebase errors)
    }
    ```

---

## 3. **Upload Document and Summarize**

### **POST** `/upload`

Uploads a PDF or DOCX document, extracts its text, and returns both the original text and an AI-generated summary.

- **Form Data**:
  - `File`: The document to be uploaded.

- **Response**:
  - **Success (200)**:
    ```json
    {
      "summary": "Summarized text from the document",
      "originalText": "Full extracted text from the document"
    }
    ```
  - **Error (400 or 500)**:
    ```json
    {
      "error": "No file uploaded" // (or other relevant errors)
    }
    ```

---

## 4. **Generate Key Ideas**

### **POST** `/generate-key-ideas`

Generates key ideas from a given document text.

- **Request Body (JSON)**:
  ```json
  {
    "documentText": "Text of the document"
  }
  ```

- **Response**:
  - **Success (200)**:
    ```json
    {
      "keyIdeas": "Generated key ideas from the document"
    }
    ```
  - **Error (500)**:
    ```json
    {
      "error": "Failed to generate key ideas",
      "details": "<error details>"
    }
    ```

---

## 5. **Generate Discussion Points**

### **POST** `/generate-discussion-points`

Generates discussion points from a given document text.

- **Request Body (JSON)**:
  ```json
  {
    "documentText": "Text of the document"
  }
  ```

- **Response**:
  - **Success (200)**:
    ```json
    {
      "discussionPoints": "Generated discussion points from the document"
    }
    ```
  - **Error (500)**:
    ```json
    {
      "error": "Failed to generate discussion points",
      "details": "<error details>"
    }
    ```

---

## 6. **Chat with AI Model**

### **POST** `/chat`

Sends a message to the AI model for a conversational response.

- **Request Body (JSON)**:
  ```json
  {
    "message": "Your message to the AI"
  }
  ```

- **Response**:
  - **Success (200)**:
    ```json
    {
      "response": "AI's conversational response"
    }
    ```
  - **Error (500)**:
    ```json
    {
      "error": "Failed to get AI response",
      "details": "<error details>"
    }
    ```

---

## 7. **Get User's Documents (Placeholder)**

### **GET** `/documents`

Fetches the list of documents for the current user.

- **Response**:
  - **Success (200)**:
    ```json
    {
      "documents": [
        {
          "id": "document-id-1",
          "filename": "Document 1",
          "summary": "Summary of document 1",
          "content": "Full content of document 1"
        },
        {
          "id": "document-id-2",
          "filename": "Document 2",
          "summary": "Summary of document 2",
          "content": "Full content of document 2"
        }
      ]
    }
    ```
  - **Error (500)**:
    ```json
    {
      "error": "Failed to fetch documents",
      "details": "<error details>"
    }
    ```

---

## 8. **Delete Document (Placeholder)**

### **DELETE** `/documents/:docId`

Deletes a document by its ID.

- **Response**:
  - **Success (200)**:
    ```json
    {
      "message": "Document deleted successfully"
    }
    ```
  - **Error (500)**:
    ```json
    {
      "error": "Failed to delete document",
      "details": "<error details>"
    }
    ```

---

## Error Handling

All API endpoints may return the following error structure in case of failure:

- **Error Format**:
  ```json
  {
    "error": "Description of the error",
    "details": "Additional error details (if any)"
  }
  ```

---

