# **DocuThinker - AI-Powered Document Analysis and Summarization App**

Welcome to **DocuThinker**! This is a full-stack **(FERN-Stack)** application that integrates an AI-powered document processing backend with a React-based frontend. The app allows users to upload documents for summarization, generate key insights, and chat with an AI based on the document's content.

<p align="center">
  <img src="images/logo.png" alt="DocuThinker" width="50%" style="border-radius: 8px">
</p>

## **📚 Table of Contents**

- [**📖 Overview**](#-overview)
- [**✨ Features**](#features)
- [**⚙️ Technologies**](#technologies)
- [**🖼️ User Interface**](#user-interface)
    - [**Landing Page**](#landing-page)
    - [**Landing Page - Dark Mode**](#landing-page---dark-mode)
    - [**Document Upload Page**](#document-upload-page)
    - [**Document Upload Page - Dark Mode**](#document-upload-page---dark-mode)
    - [**Home Page**](#home-page)
    - [**Home Page - Dark Mode**](#home-page---dark-mode)
    - [**Home Page - With Key Ideas**](#home-page---with-key-ideas)
    - [**Chat Modal**](#chat-modal)
    - [**Chat Modal - Dark Mode**](#chat-modal---dark-mode)
    - [**How To Use Page**](#how-to-use-page)
    - [**How To Use Page - Dark Mode**](#how-to-use-page---dark-mode)
    - [**Login Page**](#login-page)
    - [**Login Page - Dark Mode**](#login-page---dark-mode)
    - [**Registration Page**](#registration-page)
    - [**Registration Page - Dark Mode**](#registration-page---dark-mode)
    - [**Forgot Password Page**](#forgot-password-page)
    - [**Forgot Password Page - Dark Mode**](#forgot-password-page---dark-mode)
    - [**Responsive Design Example**](#responsive-design-example)
- [**📂 Complete File Structure**](#complete-file-structure)
- [**🛠️ Getting Started**](#getting-started)
    - [**Prerequisites**](#prerequisites)
    - [**Frontend Installation**](#frontend-installation)
    - [**Backend Installation**](#backend-installation)
- [**📋 API Endpoints**](#api-endpoints)
    - [**API Documentation**](#api-documentation)
- [**📦 Containerization**](#containerization)
- [**🚀 Deployment**](#deployment)
    - [**Frontend Deployment (Vercel)**](#frontend-deployment-vercel)
    - [**Live Deployments**](#live-deployments)
    - [**Backend Deployment (Render)**](#backend-deployment-render)
    - [**Important Note about Backend Deployment (Please Read)**](#important-note-about-backend-deployment)
- [**🔧 Contributing**](#contributing)
- [**📝 License**](#license)
- [**👨‍💻 Author**](#author)

<h2 id="-overview">📖 Overview</h2>

The **DocuThinker** app is designed to provide users with a simple, AI-powered document management tool. Users can upload PDFs or Word documents and receive summaries, key insights, and discussion points. Additionally, users can chat with an AI using the document's content for further clarifications.

**DocuThinker** is created using the **FERN-Stack** architecture, which stands for **Firebase, Express, React, and Node.js**. The backend is built with Node.js and Express, integrating Firebase for user authentication and MongoDB for data storage. The frontend is built with React and Material-UI, providing a responsive and user-friendly interface.

It is currently deployed live on **Vercel** and **Render**. You can access the live app **[here](https://docuthinker-fullstack-app.vercel.app/)**.

[![Deployed with Vercel](https://img.shields.io/badge/Deployed%20with-Vercel-green)](https://vercel.com)
[![Render Success](https://img.shields.io/badge/Render-Success-green)](https://render.com)
[![Netlify Backup Deployed](https://img.shields.io/badge/Netlify-Backup%20Deployed-green)](https://www.netlify.com)
[![Firebase Functional](https://img.shields.io/badge/Firebase-Functional-green)](https://firebase.google.com)
[![MongoDB Connected](https://img.shields.io/badge/MongoDB-Connected-green)](https://www.mongodb.com)

<h2 id="features">✨ Features</h2>

- **Document Upload & Summarization**: Upload PDFs or Word documents for AI-generated summaries.
- **Key Insights & Discussion Points**: Generate important ideas and topics for discussion from your documents.
- **AI Chat Integration**: Chat with an AI using your document’s original context.
- **User Authentication**: Secure registration, login, and password reset functionality.
- **Responsive Design**: Seamless experience across both desktop and mobile devices.
- **Dark Mode Support**: Toggle between light and dark themes.
- **How To Use Guide**: Detailed instructions on how to use the app effectively.
- **API Documentation**: Swagger documentation for all API endpoints.
- **Error Handling**: Custom error messages and alerts for better user experience.
- **Loading Spinners**: Visual feedback during document processing and API calls.
- **Authentication Middleware**: Secure routes with Firebase authentication middleware.
- **Environment Variables**: Securely store sensitive data using environment variables.
- **Containerization**: Dockerize the app for easy deployment and scaling.
- **Continuous Integration**: Automated testing and deployment with GitHub Actions.

<h2 id="technologies">⚙️ Technologies</h2>

- **Frontend**:
  - **React**: JavaScript library for building user interfaces.
  - **Material-UI**: React components for faster and easier web development.
  - **Axios**: Promise-based HTTP client for making API requests.
  - **React Router**: Declarative routing for React applications.
  - **Context API**: State management for React applications.
  - **React Redux**: State container for JavaScript apps.
- **Backend**:
  - **Express**: Web application framework for Node.js.
  - **Firebase Admin SDK**: Firebase services for server-side applications.
  - **Node.js**: JavaScript runtime for building scalable network applications.
  - **Firebase Authentication**: Secure user authentication with Firebase.
  - **Firebase Auth JWT**: Generate custom tokens for Firebase authentication.
- **Database**:
  - **MongoDB**: NoSQL database for storing user data and documents.
  - **Firestore**: Cloud Firestore for storing user data and documents.
- **API Documentation**:
  - **Swagger**: OpenAPI documentation for all API endpoints.
- **Containerization**:
  - **Docker**: Containerization platform for building, shipping, and running applications.
- **Continuous Integration**:
  - **GitHub Actions**: Automated workflows for testing and deployment.
  - **Render**: Cloud platform for hosting and scaling web applications. (Used to deploy the backend)
  - **Vercel**: Cloud platform for hosting and deploying web applications. (Used to deploy the frontend)
  - **Netlify**: Cloud platform for hosting and deploying web applications. (Used as a backup)
  - **Firebase**: Cloud platform for building web and mobile applications.

<h2 id="user-interface">🖼️ User Interface</h2>

**DocuThinker** features a clean and intuitive user interface designed to provide a seamless experience for users. The app supports both light and dark themes, responsive design, and easy navigation. Here are some screenshots of the app:

### **Landing Page**

<p align="center">
  <img src="images/landing.png" alt="Landing Page" width="100%" style="border-radius: 8px">
</p>

### **Landing Page - Dark Mode**

<p align="center">
  <img src="images/landing-dark.png" alt="Landing Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Document Upload Page**

<p align="center">
  <img src="images/upload.png" alt="Document Upload Page" width="100%" style="border-radius: 8px">
</p>

### **Document Upload Page - Dark Mode**

<p align="center">
  <img src="images/upload-dark.png" alt="Document Upload Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Home Page**

<p align="center">
  <img src="images/home.png" alt="Home Page" width="100%" style="border-radius: 8px">
</p>

### **Home Page - Dark Mode**

<p align="center">
  <img src="images/home-dark.png" alt="Home Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Home Page - With Key Ideas**

<p align="center">
  <img src="images/home-with-key-ideas.png" alt="Home Page - With Key Ideas" width="100%" style="border-radius: 8px">
</p>

### **Chat Modal**

<p align="center">
  <img src="images/chat.png" alt="Chat Modal" width="100%" style="border-radius: 8px">
</p>

### **Chat Modal - Dark Mode**

<p align="center">
  <img src="images/chat-dark.png" alt="Chat Modal - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **How To Use Page**

<p align="center">
  <img src="images/how-to-use.png" alt="How To Use Page" width="100%" style="border-radius: 8px">
</p>

### **How To Use Page - Dark Mode**

<p align="center">
  <img src="images/how-to-use-dark.png" alt="How To Use Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Login Page**

<p align="center">
  <img src="images/login.png" alt="Login Page" width="100%" style="border-radius: 8px">
</p>

### **Login Page - Dark Mode**

<p align="center">
  <img src="images/login-dark.png" alt="Login Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Registration Page**

<p align="center">
  <img src="images/register.png" alt="Registration Page" width="100%" style="border-radius: 8px">
</p>

### **Registration Page - Dark Mode**

<p align="center">
  <img src="images/register-dark.png" alt="Registration Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Forgot Password Page**

<p align="center">
  <img src="images/forgot-password.png" alt="Forgot Password Page" width="100%" style="border-radius: 8px">
</p>

### **Forgot Password Page - Dark Mode**

<p align="center">
  <img src="images/forgot-password-dark.png" alt="Forgot Password Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Responsive Design Example**

<p align="center">
  <img src="images/responsive.png" alt="Responsive Design" width="50%" style="border-radius: 8px">
</p>

<h2 id="complete-file-structure">📂 Complete File Structure</h2>

```
DocuThinker-AI-App/
├── backend/
│   ├── controllers.js          # API controllers for business logic
│   ├── models.js               # Data models and interaction with Firebase and AI
│   ├── views.js                # Helper functions for formatting API responses
│   ├── index.js                # Main server entry point
│   ├── .env                    # Environment variables for backend
│   ├── README.md               # Backend documentation
├── frontend/
│   ├── public/
│   │   ├── index.html          # Main HTML template
│   │   └── manifest.json       # Manifest for PWA settings
│   ├── src/
│   │   ├── assets/             # Static assets such as images and fonts
│   │   ├── components/         # Reusable components like ChatModal, Navbar, Footer
│   │   ├── pages/              # Pages such as Home, Login, Register
│   │   ├── App.js              # Main App component
│   │   ├── index.js            # Entry point for the React app
│   │   ├── styles.css          # Custom styles
│   ├── .env                    # Environment variables for frontend
│   ├── package.json            # Frontend dependencies
│   ├── README.md               # Frontend documentation
├── README.md                   # Comprehensive README for the whole app
```

<h2 id="getting-started">🛠️ Getting Started</h2>

### **Prerequisites**

Ensure you have the following tools installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Firebase Admin SDK** credentials
- **Google Generative AI** credentials

### **Frontend Installation**

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the React app**:
   ```bash
   npm start
   ```

### **Backend Installation**

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the backend server**:
   ```bash
   npm run dev
   ```

<h2 id="api-endpoints">📋 API Endpoints</h2>

| HTTP Method | Endpoint                      | Description                                   | Auth Required |
|-------------|-------------------------------|-----------------------------------------------|---------------|
| POST        | `/register`                   | Register a new user                           | No            |
| POST        | `/login`                      | Login a user and generate a custom token      | No            |
| POST        | `/upload`                     | Upload a document for summarization           | Yes           |
| POST        | `/generate-key-ideas`         | Generate key ideas from document text         | Yes           |
| POST        | `/generate-discussion-points` | Generate discussion points from document text | Yes           |
| POST        | `/chat`                       | Chat with AI using document context           | Yes           |
| POST        | `/forgot-password`            | Reset a user's password                       | No            |
| POST        | `/verify-email`               | Verify if a user's email exists               | No            |
| GET         | `/user`                       | Get user details                              | Yes           |
| GET         | `/logout`                     | Logout a user                                 | Yes           |
| GET         | `/api-docs`                   | Swagger API documentation                     | No            |
| GET         | `/api-docs/redoc`             | Redoc API documentation                       | No            |
| GET         | `/`                           | Test route for backend server                 | No            |
| PUT         | `/update-password`            | Update a user's password                      | Yes           |
| PUT         | `/update-email`               | Update a user's email                         | Yes           |
| PUT         | `/update-name`                | Update a user's name                          | Yes           |
| PUT         | `/update-avatar`              | Update a user's avatar                        | Yes           |
| DELETE      | `/delete-account`             | Delete a user's account                       | Yes           |
| DELETE      | `/delete-document`            | Delete a user's document                      | Yes           |
| DELETE      | `/delete-all-documents`       | Delete all user documents                     | Yes           |
| DELETE      | `/delete-all-users`           | Delete all users                              | Yes           |
| DELETE      | `/delete-all-data`            | Delete all user data                          | Yes           |

### API Documentation

- **Swagger Documentation**: You can access the Swagger documentation for all API endpoints by running the backend server and navigating to `http://localhost:5000/api-docs`.
- **Redoc Documentation**: You can access the Redoc documentation for all API endpoints by running the backend server and navigating to `http://localhost:5000/api-docs/redoc`.

For example, our API endpoints documentation looks like this:

<p align="center">
  <img src="images/swagger.png" alt="Swagger Documentation" width="100%" style="border-radius: 8px">
</p>

<h2 id="containerization">📦 Containerization</h2>

The **DocuThinker** app can be containerized using **Docker** for easy deployment and scaling. Follow these steps to containerize the app:

1. Run the following command to build the Docker image:
   ```bash
   docker compose up --build
   ```
   
2. The app will be containerized and ready to run on port 3000.

<h2 id="deployment">🚀 Deployment</h2>

### **Frontend Deployment (Vercel)**

1. **Install the Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy the frontend**:
   ```bash
   vercel
   ```

3. **Follow the instructions in your terminal to complete the deployment**.

### **Live Deployments**

- We have deployed the app live on **Vercel** and **Render**. You can access the live app **[here](https://docuthinker-fullstack-app.vercel.app/)**.
- Additionally, we are also using **Netlify** for backups and testing. You can access the backup app **[here](https://docuthinker-ai-app.netlify.app/)**.

### **Backend Deployment (Render)**

- The backend can be deployed on platforms like **Heroku**, **Render**, or **Vercel**.

- Currently, we are using **Render** to host the backend. You can access the live backend **[here](https://docuthinker-ai-app.onrender.com/)**.

### **Important Note about Backend Deployment**

- Please note that we are currently on the **Free Tier** of **Render**. This means that the backend server may take a few seconds to wake up if it has been inactive for a while.

- Therefore, the first API call may take a bit longer to respond. Subsequent calls should be faster as the server warms up. It is completely normal to take up to 2 minutes for the first API call to respond.

<h2 id="contributing">🔧 Contributing</h2>

We welcome contributions from the community! Follow these steps to contribute:

1. **Fork the repository**.
2. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push the changes**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Submit a pull request**.

We will review your changes and merge them into the main branch shortly.

<h2 id="license">📝 License</h2>

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE.md) file for details.

<h2 id="author">👨‍💻 Author</h2>

- **[Son Nguyen](https://github.com/hoangsonww)**
- Feel free to connect with me on **[LinkedIn](https://www.linkedin.com/in/hoangsonw/)**.
- If you have any questions or feedback, please feel free to reach out to me at **[hoangson091104@gmail.com](mailto:hoangson091104@gmail.com)**.

---

**Happy Coding and Analyzing! 🎶**

**Created with ❤️ by [Son Nguyen](https://github.com/hoangsonww) in 2024.**

---

[🔝 Back to Top](#docuthinker---ai-powered-document-analysis-and-summarization-app)
