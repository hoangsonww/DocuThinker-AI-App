### Instructions to Start the Backend (BE) Server for the **DocuThinker** App

Before starting the backend server, ensure that you have set up everything correctly and installed the required dependencies. Here’s a step-by-step guide to get the server up and running:

---

### **1. Set Up Environment Variables**

Make sure you have an **`.env`** file in the root directory with the following variables properly set:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:3000

HUGGINGFACE_API_KEY=your-huggingface-api-key
OPENAI_API_KEY=your-openai-api-key
```

Replace the placeholder values with the correct credentials:
- **Google OAuth** credentials for Google Drive integration.
- **Hugging Face API** key for summarization.
- **OpenAI API** key for brainstorming ideas.

---

### **2. Install Dependencies**

If you haven't installed the required dependencies for the backend, run the following command in the project root directory:

```bash
npm install
```

This will install:
- **Express.js**: Main server framework.
- **formidable**: For handling file uploads.
- **pdf-parse**: For extracting text from PDF files.
- **mammoth**: For extracting text from DOCX files.
- **axios**: For making HTTP requests to external APIs like Hugging Face and OpenAI.
- **googleapis**: For interacting with Google OAuth and Google Drive.
- **dotenv**: For loading environment variables.

---

### **3. Start the Express.js Server**

Once everything is set up, you can start the backend Express.js server by running the following command:

```bash
node src/app/api/index.js
```

This will start the server on **http://localhost:3000** by default, and you'll see the following message in the terminal if everything works correctly:

```
Server ready on port 3000.
```

---

### **4. Testing the Server**

Once the server is running, you can use **Postman** or **curl** to test the endpoints as described earlier, such as:

- **File Upload** (`POST /upload`)
- **Google Drive Files List** (`GET /google/files`)
- **Summarization** (`POST /summarize`)

You should see the responses in the terminal and on Postman when the endpoints are successfully accessed.

---

### **5. Optional: Use Vercel CLI for Local Testing**

You can also test how the app would run on Vercel’s serverless platform by using the **Vercel CLI**:

1. Install the **Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. Start a local development server using Vercel:
   ```bash
   vercel dev
   ```

This simulates a Vercel environment locally so you can see how the app will behave once deployed.

---

### **6. Debugging and Logs**

- If any endpoint fails, check the **logs** in the terminal where the server is running.
- Verify that the **environment variables** are correctly loaded (use `console.log(process.env)` if needed).
- Make sure all **dependencies** are properly installed (`npm install` again if necessary).

---

By following these steps, you should be able to start the Express.js backend server for your DocuThinker app and test its API endpoints locally before deploying to Vercel. Let me know if you have any questions or need further assistance!