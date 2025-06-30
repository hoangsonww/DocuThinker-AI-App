# **DocuThinker - AI-Powered Document Analysis and Summarization App**

Welcome to **DocuThinker**! This is a full-stack **(FERN-Stack)** application that integrates an AI-powered document processing backend with a React-based frontend. The app allows users to upload documents for summarization, generate key insights, and chat with an AI based on the document's content.

<p align="center">
  <a href="https://docuthinker.vercel.app" style="cursor: pointer">
    <img src="images/logo.png" alt="DocuThinker Logo" width="45%" style="border-radius: 8px">
  </a>
</p>

## **📚 Table of Contents**

- [**📖 Overview**](#-overview)
- [**🚀 Live Deployments**](#live-deployments)
  - [**Live Statuses**](#live-statuses)
- [**✨ Features**](#features)
- [**⚙️ Technologies**](#technologies)
- [**🖼️ User Interface**](#user-interface)
- [**📂 Complete File Structure**](#complete-file-structure)
- [**🛠️ Getting Started**](#getting-started)
  - [**Prerequisites**](#prerequisites)
  - [**Frontend Installation**](#frontend-installation)
  - [**Backend Installation**](#backend-installation)
  - [**Running the Mobile App**](#running-the-mobile-app)
- [**📋 API Endpoints**](#api-endpoints)
  - [**API Documentation**](#api-documentation)
  - [**Using the `openapi.yaml` File**](#using-the-openapiyaml-file)
  - [**API Architecture**](#api-architecture)
  - [**API Testing**](#api-testing)
  - [**Error Handling**](#error-handling)
- [**🧰 GraphQL Integration**](#graphql-integration)
- [**📱 Mobile App**](#mobile-app)
- [**📦 Containerization**](#containerization)
- [**🚧 Deployment**](#deployment)
  - [**Frontend Deployment (Vercel)**](#frontend-deployment-vercel)
  - [**Backend Deployment (Render)**](#backend-deployment-render)
  - [**Important Note about Backend Deployment (Please Read)**](#important-note-about-backend-deployment)
- [**⚖️ Load Balancing & Caching**](#load-balancing)
- [**🔗 Jenkins Integration**](#jenkins)
- [**🚢 Kubernetes Integration**](#kubernetes)
- [**🔧 Contributing**](#contributing)
- [**📝 License**](#license)
- [**📚 Additional Documentation**](#alternative-docs)
- [**👨‍💻 Author**](#author)

<h2 id="-overview">📖 Overview</h2>

The **DocuThinker** app is designed to provide users with a simple, AI-powered document management tool. Users can upload PDFs or Word documents and receive summaries, key insights, and discussion points. Additionally, users can chat with an AI using the document's content for further clarification.

**DocuThinker** is created using the **FERN-Stack** architecture, which stands for **Firebase, Express, React, and Node.js**. The backend is built with Node.js and Express, integrating Firebase for user authentication and MongoDB for data storage. The frontend is built with React and Material-UI, providing a responsive and user-friendly interface.

> [!IMPORTANT]
> It is currently deployed live on **Vercel** and **Render**. You can access the live app **[here](https://docuthinker-fullstack-app.vercel.app/)**.

<h2 id="live-deployments">🚀 Live Deployments</h2>

> [!TIP]
> Access the live app at **[https://docuthinker.vercel.app/](https://docuthinker.vercel.app/) by clicking on the link or copying it into your browser! 🚀**

We have deployed the entire app on **Vercel** and **Render**. You can access the live app **[here](https://docuthinker.vercel.app)**.

- **Frontend**: Deployed on **Vercel**. Access the live frontend **[here](https://docuthinker.vercel.app/)**.
  - **Backup Frontend**: We have a backup of the frontend on **Netlify**. You can access the backup app **[here](https://docuthinker-ai-app.netlify.app/)**.
- **Backend**: Deployed on **Vercel**. You can access the live backend **[here](https://docuthinker-app-backend-api.vercel.app/)**.
  - **Backup Backend API**: Deployed on **Render**. You can access the backup backend **[here](https://docuthinker-ai-app.onrender.com/)**.

> [!IMPORTANT]
> The backend server may take a few seconds to wake up if it has been inactive for a while. The first API call may take a bit longer to respond. Subsequent calls should be faster as the server warms up.

> [!NOTE]
> Additionally, the Render-deployed backend is currently on the **Free Tier** of **Render**, so it may take longer to process your request since we are only allocated **512MB and 0.1 CPU**.

### Live Statuses

These badges indicate the current deployment status of the app, updating automatically based on the latest deployment status:

<p align="center">
  <a href="https://docuthinker-fullstack-app.vercel.app">
    <img src="https://img.shields.io/badge/Deployed_with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Deployment" />
  </a>
  <a href="https://docuthinker-ai-app.onrender.com/">
    <img src="https://img.shields.io/badge/Render-Success-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render Success" />
  </a>
  <a href="https://docuthinker-ai-app.netlify.app">
    <img src="https://img.shields.io/badge/Netlify-Backup_Deployed-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify Backup" />
  </a>
  <a href="https://firebase.google.com">
    <img src="https://img.shields.io/badge/Firebase-Functional-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase Functional" />
  </a>
  <a href="https://www.mongodb.com/cloud/atlas">
    <img src="https://img.shields.io/badge/MongoDB_Atlas-Connected-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  </a>
  <a href="https://redis.io">
    <img src="https://img.shields.io/badge/Redis-Cache_Enabled-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis Cache" />
  </a>
  <a href="https://www.rabbitmq.com">
    <img src="https://img.shields.io/badge/RabbitMQ-Enabled-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ Enabled" />
  </a>
  <a href="https://graphql.org">
    <img src="https://img.shields.io/badge/GraphQL-API-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL API" />
  </a>
  <a href="https://www.docker.com">
    <img src="https://img.shields.io/badge/Dockerized-Yes-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Dockerized" />
  </a>
  <a href="https://kubernetes.io">
    <img src="https://img.shields.io/badge/Kubernetes-Yes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  </a>
  <a href="https://www.jenkins.io">
    <img src="https://img.shields.io/badge/Jenkins-CI/CD-D24939?style=for-the-badge&logo=jenkins&logoColor=white" alt="Jenkins CI/CD" />
  </a>
  <a href="https://swagger.io">
    <img src="https://img.shields.io/badge/Swagger_&_OpenAPI-Documented-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger & OpenAPI" />
  </a>
</p>

<h2 id="features">✨ Features</h2>

**DocuThinker** offers a wide range of features to help users manage and analyze their documents effectively. Here are some of the key features of the app:

- **Document Upload & Summarization**: Upload PDFs or Word documents for AI-generated summaries.
- **Key Insights & Discussion Points**: Generate important ideas and topics for discussion from your documents.
- **AI Chat Integration**: Chat with an AI using your document’s original context.
- **Voice Chat with AI**: Chat with an AI using voice commands for a more interactive experience.
- **Sentiment Analysis**: Analyze the sentiment of your document text for emotional insights.
- **Multiple Language Support**: Summarize documents in different languages for global users.
- **Content Rewriting**: Rewrite or rephrase document text based on a specific style or tone.
- **Actionable Recommendations**: Get actionable recommendations based on your document content.
- **Bullet Point Summaries**: Generate bullet point summaries for quick insights and understanding.
- **Document Categorization**: Categorize documents based on their content for easy organization.
- **Profile Management**: Update your profile information, social media links, and theme settings.
- **User Authentication**: Secure registration, login, and password reset functionality.
- **Document History**: View all uploaded documents and their details.
- **Mobile App Integration**: React Native mobile app for on-the-go document management.
- **API Documentation**: Swagger (OpenAPI) documentation for all API endpoints.
- **Authentication Middleware**: Secure routes with JWT and Firebase authentication middleware.
- **Containerization**: Dockerized the app with Docker & K8s for easy deployment and scaling.
- **Continuous Integration**: Automated testing and deployment with GitHub Actions & Jenkins.

<h2 id="technologies">⚙️ Technologies</h2>

- **Frontend**:
  - **React**: JavaScript library for building user interfaces.
  - **Material-UI**: React components for faster and easier web development.
  - **Axios**: Promise-based HTTP client for making API requests.
  - **React Router**: Declarative routing for React applications.
  - **Context API**: State management for React applications.
  - **TailwindCSS**: Utility-first CSS framework for styling.
  - **Craco**: Create React App Configuration Override for customizing Webpack.
  - **Webpack**: Module bundler for JavaScript applications.
- **Backend**:
  - **Express**: Web application framework for Node.js.
  - **Redis**: In-memory data structure store for caching.
  - **Firebase Admin SDK**: Firebase services for server-side applications.
  - **Node.js**: JavaScript runtime for building scalable network applications.
  - **Firebase Authentication**: Secure user authentication with Firebase.
  - **Firebase Auth JWT**: Generate custom tokens for Firebase authentication.
  - **Middlewares**: Firebase authentication middleware for securing routes and JWT middleware for token verification.
  - **REST APIs**: Representational State Transfer for building APIs.
  - **GraphQL**: Query language for APIs and runtime for executing queries.
- **AI/ML Services**:
  - **Google Cloud Natural Language API**: Machine learning models for text analysis.
  - **Google Speech-to-Text API**: Speech recognition for voice chat integration & text extraction from audio.
  - **Google AI Studio**: Tools for building and deploying machine learning models.
  - **NLP**: Natural Language Processing for customized chat/text analysis and summarization models.
  - **NER**: Named Entity Recognition for identifying entities in text.
  - **POS Tagging**: Part-of-Speech Tagging for analyzing word types in text.
  - **RAG**: Retrieval-Augmented Generation for generating responses in chat.
  - **LangChain**: Handles document ingestion, text chunking, embedding storage, retrieval, summarization, and API chaining for generating insights from uploaded documents.
- **Database**:
  - **MongoDB**: NoSQL database for storing user data and documents.
  - **Firestore**: Cloud Firestore for storing user data and documents.
  - **Redis**: In-memory data structure store for caching.
- **Mobile App**:
  - **React Native**: JavaScript framework for building mobile applications.
  - **Expo**: Framework and platform for universal React applications.
  - **Firebase SDK**: Firebase services for mobile applications.
  - **React Navigation**: Routing and navigation for React Native apps.
- **API Documentation**:
  - **Swagger**: OpenAPI documentation for all API endpoints.
  - **OpenAPI**: Specification for building APIs with RESTful architecture.
- **Containerization**:
  - **Docker**: Containerization platform for building, shipping, and running applications.
  - **Kubernetes**: Container orchestration for automating deployment, scaling, and management.
- **Load Balancing & Caching**:
  - **NGINX**: Web server for load balancing, reverse proxying, and caching.
- **CI/CD & Deployment**:
  - **GitHub Actions**: Automated workflows for testing and deployment.
  - **Jenkins**: Automation server for continuous integration and deployment.
  - **Render**: Cloud platform for hosting and scaling web applications. (Used to deploy the backend)
  - **Vercel**: Cloud platform for hosting and deploying web applications. (Used to deploy the frontend)
  - **Netlify**: Cloud platform for hosting and deploying web applications. (Used as a backup)

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=mui&logoColor=white" alt="Material UI" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Craco-61DAFB?style=for-the-badge&logo=webpack&logoColor=white" alt="Craco" />
  <img src="https://img.shields.io/badge/Webpack-8DD6F9?style=for-the-badge&logo=webpack&logoColor=white" alt="Webpack" />
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Navigation-123456?style=for-the-badge&logo=react-router&logoColor=white" alt="React Navigation" />

  <!-- Backend -->
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
  <img src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firestore" />
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ" />
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL" />

  <!-- AI/ML -->
  <img src="https://img.shields.io/badge/Google_Cloud_NLP-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Cloud NLP" />
  <img src="https://img.shields.io/badge/Google_Speech--to--Text-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Speech-to-Text" />
  <img src="https://img.shields.io/badge/Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI Studio" />
  <img src="https://img.shields.io/badge/NLP_&amp;_NLTK-00599C?style=for-the-badge&logo=apachedolphinscheduler&logoColor=white" alt="Natural Language Processing" />
  <img src="https://img.shields.io/badge/NER-007ACC?style=for-the-badge&logo=apachenetbeanside&logoColor=white" alt="Named Entity Recognition" />
  <img src="https://img.shields.io/badge/POS_Tagging-123456?style=for-the-badge&logo=posit&logoColor=white" alt="POS Tagging" />
  <img src="https://img.shields.io/badge/Retrieval%20Augmented%20Generation%20(RAG)-6495ED?style=for-the-badge&logo=chatbot&logoColor=white" alt="Retrieval-Augmented Generation" />
  <img src="https://img.shields.io/badge/LangChain-999999?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />

  <!-- Containerization, Deployment, CI/CD -->
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/NGINX-269539?style=for-the-badge&logo=nginx&logoColor=white" alt="NGINX" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white" alt="Jenkins" />
  <img src="https://img.shields.io/badge/Render-FF6B6B?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />

  <!-- API Documentation -->
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/OpenAPI-6BA539?style=for-the-badge&logo=openapiinitiative&logoColor=white" alt="OpenAPI" />
  <img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white" alt="JSON" />
  <img src="https://img.shields.io/badge/YAML-FFCA28?style=for-the-badge&logo=yaml&logoColor=black" alt="YAML" />
  <img src="https://img.shields.io/badge/REST_API-00599C?style=for-the-badge&logo=fastapi&logoColor=white" alt="REST API" />
</p>

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

### **Document Upload Page - Document Uploaded**

<p align="center">
  <img src="images/file-uploaded.png" alt="Document Upload Page - Document Uploaded" width="100%" style="border-radius: 8px">
</p>

### **Google Drive Document Selection**

<p align="center">
  <img src="images/drive-upload.png" alt="Google Drive Document Selection" width="100%" style="border-radius: 8px">
</p>

### **Home Page**

<p align="center">
  <img src="images/home.png" alt="Home Page" width="100%" style="border-radius: 8px">
</p>

### **Home Page - Dark Mode**

<p align="center">
  <img src="images/home-dark.png" alt="Home Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Chat Modal**

<p align="center">
  <img src="images/chat.png" alt="Chat Modal" width="100%" style="border-radius: 8px">
</p>

### **Chat Modal - Dark Mode**

<p align="center">
  <img src="images/chat-dark.png" alt="Chat Modal - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Documents Page**

<p align="center">
  <img src="images/documents.png" alt="Documents Page" width="100%" style="border-radius: 8px">
</p>

### **Documents Page - Dark Mode**

<p align="center">
  <img src="images/documents-dark.png" alt="Documents Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Document Page - Search Results**

<p align="center">
  <img src="images/documents-search.png" alt="Document Page - Search Results" width="100%" style="border-radius: 8px">
</p>

### **Profile Page**

<p align="center">
  <img src="images/profile.png" alt="Profile Page" width="100%" style="border-radius: 8px">
</p>

### **Profile Page - Dark Mode**

<p align="center">
  <img src="images/profile-dark.png" alt="Profile Page - Dark Mode" width="100%" style="border-radius: 8px">
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

### **Navigation Drawer**

<p align="center">
  <img src="images/navigation-drawer.png" alt="Navigation Drawer" width="50%" style="border-radius: 8px">
</p>

### **404 Not Found Page**

<p align="center">
  <img src="images/404.png" alt="404 Not Found Page" width="100%" style="border-radius: 8px">
</p>

### **404 Not Found Page - Dark Mode**

<p align="center">
  <img src="images/404-dark.png" alt="404 Not Found Page - Dark Mode" width="100%" style="border-radius: 8px">
</p>

### **Footer**

<p align="center">
  <img src="images/footer.png" alt="Footer" width="100%" style="border-radius: 8px">
</p>

<h2 id="complete-file-structure">📂 Complete File Structure</h2>

The **DocuThinker** app is organized into separate subdirectories for the frontend, backend, and mobile app. Each directory contains the necessary files and folders for the respective components of the app. Here is the complete file structure of the app:

```
DocuThinker-AI-App/
├── backend/
│   ├── ai_ml/
│   │   ├── perform_ner_pos.py        # Named Entity Recognition and Part-of-Speech Tagging
│   │   ├── sen_analysis.py           # Sentiment analysis for document text
│   │   ├── chat.js                   # Chatbot integration for AI chat functionality
│   │   ├── analyzer.js               # Document analyzer for generating key ideas and discussion points
│   │   ├── textStatistics.js         # Text statistics for analyzing document content
│   │   ├── documentClassifier.js     # Document classifier for categorizing documents
│   │   ├── summarizer.js             # Document summarizer for generating summaries
│   │   └── (and many more files...)  # Additional AI/ML services
│   ├── middleware/
│   │   └── jwt.js                    # Authentication middleware with JWT for the app's backend
│   ├── controllers/
│   │   └── controllers.js            # Controls the flow of data and logic
│   ├── graphql/
│   │   ├── resolvers.js              # Resolvers for querying data from the database
│   │   └── schema.js                 # GraphQL schema for querying data from the database
│   ├── models/
│   │   └── models.js                 # Data models for interacting with the database
│   ├── services/
│   │   └── services.js               # Models for interacting with database and AI/ML services
│   ├── views/
│   │   └── views.js                  # Output formatting for success and error responses
│   ├── redis/
│   │   └── redisClient.js            # Redis client for caching data in-memory
│   ├── swagger/
│   │   └── swagger.js                # Swagger documentation for API endpoints
│   ├── .env                          # Environment variables (git-ignored)
│   ├── firebase-admin-sdk.json       # Firebase Admin SDK credentials (git-ignored)
│   ├── index.js                      # Main entry point for the server
│   ├── Dockerfile                    # Docker configuration file
│   ├── manage_server.sh              # Shell script to manage and start the backend server
│   └── README.md                     # Backend README file
│
├── frontend/
│   ├── public/
│   │   ├── index.html                # Main HTML template
│   │   └── manifest.json             # Manifest for PWA settings
│   ├── src/
│   │   ├── assets/                   # Static assets like images and fonts
│   │   │   └── logo.png              # App logo or images
│   │   ├── components/
│   │   │   ├── ChatModal.js          # Chat modal component
│   │   │   ├── Spinner.js            # Loading spinner component
│   │   │   ├── UploadModal.js        # Document upload modal component
│   │   │   ├── Navbar.js             # Navigation bar component
│   │   │   ├── Footer.js             # Footer component
│   │   │   └── GoogleAnalytics.js    # Google Analytics integration component
│   │   ├── pages/
│   │   │   ├── Home.js               # Home page where documents are uploaded
│   │   │   ├── LandingPage.js        # Welcome and information page
│   │   │   ├── Login.js              # Login page
│   │   │   ├── Register.js           # Registration page
│   │   │   ├── ForgotPassword.js     # Forgot password page
│   │   │   └── HowToUse.js           # Page explaining how to use the app
│   │   ├── App.js                    # Main App component
│   │   ├── index.js                  # Entry point for the React app
│   │   ├── App.css                   # Global CSS 1
│   │   ├── index.css                 # Global CSS 2
│   │   ├── reportWebVitals.js        # Web Vitals reporting
│   │   ├── styles.css                # Custom styles for different components
│   │   └── config.js                 # Configuration file for environment variables
│   ├── .env                          # Environment variables file (e.g., REACT_APP_BACKEND_URL)
│   ├── package.json                  # Project dependencies and scripts
│   ├── craco.config.js               # Craco configuration file
│   ├── Dockerfile                    # Docker configuration file
│   ├── manage_frontend.sh            # Shell script for managing and starting the frontend
│   ├── README.md                     # Frontend README file
│   └── package.lock                  # Lock file for dependencies
│
├── mobile-app/                       # Mobile app directory
│   ├── app/                          # React Native app directory
│   ├── .env                          # Environment variables file for the mobile app
│   ├── app.json                      # Expo configuration file
│   ├── components/                   # Reusable components for the mobile app
│   ├── assets/                       # Static assets for the mobile app
│   ├── constants/                    # Constants for the mobile app
│   ├── hooks/                        # Custom hooks for the mobile app
│   ├── scripts/                      # Scripts for the mobile app
│   ├── babel.config.js               # Babel configuration file
│   ├── package.json                  # Project dependencies and scripts
│   └── tsconfig.json                 # TypeScript configuration file
│
├── kubernetes/                       # Kubernetes configuration files
│   ├── manifests/                    # Kubernetes manifests for deployment, service, and ingress
│   ├── backend-deployment.yaml       # Deployment configuration for the backend
│   ├── backend-service.yaml          # Service configuration for the backend
│   ├── frontend-deployment.yaml      # Deployment configuration for the frontend
│   ├── frontend-service.yaml         # Service configuration for the frontend
│   ├── firebase-deployment.yaml      # Deployment configuration for Firebase
│   ├── firebase-service.yaml         # Service configuration for Firebase
│   └── configmap.yaml                # ConfigMap configuration for environment variables
│
├── nginx/
│   ├── nginx.conf                    # NGINX configuration file for load balancing and caching
│   └── Dockerfile                    # Docker configuration file for NGINX
│
├── images/                           # Images for the README
├── .env                              # Environment variables file for the whole app
├── docker-compose.yml                # Docker Compose file for containerization
├── jsconfig.json                     # JavaScript configuration file
├── package.json                      # Project dependencies and scripts
├── package-lock.json                 # Lock file for dependencies
├── postcss.config.js                 # PostCSS configuration file
├── tailwind.config.js                # Tailwind CSS configuration file
├── render.yaml                       # Render configuration file
├── vercel.json                       # Vercel configuration file
├── openapi.yaml                      # OpenAPI specification for API documentation
├── manage_docuthinker.sh             # Shell script for managing and starting the app (both frontend & backend)
├── jenkins_cicd.sh                   # Shell script for managing the Jenkins CI/CD pipeline
├── .gitignore                        # Git ignore file
├── LICENSE.md                        # License file for the project
├── README.md                         # Comprehensive README for the whole app
└── (and many more files...)          # Additional files and directories not listed here
```

<h2 id="getting-started">🛠️ Getting Started</h2>

### **Prerequisites**

Ensure you have the following tools installed:

- **Node.js** (between v14 and v20)
- **npm** or **yarn**
- **Firebase Admin SDK** credentials
- **Redis** for caching
- **MongoDB** for data storage
- **RabbitMQ** for handling asynchronous tasks
- **Docker** for containerization (optional)
- **Postman** for API testing (optional)
- **Expo CLI** for running the mobile app
- **Jenkins** for CI/CD (optional)
- **Kubernetes** for container orchestration (optional)
- **React Native CLI** for building the mobile app
- **Firebase SDK** for mobile app integration
- **Firebase API Keys and Secrets** for authentication
- **Expo Go** app for testing the mobile app on a physical device
- **Tailwind CSS** for styling the frontend
- **.env** file with necessary API keys (You can contact me to get the `.env` file - but you should obtain your own API keys for production).

Additionally, **basic fullstack development knowledge and AI/ML concepts** are recommended to understand the app's architecture and functionalities.

### **Frontend Installation**

1. **Clone the repository**:

   ```bash
   git clone https://github.com/hoangsonww/DocuThinker-AI-App.git
   cd DocuThinker-AI-App/backend
   ```

2. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

   Or `npm install --legacy-peer-deps` if you face any peer dependency issues.

4. **Start the Frontend React app**:
   ```bash
   npm start
   ```
5. **Build the Frontend React app (for production)**:

   ```bash
   npm run build
   ```

6. **Alternatively, you can use `yarn` to install dependencies and run the app**:
   ```bash
   yarn install
   yarn start
   ```
7. **Or, for your convenience, if you have already installed the dependencies, you can directly run the app in the root directory using**:

   ```bash
   npm run frontend
   ```

   This way, you don't have to navigate to the `frontend` directory every time you want to run the app.

8. **The app's frontend will run on `http://localhost:3000`**. You can now access it in your browser.

### **Backend Installation**

> [!NOTE]
> Note that this is optional since we are deploying the backend on **Render**. However, you can (and should) run the backend locally for development purposes.

1. **Navigate to the root (not `backend`) directory**:
   ```bash
   cd backend
   ```
   
2. **Install dependencies**:
   ```bash
   npm install
   ```

   Or `npm install --legacy-peer-deps` if you face any peer dependency issues.

3. **Start the backend server**:
   ```bash
   npm run server
   ```
   
4. **The backend server will run on `http://localhost:3000`**. You can access the API endpoints in your browser or **Postman**.
5. **Additionally, the backend code is in the `backend` directory**. Feel free to explore the API endpoints and controllers.

> [!CAUTION]
> **Note:** Be sure to use Node v.20 or earlier to avoid compatibility issues with Firebase Admin SDK.

### **Running the Mobile App**

1. **Navigate to the mobile app directory**:
   ```bash
   cd mobile-app
   ```
2. **Install dependencies**:
   ```bash
    npm install
   ```
3. **Start the Expo server**:
   ```bash
   npx expo start
   ```
4. **Run the app on an emulator or physical device**: Follow the instructions in the terminal to run the app on an emulator or physical device.

<h2 id="api-endpoints">📋 API Endpoints</h2>

The backend of **DocuThinker** provides several API endpoints for user authentication, document management, and AI-powered insights. These endpoints are used by the frontend to interact with the backend server:

| **Method** | **Endpoint**                         | **Description**                                                                                     |
|------------|--------------------------------------|-----------------------------------------------------------------------------------------------------|
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
| POST       | `/update-document-title`             | Update the title of a document in Firestore.                                                        |
| PUT        | `/update-theme`                      | Update the theme of the app.                                                                        |
| GET        | `/user-joined-date/{userId}`         | Get date when the user associated with `userId` joined the service.                                 |
| GET        | `/social-media/{userId}`             | Get the social media links of the user associated with `userId`.                                    |
| POST       | `/update-social-media`               | Update the social media links of the user associated with `userId`.                                 |
| POST       | `/update-profile`                    | Update the user's profile information.                                                              |
| POST       | `/update-document/{userId}/{docId}`  | Update the document details in Firestore.                                                           |
| POST       | `/update-document-summary`           | Update the summary of a document in Firestore.                                                      |
| POST       | `/sentiment-analysis`                | Analyzes the sentiment of the provided document text                                                |
| POST       | `/bullet-summary`                    | Generates a summary of the document text in bullet points                                           |
| POST       | `/summary-in-language`               | Generates a summary in the specified language                                                       |
| POST       | `/content-rewriting`                 | Rewrites or rephrases the provided document text based on a style                                   |
| POST       | `/actionable-recommendations`        | Generates actionable recommendations based on the document text                                     |
| GET        | `/graphql`                           | GraphQL endpoint for querying data from the database                                                |

More API endpoints will be added in the future to enhance the functionality of the app. Feel free to explore the existing endpoints and test them using **Postman** or **Insomnia**.

### API Documentation

- **Swagger Documentation**: You can access the Swagger documentation for all API endpoints by running the backend server and navigating to `http://localhost:5000/api-docs`.
- **Redoc Documentation**: You can access the Redoc documentation for all API endpoints by running the backend server and navigating to `http://localhost:5000/api-docs/redoc`.

For example, our API endpoints documentation looks like this:

<p align="center">
  <img src="images/swagger.png" alt="Swagger Documentation" width="100%" style="border-radius: 8px">
</p>

Additionally, we also offer API file generation using **OpenAPI**. You can generate API files using the **OpenAPI** specification. Here is how:

```bash
npx openapi-generator-cli generate -i http://localhost:5000/api-docs -g typescript-fetch -o ./api
```

This will generate TypeScript files for the API endpoints in the `api` directory. Feel free to replace or modify the command as needed.

### Using the `openapi.yaml` File

1. **View the API Documentation**

- Open [Swagger Editor](https://editor.swagger.io/).
- Upload the `openapi.yaml` file or paste its content.
- Visualize and interact with the API documentation.

2. **Test the API**

- Import `openapi.yaml` into [Postman](https://www.postman.com/):
  - Open Postman → Import → Select `openapi.yaml`.
  - Test the API endpoints directly from Postman.
- Or use [Swagger UI](https://swagger.io/tools/swagger-ui/):
  - Provide the file URL or upload it to view and test endpoints.

3. **Generate Client Libraries**

- Install OpenAPI Generator:
  ```bash
  npm install @openapitools/openapi-generator-cli -g
  ```
- Generate a client library:
  ```bash
  openapi-generator-cli generate -i openapi.yaml -g <language> -o ./client
  ```
- Replace `<language>` with the desired programming language.

4. **Generate Server Stubs**

- Generate a server stub:
  ```bash
  openapi-generator-cli generate -i openapi.yaml -g <framework> -o ./server
  ```
- Replace `<framework>` with the desired framework.

5. **Run a Mock Server**

- Install Prism:
  ```bash
  npm install -g @stoplight/prism-cli
  ```
- Start the mock server:
  ```bash
  prism mock openapi.yaml
  ```

6. **Validate the OpenAPI File**

- Use [Swagger Validator](https://validator.swagger.io/):
  - Upload `openapi.yaml` or paste its content to check for errors.

### **API Architecture**

- We use **Node.js** and **Express** to build the backend server for **DocuThinker**.
- The backend API is structured using **Express** and **Firebase Admin SDK** for user authentication and data storage.
- We use the MVC (Model-View-Controller) pattern to separate concerns and improve code organization.
  - **Models**: Schema definitions for interacting with the database.
  - **Controllers**: Handle the business logic and interact with the models.
  - **Views**: Format the output and responses for the API endpoints.
  - **Services**: Interact with the database and AI/ML services for document analysis and summarization.
  - **Middlewares**: Secure routes with Firebase authentication and JWT middleware.
- The API endpoints are designed to be RESTful and follow best practices for error handling and response formatting.
- The **Microservices Architecture** is also used to handle asynchronous tasks and improve scalability.
- The API routes are secured using Firebase authentication middleware to ensure that only authenticated users can access the endpoints.
- The API controllers handle the business logic for each route, interacting with the data models and formatting the responses.

### **API Testing**

- You can test the API endpoints using **Postman** or **Insomnia**. Simply make a POST request to the desired endpoint with the required parameters.
- For example, you can test the `/upload` endpoint by sending a POST request with the document file as a form-data parameter.
- Feel free to test all the API endpoints and explore the functionalities of the app.

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

### **Error Handling**

The backend APIs uses centralized error handling to capture and log errors. Responses for failed requests are returned with a proper status code and an error message:

```json
{
  "error": "An internal error occurred",
  "details": "Error details go here"
}
```

<h2 id="graphql-integration">🧰 GraphQL Integration</h2>

### Introduction to GraphQL in Our Application

Our application supports a fully-featured **GraphQL API** that allows clients to interact with the backend using flexible queries and mutations. This API provides powerful features for retrieving and managing data such as users, documents, and related information.

### Key Features of the GraphQL API

- Retrieve user details and associated documents.
- Query specific documents using their IDs.
- Perform mutations to create users, update document titles, and delete documents.
- Flexible query structure allows you to fetch only the data you need.

### Getting Started

1. **GraphQL Endpoint**:  
   The GraphQL endpoint is available at:
   ```
   https://docuthinker-ai-app.onrender.com/graphql
   ```
   Or, if you are running the backend locally, the endpoint will be:
   ```
   http://localhost:3000/graphql
   ```

2. **Testing the API**:  
   You can use the built-in **GraphiQL Interface** to test queries and mutations. Simply visit the endpoint in your browser.
   You should see the following interface:

   <p align="center">
     <img src="images/graphql.png" alt="GraphiQL Interface" width="100%" style="border-radius: 8px">
   </p>

   Now you can start querying the API using the available fields and mutations. Examples are below for your reference.

### Example Queries and Mutations

#### 1. Fetch a User and Their Documents

This query retrieves a user's email and their documents, including titles and summaries:

```graphql
query GetUser {
  getUser(id: "USER_ID") {
    id
    email
    documents {
      id
      title
      summary
    }
  }
}
```

#### 2. Fetch a Specific Document

Retrieve details of a document by its ID:

```graphql
query GetDocument {
  getDocument(userId: "USER_ID", docId: "DOCUMENT_ID") {
    id
    title
    summary
    originalText
  }
}
```

#### 3. Create a New User

Create a user with an email and password:

```graphql
mutation CreateUser {
  createUser(email: "example@domain.com", password: "password123") {
    id
    email
  }
}
```

#### 4. Update a Document Title

Change the title of a specific document:

```graphql
mutation UpdateDocumentTitle {
  updateDocumentTitle(userId: "USER_ID", docId: "DOCUMENT_ID", title: ["Updated Title.pdf"]) {
    id
    title
  }
}
```

#### 5. Delete a Document

Delete a document from a user's account:

```graphql
mutation DeleteDocument {
  deleteDocument(userId: "USER_ID", docId: "DOCUMENT_ID")
}
```

### Advanced Tips

- **Use Fragments**: To reduce redundancy in queries, you can use GraphQL fragments to fetch reusable fields across multiple queries.
- **Error Handling**: Properly handle errors in your GraphQL client by inspecting the `errors` field in the response.
- **GraphQL Client Libraries**: Consider using libraries like [Apollo Client](https://www.apollographql.com/docs/react/) or [Relay](https://relay.dev/) to simplify API integration in your frontend.

For more information about GraphQL, visit the [official documentation](https://graphql.org/). If you encounter any issues or have questions, feel free to open an issue in our repository.

<h2 id="mobile-app">📱 Mobile App</h2>

The **DocuThinker** mobile app is built using **React Native** and **Expo**. It provides a mobile-friendly interface for users to upload documents, generate summaries, and chat with an AI. The mobile app integrates with the backend API to provide a seamless experience across devices.

Currently, it is in development and will be released soon on both the **App Store** and **Google Play Store**.

Stay tuned for the release of the **DocuThinker** mobile app!

Below is a screenshot of the mobile app (in development):

<p align="center">
  <img src="images/responsive.png" alt="Mobile App" width="50%" style="border-radius: 8px">
</p>

<h2 id="containerization">📦 Containerization</h2>

The **DocuThinker** app can be containerized using **Docker** for easy deployment and scaling. Follow these steps to containerize the app:

1. Run the following command to build the Docker image:
   ```bash
   docker compose up --build
   ```

2. The app will be containerized and ready to run on port 3000.

You can also view the image in the **Docker Hub** repository **[here](https://hub.docker.com/repository/docker/hoangsonw/docuthinker-ai-app/)**.

<h2 id="deployment">🚧 Deployment</h2>

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

### **Backend Deployment (Render)**

- The backend can be deployed on platforms like **Heroku**, **Render**, or **Vercel**.

- Currently, we are using **Render** to host the backend. You can access the live backend **[here](https://docuthinker-ai-app.onrender.com/)**.

### **Important Note about Backend Deployment**

> [!IMPORTANT]
> - Please note that we are currently on the **Free Tier** of **Render**. This means that the backend server may take a few seconds to wake up if it has been inactive for a while.
>
> - Therefore, the first API call may take a bit longer to respond. Subsequent calls should be faster as the server warms up. It is completely normal to take up to 2 minutes for the first API call to respond.
>
> - Also, the **Free Tier** of **Render** only allocates **512MB and 0.1 CPU**. This may result in slower response times for API calls and document processing.
>
> - Additionally, during high traffic periods, the server may take longer to respond, although we have employed [NGINX](#load-balancing) for load balancing and caching.

<h2 id="load-balancing">⚖️ Load Balancing & Caching</h2>

- We are using **NGINX** for load balancing and caching to improve the performance and scalability of the app.
  - The **NGINX** configuration file is included in the repository for easy deployment. You can find the file in the `nginx` directory.
  - Feel free to explore the **NGINX** configuration file and deploy it on your own server for load balancing and caching.
  - **NGINX** can also be used for SSL termination, reverse proxying, and serving static files. More advanced configurations can be added to enhance the performance of the app.
  - You can also use **Cloudflare** or **AWS CloudFront** for content delivery and caching to improve the speed and reliability of the app, but we are currently using **NGINX** for load balancing and caching due to costs and simplicity.
  - For more information, refer to the **[NGINX Directory](nginx/README.md)**.
- We are also using **Docker** with **NGINX** to deploy the **NGINX** configuration file and run the server in a containerized environment. The server is deployed and hosted on **Render**.
- Additionally, we are using **Redis** for in-memory caching to store frequently accessed data and improve the performance of the app.
  - **Redis** can be used for caching user sessions, API responses, and other data to reduce the load on the database and improve response times.
  - You can set up your own **Redis** server or use a managed service like **Redis Labs** or **AWS ElastiCache** for caching.

<h2 id="jenkins">🔗 Jenkins Integration</h2>

- We are using **Jenkins** for continuous integration and deployment. The Jenkins pipeline is set up to automatically test and deploy the app whenever changes are pushed to the main branch.
- The pipeline runs the tests, builds the app, and deploys it to **Vercel** and **Render**. Feel free to visit the pipeline at **[`Jenkinsfile`](Jenkinsfile)**.
- The pipeline is triggered automatically whenever a new commit is pushed to the main branch.
- You can set up your own Jenkins pipeline to automate testing and deployment for your projects by following these commands and steps:

1. **Install Jenkins**:
   ```bash
   brew install jenkins
   ```
2. **Start Jenkins**:
   ```bash
   brew services start jenkins
   ```
3. **Access Jenkins**:
   Open your browser and go to `http://localhost:8080` to access the Jenkins dashboard.

4. **Follow the instructions to set up Jenkins and create a new pipeline**.

If successful, you should see the Jenkins pipeline running and deploying the app automatically whenever changes are pushed to the main branch. Here is an example:

<p align="center">
  <img src="images/jenkins.png" alt="Jenkins Pipeline" width="100%" style="border-radius: 8px">
</p>

<h2 id="kubernetes">🚢 Kubernetes Integration</h2>

- We are using **Kubernetes** for container orchestration and scaling. The app can be deployed on a Kubernetes cluster for high availability and scalability.
- The Kubernetes configuration files are included in the repository for easy deployment. You can find the files in the `kubernetes` directory.
- Feel free to explore the Kubernetes configuration files and deploy the app on your own Kubernetes cluster.
- You can also use **Google Kubernetes Engine (GKE)**, **Amazon EKS**, or **Azure AKS** to deploy the app on a managed Kubernetes cluster.

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
5. **Submit a pull request**: Please submit a pull request from your forked repository to the main repository. I will review your changes and merge them into the main branch shortly.

Thank you for contributing to **DocuThinker**! 🎉

<h2 id="license">📝 License</h2>

This project is licensed under the **Creative Commons Attribution-NonCommercial License**. See the [LICENSE](LICENSE.md) file for details.

> [!IMPORTANT]
> The **DocuThinker** open-source project is for educational purposes only and should not be used for commercial applications. But free to use it for learning and personal projects!

<h2 id="alternative-docs">📚 Additional Documentation</h2>

For more information on the **DocuThinker** app, please refer to the following resources:
- **[Web-Based Documentation](https://hoangsonww.github.io/DocuThinker-AI-App/)**
- **[Backend README](backend/README.md)**
- **[Frontend README](frontend/README.md)**
- **[Mobile App README](mobile-app/README.md)**

<h2 id="author">👨‍💻 Author</h2>

Here are some information about me:
- **[Son Nguyen](https://github.com/hoangsonww)** - An aspiring Software Developer & Data Scientist
- Feel free to connect with me on **[LinkedIn](https://www.linkedin.com/in/hoangsonw/)**.
- If you have any questions or feedback, please feel free to reach out to me at **[hoangson091104@gmail.com](mailto:hoangson091104@gmail.com)**.
- Also, check out my **[portfolio](https://sonnguyenhoang.com/)** for more projects and articles.
- If you find this project helpful, or if you have learned something from the source code, consider giving it a star ⭐️. I would greatly appreciate it! 🚀

---

**Happy Coding and Analyzing! 🚀**

**Created with ❤️ by [Son Nguyen](https://github.com/hoangsonww) in 2024.**

---

[🔝 Back to Top](#docuthinker---ai-powered-document-analysis-and-summarization-app)
