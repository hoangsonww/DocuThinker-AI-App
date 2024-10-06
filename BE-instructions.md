# Backend API Documentation

## Base URL
`https://docuthinker-ai-app.onrender.com`

---

## 1. Register User

### **POST** `/register`

Registers a new user in Firebase.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response (Success)
```json
{
  "message": "User registered successfully",
  "userId": "uniqueUserId"
}
```

#### Response (Error)
```json
{
  "error": "User registration failed",
  "details": "Error details here"
}
```

---

## 2. Login User and Generate Custom Token

### **POST** `/login`

Generates a custom token for a registered user.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response (Success)
```json
{
  "customToken": "firebase-custom-token"
}
```

#### Response (Error)
```json
{
  "error": "Invalid credentials",
  "details": "Error details here"
}
```

---

## 3. Upload Document and Summarize

### **POST** `/upload`

Uploads a document (PDF or DOCX), summarizes it, and returns both the summary and original text. **This route does not store the document.**

#### Request Example

```bash
curl --location 'https://docuthinker-ai-app.onrender.com/upload' \
--form 'File=@"path/to/your/document.pdf"'
```

#### Request Body (form-data)
- `File`: The file being uploaded (PDF or DOCX).

#### Response (Success)
```json
{
  "message": "Document summarized",
  "summary": "Generated summary here",
  "originalText": "Original document text here"
}
```

#### Response (Error)
```json
{
  "error": "Failed to upload and summarize the document",
  "details": "Error details here"
}
```

---

## 4. Generate Key Ideas from Document Text

### **POST** `/generate-key-ideas`

Generates key ideas from a provided text document.

#### Request Body
```json
{
  "documentText": "The text of the document goes here."
}
```

#### Response (Success)
```json
{
  "keyIdeas": "Generated key ideas from the document"
}
```

#### Response (Error)
```json
{
  "error": "Failed to generate key ideas",
  "details": "Error details here"
}
```

---

## 5. Generate Discussion Points from Document Text

### **POST** `/generate-discussion-points`

Generates discussion points from the provided text document.

#### Request Body
```json
{
  "documentText": "The text of the document goes here."
}
```

#### Response (Success)
```json
{
  "discussionPoints": "Generated discussion points from the document"
}
```

#### Response (Error)
```json
{
  "error": "Failed to generate discussion points",
  "details": "Error details here"
}
```

---

## 6. Chat with AI Model

### **POST** `/chat`

Send a message to the AI model for a conversational response.

#### Request Body
```json
{
  "message": "Your message to the AI goes here."
}
```

#### Response (Success)
```json
{
  "response": "AI's conversational response"
}
```

#### Response (Error)
```json
{
  "error": "Failed to get response from the model",
  "details": "Error details here"
}
```

---

## 7. Error Handling for Unsupported Routes

### **Response (404 - Not Found)**
```json
{
  "error": "Route not found"
}
```

---

## 8. Global Error Handler

If any internal server error occurs, this global handler will return a 500 status code.

### **Response (500 - Internal Server Error)**
```json
{
  "error": "An internal error occurred",
  "details": "Detailed error message here"
}
```

---

## Notes
- All routes use JSON responses.
- When uploading files, ensure the `File` key in the form-data matches what is expected.
- All endpoints respond with appropriate status codes: 200 for success, 400 for bad requests, 404 for not found, and 500 for internal server errors.
