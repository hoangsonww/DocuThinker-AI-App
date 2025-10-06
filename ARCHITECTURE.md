# DocuThinker Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [AI/ML Pipeline](#aiml-pipeline)
- [Authentication & Security](#authentication--security)
- [Caching Strategy](#caching-strategy)
- [Message Queue Architecture](#message-queue-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Container Orchestration](#container-orchestration)
- [API Design](#api-design)
- [Data Flow](#data-flow)
- [Scalability & Performance](#scalability--performance)
- [Technology Stack](#technology-stack)

---

## Overview

DocuThinker is a full-stack AI-powered document analysis and summarization application built using the **FERN Stack** (Firebase, Express, React, Node.js). The application leverages advanced AI/ML services to provide intelligent document processing, natural language understanding, and conversational AI capabilities.

### Core Features

- **Document Upload & Processing**: Multi-format document support (PDF, DOCX, TXT)
- **AI-Powered Summarization**: Advanced summarization using Google Cloud NLP and LangChain
- **Intelligent Chat**: Context-aware conversational AI for document Q&A
- **Multi-Language Support**: Document processing and summarization in multiple languages
- **Real-time Analytics**: User behavior tracking and document analytics
- **Sentiment Analysis**: Emotional tone detection in documents
- **Named Entity Recognition (NER)**: Extraction of key entities from documents
- **Content Rewriting**: Style-based content transformation

---

## System Architecture

The application follows a **microservices-oriented architecture** with clear separation of concerns across multiple layers.

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App - React Native]
        C[VS Code Extension]
    end

    subgraph "CDN & Load Balancing"
        D[Vercel CDN]
        E[NGINX Load Balancer]
        F[Cloudflare DNS]
    end

    subgraph "Application Layer"
        G[React Frontend]
        H[Express Backend]
        I[GraphQL API]
    end

    subgraph "Service Layer"
        J[Auth Service]
        K[Document Service]
        L[AI/ML Service]
        M[Analytics Service]
    end

    subgraph "Data Layer"
        N[(Firebase Auth)]
        O[(Firestore)]
        P[(MongoDB Atlas)]
        Q[(Redis Cache)]
    end

    subgraph "External Services"
        R[Google Cloud NLP]
        S[Google AI Studio]
        T[LangChain]
        U[RabbitMQ]
    end

    A --> D
    B --> E
    C --> D
    D --> G
    E --> H
    G -->|REST API| H
    G -->|GraphQL| I
    H --> J
    H --> K
    H --> L
    H --> M
    J --> N
    K --> O
    K --> P
    L --> R
    L --> S
    L --> T
    H --> Q
    H --> U
    M --> P
```

### Architecture Principles

1. **Separation of Concerns**: Each layer has a distinct responsibility
2. **Scalability**: Horizontal scaling through containerization and load balancing
3. **Resilience**: Fault tolerance through caching, message queues, and redundancy
4. **Security**: Multi-layer security with Firebase Auth, JWT, and HTTPS
5. **Performance**: Optimized with Redis caching and CDN distribution

---

## Frontend Architecture

The frontend is built with **React 18** and follows a component-based architecture with modern React patterns.

```mermaid
graph TB
    subgraph "Frontend Application"
        A[App.js - Root Component]

        subgraph "Routing Layer"
            B[React Router v6]
            C[Protected Routes]
            D[Public Routes]
        end

        subgraph "State Management"
            E[Context API]
            F[Local Storage]
            G[Session Storage]
        end

        subgraph "UI Components"
            H[Material-UI Components]
            I[Custom Components]
            J[Styled Components]
        end

        subgraph "Pages"
            K[Landing Page]
            L[Home Page]
            M[Documents Page]
            N[Profile Page]
            O[Analytics Page]
        end

        subgraph "Services"
            P[API Service]
            Q[Auth Service]
            R[Storage Service]
        end

        subgraph "Utilities"
            S[Error Handling]
            T[Form Validation]
            U[Date Formatting]
        end
    end

    A --> B
    B --> C
    B --> D
    A --> E
    E --> F
    E --> G
    K --> H
    L --> H
    M --> H
    N --> H
    O --> H
    H --> I
    I --> J
    P --> Q
    P --> R
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P
```

### Frontend Technology Stack

- **React 18**: Core UI framework
- **Material-UI (MUI)**: Component library
- **React Router v6**: Client-side routing
- **Axios**: HTTP client for API requests
- **Context API**: State management
- **TailwindCSS**: Utility-first CSS framework
- **Webpack**: Module bundler
- **Craco**: Create React App configuration override

### Component Hierarchy

```mermaid
graph TD
    A[App.js] --> B[Navbar]
    A --> C[Routes]
    A --> D[Footer]

    C --> E[LandingPage]
    C --> F[Home]
    C --> G[DocumentsPage]
    C --> H[Profile]
    C --> I[AnalyticsPage]

    F --> J[UploadModal]
    F --> K[ChatModal]
    F --> L[Spinner]

    G --> M[DocumentViewer]
    G --> N[AdvancedSearch]
    G --> O[DocumentComparison]

    H --> P[ProfileForm]

    I --> Q[AnalyticsDashboard]
    I --> R[Charts & Graphs]
```

### State Management Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Context
    participant LocalStorage
    participant API

    User->>Component: Interaction
    Component->>Context: Update State
    Context->>LocalStorage: Persist Data
    Component->>API: Fetch/Update Data
    API->>Component: Response
    Component->>Context: Update Global State
    Context->>Component: Re-render
```

---

## Backend Architecture

The backend follows the **MVC (Model-View-Controller)** pattern with additional service layers for business logic.

```mermaid
graph TB
    subgraph "Backend Architecture"
        A[Express Server]

        subgraph "Middleware Layer"
            B[CORS Middleware]
            C[Auth Middleware - JWT]
            D[Firebase Auth Middleware]
            E[Error Handler]
            F[Request Logger]
        end

        subgraph "Routes Layer"
            G[User Routes]
            H[Document Routes]
            I[AI/ML Routes]
            J[GraphQL Routes]
        end

        subgraph "Controller Layer"
            K[User Controller]
            L[Document Controller]
            M[AI Controller]
            N[Analytics Controller]
        end

        subgraph "Service Layer"
            O[User Service]
            P[Document Service]
            Q[AI/ML Service]
            R[Storage Service]
        end

        subgraph "Model Layer"
            S[User Model]
            T[Document Model]
            U[Analytics Model]
        end

        subgraph "Integration Layer"
            V[Firebase Admin SDK]
            W[Google Cloud APIs]
            X[LangChain]
            Y[Redis Client]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

    B --> G
    C --> H
    D --> I

    G --> K
    H --> L
    I --> M
    J --> N

    K --> O
    L --> P
    M --> Q
    N --> R

    O --> S
    P --> T
    Q --> U

    O --> V
    P --> V
    Q --> W
    Q --> X
    P --> Y
```

### MVC Pattern Implementation

#### Controllers
Handle HTTP requests and responses, coordinate between services and views.

```javascript
// Example Controller Structure
exports.uploadDocument = async (req, res) => {
  try {
    // 1. Parse request
    const { userId, file } = req.body;

    // 2. Validate input
    if (!file) throw new Error('No file provided');

    // 3. Call service layer
    const result = await documentService.processDocument(userId, file);

    // 4. Format response
    sendSuccessResponse(res, 200, 'Document uploaded successfully', result);
  } catch (error) {
    // 5. Handle errors
    sendErrorResponse(res, 400, 'Document upload failed', error.message);
  }
};
```

#### Services
Contain business logic and interact with data models and external APIs.

```mermaid
graph LR
    A[Controller] --> B[Service Layer]
    B --> C[Firebase Auth]
    B --> D[Firestore]
    B --> E[AI/ML APIs]
    B --> F[Redis Cache]
    C --> G[Response]
    D --> G
    E --> G
    F --> G
    G --> A
```

#### Models
Define data schemas and database interactions.

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +Date createdAt
        +Array documents
        +Object socialMedia
        +String theme
    }

    class Document {
        +String id
        +String userId
        +String title
        +String originalText
        +String summary
        +Array keyIdeas
        +Array discussionPoints
        +Date uploadedAt
    }

    class Analytics {
        +String userId
        +Number totalDocuments
        +Number totalSummaries
        +Object usageStats
        +Date lastAccess
    }

    User "1" --> "*" Document : has
    User "1" --> "1" Analytics : has
```

---

## Database Architecture

DocuThinker uses a **hybrid database approach** with multiple database technologies for different purposes.

```mermaid
graph TB
    subgraph "Database Layer"
        A[Application Layer]

        subgraph "Firebase Firestore"
            B[Users Collection]
            C[Documents Collection]
            D[Analytics Collection]
        end

        subgraph "MongoDB Atlas"
            E[Session Data]
            F[Cache Data]
            G[Logs Collection]
        end

        subgraph "Redis Cache"
            H[API Responses]
            I[User Sessions]
            J[Document Summaries]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
```

### Firestore Schema

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : owns
    USERS ||--|| ANALYTICS : has
    USERS {
        string uid PK
        string email
        timestamp createdAt
        array documents
        object socialMedia
        string theme
    }
    DOCUMENTS {
        string docId PK
        string userId FK
        string title
        text originalText
        text summary
        array keyIdeas
        array discussionPoints
        array highlights
        array comments
        timestamp uploadedAt
    }
    ANALYTICS {
        string userId PK
        number totalDocuments
        number totalChats
        object usageByDay
        timestamp lastAccess
    }
```

### Data Access Patterns

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant Redis
    participant Firestore
    participant MongoDB

    Client->>Backend: Request Data
    Backend->>Redis: Check Cache

    alt Cache Hit
        Redis->>Backend: Return Cached Data
        Backend->>Client: Response
    else Cache Miss
        Backend->>Firestore: Query Data
        Firestore->>Backend: Return Data
        Backend->>Redis: Update Cache
        Backend->>MongoDB: Log Access
        Backend->>Client: Response
    end
```

---

## AI/ML Pipeline

The AI/ML pipeline processes documents through multiple stages to extract insights and generate summaries.

```mermaid
graph TB
    subgraph "AI/ML Pipeline"
        A[Document Upload] --> B[Text Extraction]

        B --> C{Document Type}
        C -->|PDF| D[PDF Parser]
        C -->|DOCX| E[DOCX Parser]
        C -->|TXT| F[Text Parser]

        D --> G[Text Preprocessing]
        E --> G
        F --> G

        G --> H[Chunking & Tokenization]

        H --> I{Processing Type}

        I -->|Summarization| J[LangChain Pipeline]
        I -->|NER| K[Named Entity Recognition]
        I -->|Sentiment| L[Sentiment Analysis]
        I -->|POS Tagging| M[Part-of-Speech Tagging]

        J --> N[Google Cloud NLP]
        J --> O[Custom Models]

        K --> P[Entity Extraction]
        L --> Q[Sentiment Score]
        M --> R[POS Tags]

        N --> S[Summary Generation]
        O --> S
        P --> T[Key Ideas]
        Q --> T
        R --> T

        S --> U[Result Aggregation]
        T --> U

        U --> V[Cache Results]
        V --> W[Return to Client]
    end
```

### LangChain Integration

```mermaid
graph LR
    A[Document Text] --> B[Text Splitter]
    B --> C[Document Chunks]
    C --> D[Embedding Generator]
    D --> E[Vector Store]
    E --> F[Retriever]
    F --> G[LLM Chain]
    G --> H[Summary]

    I[User Query] --> F
    F --> J[Relevant Chunks]
    J --> G
    G --> K[AI Response]
```

### AI Service Architecture

```mermaid
graph TB
    subgraph "AI Services Layer"
        A[AI Service Gateway]

        subgraph "Google Cloud Services"
            B[Natural Language API]
            C[Speech-to-Text API]
            D[Translation API]
        end

        subgraph "Custom Models"
            E[Summarization Model]
            F[Classification Model]
            G[Extraction Model]
        end

        subgraph "LangChain Pipeline"
            H[Document Loader]
            I[Text Splitter]
            J[Embeddings]
            K[Vector Store]
            L[Retrieval Chain]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    H --> I
    I --> J
    J --> K
    K --> L
```

### Agentic RAG Orchestration (2024 Refresh)

DocuThinker's revamped AI/ML core consolidates LangGraph, CrewAI, multi-provider LLMs, and optional Neo4j/Chroma persistence into a single `DocumentIntelligenceService` facade. Key characteristics:

- **LangGraph state machine** – `AgenticRAGPipeline` orchestrates ingest → semantic retrieval → CrewAI validation → final report assembly with configurable chunk sizes and embedding backends.
- **CrewAI swarm** – OpenAI (analyst), Gemini (researcher), and Claude (reviewer) agents collaborate via shared search/insights tools to ground responses.
- **Multi-provider registry** – Pluggable chat/embedding creation through `LLMProviderRegistry` allows runtime swapping of OpenAI, Anthropic, Gemini, or Hugging Face models.
- **Persistent memory (optional)** – When enabled, analyses are synced into Neo4j (knowledge graph) and ChromaDB (semantic vector store) for cross-session recall and graph querying.
- **Unified access** – FastAPI, CLI, legacy helpers, and the MCP server consume the same facade, exposing sentiment, translation, recommendations, graph sync, and vector search with consistent metadata.

```mermaid
graph LR
    subgraph Facade
        SVC[DocumentIntelligenceService]
        PIPE[AgenticRAGPipeline]
        CREW[CrewAI Squad]
        TOOLS[Semantic Tools]
    end

    subgraph Providers
        OAI[OpenAI]
        CLAUDE[Anthropic]
        GEM[Google Gemini]
        HF[Hugging Face Embeddings]
    end

    subgraph Persistence
        NEO[Neo4j]
        CHR[ChromaDB]
    end

    SVC --> PIPE
    PIPE --> CREW
    PIPE --> TOOLS
    TOOLS --> HF
    CREW --> OAI
    CREW --> CLAUDE
    CREW --> GEM
    SVC --> NEO
    SVC --> CHR
```

---

## Authentication & Security

DocuThinker implements a multi-layered security architecture.

```mermaid
graph TB
    subgraph "Security Architecture"
        A[Client Request]

        subgraph "Transport Layer"
            B[HTTPS/TLS 1.3]
            C[Certificate Validation]
        end

        subgraph "Authentication Layer"
            D[Firebase Authentication]
            E[JWT Tokens]
            F[Session Management]
        end

        subgraph "Authorization Layer"
            G[Role-Based Access Control]
            H[Resource Permissions]
            I[API Rate Limiting]
        end

        subgraph "Data Protection"
            J[Data Encryption at Rest]
            K[Data Encryption in Transit]
            L[Secure Key Storage]
        end

        subgraph "Monitoring & Logging"
            M[Access Logs]
            N[Audit Trail]
            O[Anomaly Detection]
        end
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N --> O
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Firebase
    participant Firestore

    User->>Frontend: Enter Credentials
    Frontend->>Backend: POST /login
    Backend->>Firebase: Verify Credentials
    Firebase->>Backend: Return User ID
    Backend->>Firebase: Generate Custom Token
    Firebase->>Backend: Return JWT
    Backend->>Firestore: Fetch User Data
    Firestore->>Backend: Return User Profile
    Backend->>Frontend: Return JWT + User Data
    Frontend->>Frontend: Store Token in LocalStorage
    Frontend->>User: Redirect to Dashboard
```

### Authorization Middleware

```mermaid
graph LR
    A[Incoming Request] --> B{Has Token?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{Valid Token?}
    D -->|No| E[Return 401 Unauthorized]
    D -->|Yes| F{Has Permission?}
    F -->|No| G[Return 403 Forbidden]
    F -->|Yes| H[Process Request]
```

---

## Caching Strategy

Redis is used for multi-level caching to optimize performance.

```mermaid
graph TB
    subgraph "Caching Architecture"
        A[Client Request]

        subgraph "Application Cache"
            B[In-Memory Cache]
            C[Browser LocalStorage]
        end

        subgraph "Redis Cache Layers"
            D[API Response Cache]
            E[Document Summary Cache]
            F[User Session Cache]
            G[Analytics Cache]
        end

        subgraph "Cache Strategies"
            H[Cache-Aside Pattern]
            I[Write-Through Cache]
            J[TTL-Based Expiration]
        end

        subgraph "Cache Invalidation"
            K[Manual Invalidation]
            L[Event-Based Invalidation]
            M[Time-Based Expiration]
        end
    end

    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    H --> D
    I --> E
    J --> F
    K --> D
    L --> E
    M --> G
```

### Cache Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Redis
    participant Database

    Client->>Server: Request Data
    Server->>Redis: Check Cache

    alt Cache Hit
        Redis->>Server: Return Cached Data
        Server->>Client: Response (Fast)
    else Cache Miss
        Redis->>Server: Cache Miss
        Server->>Database: Query Database
        Database->>Server: Return Data
        Server->>Redis: Store in Cache (TTL: 1hr)
        Server->>Client: Response (Slower)
    end
```

---

## Message Queue Architecture

RabbitMQ handles asynchronous tasks and background jobs.

```mermaid
graph TB
    subgraph "Message Queue System"
        A[API Request]

        subgraph "Producers"
            B[Document Upload Handler]
            C[AI Processing Handler]
            D[Email Notification Handler]
        end

        subgraph "RabbitMQ"
            E[Document Queue]
            F[AI Processing Queue]
            G[Notification Queue]
            H[Dead Letter Queue]
        end

        subgraph "Consumers"
            I[Document Processor]
            J[AI Worker]
            K[Email Worker]
        end

        subgraph "Result Handlers"
            L[Success Handler]
            M[Retry Handler]
            N[Error Handler]
        end
    end

    A --> B
    A --> C
    A --> D

    B --> E
    C --> F
    D --> G

    E --> I
    F --> J
    G --> K

    I --> L
    J --> L
    K --> L

    I --> M
    J --> M
    K --> M

    I --> H
    J --> H
    K --> H

    H --> N
```

### Async Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Queue
    participant Worker
    participant Database
    participant Notification

    Client->>API: Upload Document
    API->>Queue: Enqueue Processing Job
    API->>Client: Return Job ID (202 Accepted)

    Queue->>Worker: Dequeue Job
    Worker->>Worker: Process Document
    Worker->>Database: Store Results
    Worker->>Notification: Send Completion Event
    Notification->>Client: Notify User
```

---

## Deployment Architecture

Multi-platform deployment with CI/CD automation.

```mermaid
graph TB
    subgraph "Deployment Pipeline"
        A[Git Repository]

        subgraph "CI/CD"
            B[GitHub Actions]
            C[Jenkins Pipeline]
        end

        subgraph "Build Stage"
            D[Install Dependencies]
            E[Run Tests]
            F[Build Assets]
            G[Docker Image Build]
        end

        subgraph "Deployment Targets"
            H[Vercel - Frontend]
            I[Render - Backend]
            J[Netlify - Backup]
            K[Docker Hub]
        end

        subgraph "Production Services"
            L[Firebase Auth]
            M[MongoDB Atlas]
            N[Redis Cloud]
            O[Google Cloud APIs]
        end
    end

    A --> B
    A --> C

    B --> D
    C --> D

    D --> E
    E --> F
    F --> G

    F --> H
    G --> I
    F --> J
    G --> K

    I --> L
    I --> M
    I --> N
    I --> O
```

### CI/CD Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant CI as CI/CD Pipeline
    participant Test as Test Suite
    participant Build as Build System
    participant Deploy as Deployment
    participant Prod as Production

    Dev->>Git: Push Code
    Git->>CI: Trigger Pipeline
    CI->>Test: Run Tests

    alt Tests Pass
        Test->>CI: Success
        CI->>Build: Build Assets
        Build->>CI: Build Complete
        CI->>Deploy: Deploy to Staging
        Deploy->>CI: Staging Success
        CI->>Deploy: Deploy to Production
        Deploy->>Prod: Update Live
        Prod->>CI: Deployment Success
        CI->>Dev: Notify Success
    else Tests Fail
        Test->>CI: Failure
        CI->>Dev: Notify Failure
    end
```

---

## Container Orchestration

Kubernetes manages containerized deployments.

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        A[Ingress Controller]

        subgraph "Frontend Deployment"
            B[Frontend Service]
            C[Pod 1 - React]
            D[Pod 2 - React]
            E[Pod 3 - React]
        end

        subgraph "Backend Deployment"
            F[Backend Service]
            G[Pod 1 - Express]
            H[Pod 2 - Express]
            I[Pod 3 - Express]
        end

        subgraph "Supporting Services"
            J[Redis Service]
            K[MongoDB Service]
            L[RabbitMQ Service]
        end

        subgraph "Configuration"
            M[ConfigMap]
            N[Secrets]
            O[Persistent Volumes]
        end

        subgraph "Monitoring"
            P[Prometheus]
            Q[Grafana]
            R[Logs Aggregator]
        end
    end

    A --> B
    A --> F

    B --> C
    B --> D
    B --> E

    F --> G
    F --> H
    F --> I

    G --> J
    H --> K
    I --> L

    M --> G
    N --> G
    O --> K

    P --> Q
    R --> Q
```

### Auto-Scaling Configuration

```mermaid
graph LR
    A[Metrics Server] --> B{CPU > 70%}
    B -->|Yes| C[Horizontal Pod Autoscaler]
    C --> D[Scale Up Pods]
    D --> E[Load Balancer]

    A --> F{CPU < 30%}
    F -->|Yes| G[HPA]
    G --> H[Scale Down Pods]
    H --> E

    E --> I[Distribute Traffic]
```

---

## API Design

RESTful and GraphQL APIs with comprehensive documentation.

```mermaid
graph TB
    subgraph "API Gateway"
        A[Client Request]

        subgraph "REST API"
            B[api/users]
            C[api/documents]
            D[api/ai]
            E[api/analytics]
        end

        subgraph "GraphQL API"
            F[graphql]
            G[Queries]
            H[Mutations]
            I[Subscriptions]
        end

        subgraph "Documentation"
            J[Swagger/OpenAPI]
            K[GraphiQL Interface]
            L[Postman Collection]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

    F --> G
    F --> H
    F --> I

    B --> J
    C --> J
    D --> J
    E --> J
    F --> K
```

### API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Controller
    participant Service
    participant Database
    participant Cache

    Client->>Gateway: API Request + JWT
    Gateway->>Auth: Validate Token
    Auth->>Gateway: Token Valid
    Gateway->>Controller: Route to Controller
    Controller->>Cache: Check Cache

    alt Cache Hit
        Cache->>Controller: Return Cached Data
    else Cache Miss
        Cache->>Service: Cache Miss
        Service->>Database: Query Data
        Database->>Service: Return Data
        Service->>Cache: Update Cache
        Service->>Controller: Return Data
    end

    Controller->>Gateway: Format Response
    Gateway->>Client: JSON Response
```

---

## Data Flow

End-to-end data flow through the application.

```mermaid
graph TB
    A[User] --> B[Frontend UI]
    B --> C[API Layer]

    C --> D{Request Type}

    D -->|Upload| E[Document Processing]
    D -->|Query| F[Data Retrieval]
    D -->|Auth| G[Authentication]

    E --> H[File Parser]
    H --> I[AI Processing]
    I --> J[Results Storage]

    F --> K[Cache Check]
    K -->|Hit| L[Return Cached]
    K -->|Miss| M[Database Query]
    M --> N[Update Cache]
    N --> L

    G --> O[Firebase Auth]
    O --> P[Token Generation]

    J --> Q[Response Formatter]
    L --> Q
    P --> Q

    Q --> R[JSON Response]
    R --> B
    B --> A
```

### Document Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Queue
    participant AI Service
    participant Database
    participant Cache

    User->>Frontend: Upload Document
    Frontend->>Backend: POST /upload
    Backend->>Queue: Enqueue Processing Job
    Backend->>Frontend: Job ID + Status Link
    Frontend->>User: Show Processing Status

    Queue->>AI Service: Process Document
    AI Service->>AI Service: Extract Text
    AI Service->>AI Service: Generate Summary
    AI Service->>AI Service: Extract Entities
    AI Service->>Database: Store Results
    AI Service->>Cache: Cache Summary
    AI Service->>Backend: Processing Complete
    Backend->>Frontend: WebSocket Notification
    Frontend->>User: Display Results
```

---

## Scalability & Performance

Strategies for handling growth and maintaining performance.

```mermaid
graph TB
    subgraph "Scalability Architecture"
        A[Application Growth]

        subgraph "Horizontal Scaling"
            B[Load Balancer]
            C[Multiple Server Instances]
            D[Database Replication]
        end

        subgraph "Vertical Scaling"
            E[Increased Resources]
            F[Better Hardware]
        end

        subgraph "Performance Optimization"
            G[Redis Caching]
            H[CDN Distribution]
            I[Code Splitting]
            J[Lazy Loading]
        end

        subgraph "Database Optimization"
            K[Indexing]
            L[Query Optimization]
            M[Connection Pooling]
        end

        subgraph "Monitoring"
            N[APM Tools]
            O[Performance Metrics]
            P[Error Tracking]
        end
    end

    A --> B
    A --> E

    B --> C
    C --> D

    E --> F

    G --> H
    H --> I
    I --> J

    K --> L
    L --> M

    N --> O
    O --> P
```

### Performance Metrics

```mermaid
graph LR
    A[Performance Monitoring] --> B[Response Time]
    A --> C[Throughput]
    A --> D[Error Rate]
    A --> E[Resource Usage]

    B --> F[< 200ms Target]
    C --> G[1000 req/sec]
    D --> H[< 0.1%]
    E --> I[CPU < 70%]

    F --> J[Alerts]
    G --> J
    H --> J
    I --> J
```

---

## Technology Stack

Comprehensive overview of all technologies used.

```mermaid
mindmap
  root((DocuThinker Tech Stack))
    Frontend
      React 18
      Material-UI
      TailwindCSS
      React Router
      Axios
      Context API
    Backend
      Node.js
      Express
      Firebase Admin SDK
      GraphQL
      JWT
    Database
      Firestore
      MongoDB Atlas
      Redis Cache
    AI/ML
      Google Cloud NLP
      LangChain
      Custom NLP Models
      Speech-to-Text
    DevOps
      Docker
      Kubernetes
      Jenkins
      GitHub Actions
      NGINX
    Cloud Services
      Vercel
      Render
      Firebase
      Google Cloud
    Monitoring
      Analytics
      Error Tracking
      Performance Monitoring
```

### Technology Decisions

| Category | Technology | Reason |
|----------|-----------|--------|
| Frontend Framework | React 18 | Component reusability, large ecosystem, performance |
| Backend Framework | Express.js | Lightweight, flexible, extensive middleware support |
| Authentication | Firebase Auth | Secure, scalable, built-in user management |
| Database | Firestore + MongoDB | Real-time updates (Firestore), flexible schema (MongoDB) |
| Caching | Redis | In-memory speed, advanced data structures |
| AI/ML | Google Cloud NLP + LangChain | Accuracy, scalability, ease of integration |
| Containerization | Docker | Environment consistency, easy deployment |
| Orchestration | Kubernetes | Auto-scaling, self-healing, load balancing |
| CI/CD | GitHub Actions + Jenkins | Automation, integration with GitHub |
| Monitoring | Google Analytics + Custom | User behavior tracking, performance metrics |

---

## Conclusion

DocuThinker's architecture is designed for scalability, performance, and maintainability. The multi-layered approach ensures:

- **High Availability**: Through load balancing and redundancy
- **Performance**: Via caching and CDN distribution
- **Security**: With multi-layer authentication and encryption
- **Scalability**: Through containerization and cloud services
- **Maintainability**: With clean architecture and separation of concerns

For more details, refer to:
- [README.md](README.md) - General documentation
- [Backend README](backend/README.md) - Backend-specific details
- [Frontend README](frontend/README.md) - Frontend-specific details
- [API Documentation](openapi.yaml) - Complete API reference

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Author**: [Son Nguyen](https://github.com/hoangsonww)
