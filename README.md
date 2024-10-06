### **Summary of Backend (BE) Endpoints and How Frontend (FE) Can Use Them**

Here is a summary of the backend API endpoints for your Express.js application, along with the expected responses and how the frontend can use them.

---

### **1. File Upload and Text Extraction Endpoint**

**Endpoint**: `POST /upload`

**Description**: Allows the user to upload a **PDF** or **DOCX** file, which is then processed to extract the text.

**Request**:
- **Method**: `POST`
- **Body (multipart/form-data)**: File input as `file`

**Example Request** (Form Data):
```form-data
{
  "file": <uploaded PDF or DOCX file>
}
```

**Response**:
- **Success**: Returns the extracted text from the uploaded file.
```json
{
  "text": "Extracted text from the document."
}
```

**Frontend Usage**:
- The frontend can provide a **file input** (e.g., drag-and-drop or form upload) that sends the file to this endpoint for processing. The response can be displayed on the UI to show the extracted text.

---

### **2. Google OAuth2 Authentication URL**

**Endpoint**: `GET /google/auth`

**Description**: Provides the Google OAuth2 URL that the frontend can use to authenticate the user with Google Drive.

**Request**:
- **Method**: `GET`

**Response**:
- **Success**: Returns a URL that the frontend should redirect the user to for authentication.
```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

**Frontend Usage**:
- When the user initiates a Google Drive file upload, the frontend should send a `GET` request to this endpoint to retrieve the OAuth URL. The user will be redirected to this URL to complete the OAuth2 flow.

---

### **3. Google OAuth2 Callback**

**Endpoint**: `GET /google/callback`

**Description**: Handles the OAuth2 callback after the user authenticates with Google Drive. Exchanges the authorization code for access tokens.

**Request**:
- **Method**: `GET`
- **Query Parameter**: `code` (Google OAuth2 authorization code)

**Example Request**:
```url
GET /google/callback?code=YOUR_AUTH_CODE
```

**Response**:
- **Success**: Returns a message with the access tokens.
```json
{
  "message": "Authenticated successfully",
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    ...
  }
}
```

**Frontend Usage**:
- After authentication with Google, Google will redirect the user back to the frontend with an authorization `code`. The frontend should send this `code` to the backend to complete the OAuth flow and obtain tokens.

---

### **4. List Google Drive Files**

**Endpoint**: `GET /google/files`

**Description**: Retrieves a list of files from the user's Google Drive.

**Request**:
- **Method**: `GET`

**Response**:
- **Success**: Returns a list of Google Drive files.
```json
{
  "files": [
    { "id": "fileId1", "name": "file1.pdf", "mimeType": "application/pdf" },
    { "id": "fileId2", "name": "file2.docx", "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  ]
}
```

**Frontend Usage**:
- Once authenticated, the frontend can display the user's Google Drive files by sending a `GET` request to this endpoint and rendering the file list on the UI.

---

### **5. Download and Process Google Drive File**

**Endpoint**: `POST /google/download`

**Description**: Downloads a file from Google Drive and extracts text from it.

**Request**:
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "fileId": "fileId1",
  "mimeType": "application/pdf"
}
```

**Response**:
- **Success**: Returns the extracted text from the Google Drive file.
```json
{
  "text": "Extracted text from the Google Drive file"
}
```

**Frontend Usage**:
- The user can select a Google Drive file, and the frontend sends a `POST` request with the `fileId` and `mimeType`. The backend will return the extracted text, which can be displayed on the UI.

---

### **6. Text Summarization**

**Endpoint**: `POST /summarize`

**Description**: Sends extracted text to a summarization model (e.g., Hugging Face BART) and returns the summary.

**Request**:
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "text": "This is the extracted text to summarize."
}
```

**Response**:
- **Success**: Returns the summarized text.
```json
{
  "summary": "Summarized text"
}
```

**Frontend Usage**:
- The frontend can take extracted text from the file and send it to the backend for summarization. The summary can be displayed in the UI once the response is received.

---

### **7. Brainstorming Ideas**

**Endpoint**: `POST /brainstorm`

**Description**: Generates brainstorming ideas based on provided text using OpenAI.

**Request**:
- **Method**: `POST`
- **Body (JSON)**:
```json
{
  "text": "This is the text to generate brainstorming ideas from."
}
```

**Response**:
- **Success**: Returns a list of brainstorming ideas.
```json
{
  "ideas": "Here are some key points to consider: ..."
}
```

**Frontend Usage**:
- The frontend can send summarized text or any other relevant text to this endpoint, and the generated brainstorming ideas can be displayed in the UI as key points or suggestions.

---

### **Example of Extracted Text:**

Here’s an example of text extracted from a sample document:

```json
{
  "text": "\n\nDear Son,\nCongratulations! It is a pleasure to officially inform you of your acceptance to the College of Arts and Science’s\nComputer Science Major degree program! ...\n"
}
```

This text can then be sent to the summarization and brainstorming endpoints to generate more concise summaries or generate ideas based on the document's content.

---

### **Frontend Workflow Overview:**

1. **Upload File** → `/upload` (for manual uploads) or `/google/download` (for Google Drive files)
2. **Display Extracted Text** → Render the text response in the frontend.
3. **Summarize Text** → `/summarize` to get a summarized version of the text.
4. **Brainstorm Ideas** → `/brainstorm` to generate key points or discussion questions based on the text.

This allows the user to upload files, see extracted content, and generate useful summaries and brainstorming ideas through a seamless integration between the backend and frontend.

