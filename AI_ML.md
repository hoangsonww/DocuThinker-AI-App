# DocuThinker — AI/ML Architecture Deep Dive

This document provides a comprehensive, visual guide to how DocuThinker's AI and machine-learning subsystems work — from the moment a request enters the orchestrator to the final enriched response returned to the client.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Request Lifecycle](#request-lifecycle)
- [Orchestrator Layer (Node.js)](#orchestrator-layer-nodejs)
  - [Supervisor & Intent Routing](#supervisor--intent-routing)
  - [Agent Loop (Tool-Use Cycle)](#agent-loop-tool-use-cycle)
  - [Tool Registry](#tool-registry)
  - [Python Bridge](#python-bridge)
  - [Resilience Stack](#resilience-stack)
  - [Context Management](#context-management)
  - [MCP Integration](#mcp-integration)
- [AI/ML Pipeline (Python)](#aiml-pipeline-python)
  - [DocumentIntelligenceService](#documentintelligenceservice)
  - [LangGraph RAG Pipeline](#langgraph-rag-pipeline)
  - [CrewAI Multi-Agent Collaboration](#crewai-multi-agent-collaboration)
  - [Vector & Graph Stores](#vector--graph-stores)
  - [LLM Provider Registry](#llm-provider-registry)
  - [Processing Modules](#processing-modules)
- [Data Flow Examples](#data-flow-examples)
  - [Document Upload & Analysis](#document-upload--analysis)
  - [Document Chat with Agent Loop](#document-chat-with-agent-loop)
  - [Batch Processing](#batch-processing)
- [Model Configuration Reference](#model-configuration-reference)
- [Environment Variables](#environment-variables)
- [API Surface](#api-surface)

---

## High-Level Architecture

DocuThinker uses a **two-layer agentic architecture** that cleanly separates orchestration logic (Node.js) from heavy AI/ML execution (Python).

```mermaid
graph TB
    subgraph Clients
        WEB["React Frontend<br/>(Browser)"]
        MOBILE["React Native<br/>(Mobile)"]
        VSCODE["VS Code Extension"]
        EXT["External Agents<br/>(MCP)"]
    end

    subgraph "Orchestrator · Node.js · Port 4000"
        direction TB
        SUP["Supervisor"]
        ALOOP["Agent Loop"]
        TOOLS["Tool Registry"]
        BRIDGE["Python Bridge"]
        CB["Circuit Breaker"]
        COST["Cost Tracker"]
        DLQ["Dead Letter Queue"]
        CONV["Conversation Store"]
        TBUD["Token Budget Mgr"]
        HRAG["Hybrid RAG"]
        MCPS["MCP Server"]
    end

    subgraph "AI/ML Backend · Python · Port 8000"
        direction TB
        DIS["DocumentIntelligenceService"]
        PIPE["LangGraph RAG Pipeline"]
        CREW["CrewAI 3-Agent Crew"]
        NLP["NLP Processors"]
        CHROMA["ChromaDB Vectors"]
        NEO["Neo4j Graph"]
    end

    subgraph "LLM Providers"
        CLAUDE["Anthropic Claude"]
        GPT["OpenAI GPT-4o"]
        GEMINI["Google Gemini"]
    end

    WEB -->|REST| SUP
    MOBILE -->|REST| SUP
    VSCODE -->|REST| SUP
    EXT -->|stdio| MCPS

    SUP --> ALOOP
    ALOOP --> TOOLS
    TOOLS -->|HTTP POST| BRIDGE
    BRIDGE -->|"http://localhost:8000"| DIS

    ALOOP --> CB
    CB --> CLAUDE
    CB --> GEMINI

    DIS --> PIPE
    DIS --> NLP
    PIPE --> CREW
    PIPE --> CHROMA
    PIPE --> NEO

    CREW --> GPT
    CREW --> GEMINI
    CREW --> CLAUDE

    COST -.->|budget gate| SUP
    TBUD -.->|token gate| ALOOP
    DLQ -.->|retry| SUP
    CONV -.->|history| ALOOP
    HRAG -.->|fused results| ALOOP
```

### Layer Responsibilities

| Layer | Runtime | Port | What It Does |
|-------|---------|------|--------------|
| **Orchestrator** | Node.js 18+ / Express | `4000` | Intent classification, task decomposition, agent tool-use loops, cost/token budgeting, circuit breaking, prompt caching, MCP server/client |
| **AI/ML Backend** | Python 3.10+ / FastAPI | `8000` | LangGraph stateful RAG, CrewAI multi-agent validation, embeddings, vector search, knowledge graph, NER, sentiment, translation |

---

## Request Lifecycle

Every request through the orchestrator follows this flow:

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supervisor
    participant T as Token Budget
    participant CO as Cost Tracker
    participant D as Task DAG
    participant A as Agent Loop / Handler
    participant CB as Circuit Breaker
    participant LLM as LLM Provider
    participant PB as Python Bridge
    participant AI as AI/ML Backend

    C->>S: POST /api/supervisor/process
    S->>S: Classify intent (route match or LLM)
    S->>T: Check token budget
    T-->>S: OK / reject
    S->>CO: Check daily & monthly budget
    CO-->>S: OK / warn / reject

    S->>D: Decompose into subtask DAG
    loop For each ready task (parallel)
        D->>A: Dispatch subtask
        alt LLM-based task
            A->>CB: Request to provider
            CB->>LLM: Forward (if circuit CLOSED)
            LLM-->>CB: Response
            CB-->>A: Result
        else Python-bridged task
            A->>PB: HTTP POST
            PB->>AI: Forward to FastAPI
            AI-->>PB: JSON result
            PB-->>A: Parsed result
        end
        A-->>D: Subtask result
    end
    D->>S: Aggregated results
    S->>CO: Record token costs
    S-->>C: Final response
```

---

## Orchestrator Layer (Node.js)

### Supervisor & Intent Routing

The Supervisor is the orchestrator's brain. It classifies every incoming request into one of 18+ intent types and builds an execution plan.

```mermaid
flowchart LR
    REQ["Incoming Request"] --> RM{"Route Match?"}
    RM -->|Yes| INT["Known Intent"]
    RM -->|No| LLM["Claude Haiku<br/>Classifier"]
    LLM --> INT

    INT --> BUD{"Budget OK?"}
    BUD -->|No| REJECT["403 Budget Exceeded"]
    BUD -->|Yes| DECOMPOSE["Decompose into DAG"]

    DECOMPOSE --> T1["Subtask 1"]
    DECOMPOSE --> T2["Subtask 2"]
    DECOMPOSE --> T3["Subtask 3"]

    T1 --> DISPATCH["Parallel Dispatch<br/>(dependency-aware)"]
    T2 --> DISPATCH
    T3 --> DISPATCH

    DISPATCH --> AGG["Aggregate Results"]
    AGG --> RESP["Response"]
```

**Intent categories:**

| Category | Intent Types |
|----------|-------------|
| Document Ops | `document.upload`, `document.summarize`, `document.keyIdeas`, `document.sentiment`, `document.bulletSummary`, `document.rewrite`, `document.recommendations`, `document.discussionPoints` |
| Chat | `chat.document`, `chat.voice`, `chat.general` |
| Batch | `batch.process` |
| System | `system.health`, `system.costs` |
| Knowledge | `rag.query`, `graph.query` |

**Task decomposition example — `document.upload`:**

```mermaid
graph LR
    UPLOAD["document.upload"] --> EXT["extract<br/>(Python Bridge)"]
    EXT --> SUM["summarize<br/>(Claude)"]
    EXT --> KEY["keyIdeas<br/>(Claude)"]
    SUM --> STORE["store results"]
    KEY --> STORE
```

### Agent Loop (Tool-Use Cycle)

The Agent Loop implements the **ReAct pattern** — iteratively calling an LLM that can request tool executions, feeding results back until the model produces a final answer.

```mermaid
flowchart TD
    START["Agent Loop Start<br/>systemPrompt + userMessage + context"] --> CALL["Call LLM<br/>(with tool definitions)"]
    CALL --> CHECK{"Tool-use blocks<br/>in response?"}

    CHECK -->|No| DONE["Return final text response<br/>+ accumulated token usage"]
    CHECK -->|Yes| EXEC["Execute each tool<br/>via Tool Registry"]

    EXEC --> FEED["Append tool results<br/>as user messages"]
    FEED --> ITER{"Iteration < max<br/>(default 10)?"}

    ITER -->|Yes| CALL
    ITER -->|No| DONE
```

**Key properties:**
- Max 10 iterations by default (configurable)
- Accumulates token usage across all iterations
- Injects document text, title, previous summary, and user preferences into context
- Supports both Claude and Gemini providers (Gemini has tool-use stripped for compatibility)

### Tool Registry

The Tool Registry manages all tools available to the Agent Loop, in Anthropic tool-use schema format.

```mermaid
graph TB
    subgraph "Local Tools (Node.js)"
        AT["analyze_document_text<br/>word count · keywords · reading time"]
    end

    subgraph "Python-Bridged Tools"
        EE["extract_entities<br/>→ /api/nlp/ner"]
        RS["rag_search<br/>→ /api/rag/query"]
        KG["knowledge_graph_query<br/>→ /api/graph/query"]
        VS["vector_search<br/>→ /api/vector/search"]
        PS["python_sentiment<br/>→ /api/nlp/sentiment"]
    end

    REG["Tool Registry"] --> AT
    REG --> EE
    REG --> RS
    REG --> KG
    REG --> VS
    REG --> PS

    AL["Agent Loop"] -->|"lookup by name"| REG
    REG -->|"execute handler"| RES["Tool Result JSON"]
```

### Python Bridge

The Python Bridge is the HTTP client connecting the orchestrator to the AI/ML backend.

```mermaid
flowchart LR
    ORCH["Orchestrator"] -->|HTTP POST| PB["Python Bridge<br/>(python-bridge.js)"]
    PB -->|Circuit Breaker check| CB{"Circuit<br/>CLOSED?"}
    CB -->|Yes| AI["AI/ML Backend<br/>:8000"]
    CB -->|No / OPEN| FAIL["Throw error<br/>→ DLQ / fallback"]
    AI -->|JSON response| PB
    PB -->|Parsed result| ORCH
```

**Endpoints called by the bridge:**

| Bridge Method | AI/ML Endpoint | Payload | Purpose |
|---------------|---------------|---------|---------|
| `analyzeDocument()` | `POST /api/analyze` | `{text, operations[], provider}` | Full document analysis pipeline |
| `queryRAG()` | `POST /api/rag/query` | `{query, top_k}` | Semantic search across indexed docs |
| `crewAnalyze()` | `POST /api/crew/analyze` | `{text, task_type}` | CrewAI multi-agent analysis |
| `extractEntities()` | `POST /api/nlp/ner` | `{text}` | Named entity recognition |
| `analyzeSentiment()` | `POST /api/nlp/sentiment` | `{text}` | Sentiment analysis |
| `searchVectors()` | `POST /api/vector/search` | `{query, top_k}` | ChromaDB semantic search |
| `queryGraph()` | `POST /api/graph/query` | `{cypher}` | Neo4j Cypher queries |
| `healthCheck()` | `GET /health` | — | Service health check |

### Resilience Stack

The orchestrator wraps every external call in multiple layers of fault tolerance.

```mermaid
flowchart TD
    REQ["Request"] --> BUDGET{"Daily/Monthly<br/>budget OK?"}
    BUDGET -->|No| R1["Reject 403"]
    BUDGET -->|Yes| TOKEN{"Token budget<br/>fits context window?"}
    TOKEN -->|No| COMPACT["Auto-compact<br/>(summarize history)"]
    COMPACT --> TOKEN
    TOKEN -->|Yes| CB{"Circuit Breaker<br/>state?"}

    CB -->|CLOSED| CALL["Call provider"]
    CB -->|OPEN| FAIL_CB["Failover to<br/>next provider"]
    CB -->|HALF_OPEN| PROBE["Single probe<br/>request"]

    CALL --> SUCCESS{"Success?"}
    SUCCESS -->|Yes| RECORD["Record cost<br/>& reset failures"]
    SUCCESS -->|No| RETRY{"Retries left?"}
    RETRY -->|Yes| CALL
    RETRY -->|No| DLQ_PUSH["Push to DLQ<br/>(max 3 retries)"]

    PROBE --> SUCCESS
```

**Components:**

| Component | What It Does |
|-----------|-------------|
| **Circuit Breaker** | Per-provider CLOSED→OPEN→HALF_OPEN state machine. Trips after N failures (default 3), recovers after cooldown (default 60s). |
| **Cost Tracker** | Real token pricing for Claude, GPT-4, Gemini. Enforces daily ($10) and monthly ($200) budgets. Warns at 80%. |
| **Dead Letter Queue** | Retries failed ops up to 3 times, then stores for inspection. Exposes stats via `/api/dlq`. |
| **Token Budget Manager** | Estimates tokens for 7+ models, checks context windows (200K Claude, 2M Gemini), auto-compacts via summarization. |

### Context Management

```mermaid
flowchart TB
    subgraph "Conversation Store"
        direction TB
        KEY["Key: userId:documentId"]
        MSGS["Messages array"]
        SUMM["Auto-summary<br/>(at 20 messages)"]
        LRU["LRU eviction<br/>(at 10,000 convos)"]
    end

    subgraph "Token Budget Manager"
        direction TB
        EST["Estimate tokens"]
        WIN["Check context window<br/>Claude 200K · Gemini 2M"]
        CMP["Compact via summarization"]
    end

    subgraph "Hybrid RAG"
        direction TB
        KW["Keyword Search<br/>(Redis)"]
        SEM["Semantic Search<br/>(Python vectors)"]
        RRF["Reciprocal Rank Fusion"]
    end

    subgraph "Prompt Cache"
        direction TB
        L1["Layer 1: System Prompt"]
        L2["Layer 2: Document Context"]
        L3["Layer 3: Conversation History"]
        HIT["Cache hit tracking"]
    end

    ALOOP["Agent Loop"] --> KEY
    ALOOP --> EST
    ALOOP --> KW
    KW --> RRF
    SEM --> RRF
    ALOOP --> L1
```

### MCP Integration

The orchestrator exposes and consumes tools via the **Model Context Protocol**.

```mermaid
graph LR
    subgraph "MCP Server (13 tools)"
        direction TB
        DOC_TOOLS["Document Tools<br/>summarize · key_ideas · sentiment<br/>discussion_points · bullet_summary<br/>rewrite · recommendations · chat"]
        SYS_TOOLS["System Tools<br/>health · costs"]
        KNOW_TOOLS["Knowledge Tools<br/>rag_query · knowledge_graph_query"]
    end

    subgraph "MCP Client"
        CONNECT["Connect to external<br/>MCP servers via stdio"]
        LIST["List remote tools"]
        CALL_T["Call remote tools"]
    end

    EXT_AGENT["External Agent"] -->|stdio| DOC_TOOLS
    EXT_AGENT -->|stdio| SYS_TOOLS
    EXT_AGENT -->|stdio| KNOW_TOOLS

    ORCH["Orchestrator"] --> CONNECT
    CONNECT --> REMOTE["Remote MCP Server"]
```

---

## AI/ML Pipeline (Python)

### DocumentIntelligenceService

The `DocumentIntelligenceService` is the central facade that orchestrates all AI/ML capabilities. Every request flows through it.

```mermaid
flowchart TD
    REQ["analyze_document()<br/>text · question · translate_lang · metadata"]

    REQ --> PIPE["AgenticRAGPipeline.run()"]
    PIPE --> RESULT["Pipeline Result<br/>overview · topics · QA · crew analysis"]

    RESULT --> SENT["Sentiment Analysis<br/>(Claude Haiku)"]
    RESULT --> TRANS{"Translation<br/>requested?"}
    TRANS -->|Yes| HF["HuggingFace Translation"]
    TRANS -->|No| SKIP1["Skip"]

    RESULT --> GRAPH{"Neo4j sync<br/>enabled?"}
    GRAPH -->|Yes| NEO["Neo4j Upsert<br/>Document + Topics"]
    GRAPH -->|No| SKIP2["Skip"]

    RESULT --> VEC{"ChromaDB sync<br/>enabled?"}
    VEC -->|Yes| CHROMA["ChromaDB Upsert"]
    VEC -->|No| SKIP3["Skip"]

    SENT --> FINAL["Final Enriched Response"]
    HF --> FINAL
    NEO --> FINAL
    CHROMA --> FINAL
    SKIP1 --> FINAL
    SKIP2 --> FINAL
    SKIP3 --> FINAL
```

### LangGraph RAG Pipeline

The heart of the AI/ML layer is a **4-node LangGraph state machine** that processes documents through ingestion, retrieval, multi-agent validation, and finalization.

```mermaid
stateDiagram-v2
    [*] --> Ingest

    Ingest: 🔄 Ingest Node
    note right of Ingest
        Chunk document (900 chars, 120 overlap)
        Build FAISS vector store
        Create retriever
    end note

    RAG: 🔍 RAG Node
    note right of RAG
        Retrieve top-k context chunks
        Send to GPT-4o-mini
        Output structured JSON:
        • general_overview
        • main_topics
        • supporting_context
        • question_answer
    end note

    Crew: 🤖 Crew Node
    note right of Crew
        Kick off CrewAI
        3 agents sequential:
        Analyst → Researcher → Reviewer
    end note

    Finalize: ✅ Finalize Node
    note right of Finalize
        Merge RAG + Crew outputs
        Attach citations
        Build final payload
    end note

    Ingest --> RAG
    RAG --> Crew
    Crew --> Finalize
    Finalize --> [*]
```

**Detailed node-by-node:**

```mermaid
flowchart LR
    subgraph "1 · Ingest"
        DOC["Raw Document Text"]
        CHUNK["RecursiveCharacterTextSplitter<br/>900 chars · 120 overlap"]
        EMBED["sentence-transformers<br/>all-MiniLM-L6-v2"]
        FAISS["FAISS In-Memory<br/>Vector Store"]
        DOC --> CHUNK --> EMBED --> FAISS
    end

    subgraph "2 · RAG"
        QUERY["User Question<br/>(or default prompt)"]
        RETR["Retrieve top-k<br/>from FAISS"]
        PROMPT["Build RAG prompt<br/>with context"]
        GPT["GPT-4o-mini<br/>temp 0.05"]
        JSON["Structured JSON<br/>output"]
        QUERY --> RETR --> PROMPT --> GPT --> JSON
    end

    subgraph "3 · Crew"
        ANALYST["Document Analyst<br/>(GPT-4o)"]
        XREF["Cross-Referencer<br/>(Gemini 1.5 Pro)"]
        CURATOR["Insights Curator<br/>(Claude 3.5 Sonnet)"]
        ANALYST -->|sequential| XREF -->|sequential| CURATOR
    end

    subgraph "4 · Finalize"
        MERGE["Merge RAG + Crew"]
        CITE["Attach Citations"]
        OUT["Final Payload"]
        MERGE --> CITE --> OUT
    end

    FAISS -.->|retriever| RETR
    JSON --> ANALYST
    CURATOR --> MERGE
```

### CrewAI Multi-Agent Collaboration

Three specialized agents work sequentially, each using a different LLM provider for diversity of perspective.

```mermaid
flowchart TD
    INPUT["Document Text +<br/>RAG Output"] --> ANALYST

    subgraph "Agent 1 — Document Analyst"
        ANALYST["🔬 Document Analyst<br/>Model: GPT-4o (OpenAI)<br/>Temp: 0.15 · Max: 900 tokens"]
        A_TOOLS["Tools: DocumentSearchTool<br/>InsightsExtractionTool"]
        A_OUT["Output: Structured<br/>markdown summary"]
        ANALYST --> A_TOOLS --> A_OUT
    end

    A_OUT --> XREF

    subgraph "Agent 2 — Cross-Referencer"
        XREF["🔎 Cross-Referencer<br/>Model: Gemini 1.5 Pro (Google)<br/>Temp: 0.2 · Max: 1024 tokens"]
        X_TOOLS["Tools: DocumentSearchTool"]
        X_OUT["Output: Verified statements<br/>with flagged uncertainties"]
        XREF --> X_TOOLS --> X_OUT
    end

    X_OUT --> CURATOR

    subgraph "Agent 3 — Insights Curator"
        CURATOR["📋 Insights Curator<br/>Model: Claude 3.5 Sonnet (Anthropic)<br/>Temp: 0.15 · Max: 1024 tokens"]
        C_TOOLS["Tools: DocumentSearchTool<br/>InsightsExtractionTool"]
        C_OUT["Output: Executive-ready<br/>action items & risks"]
        CURATOR --> C_TOOLS --> C_OUT
    end

    C_OUT --> FINAL["Combined Crew<br/>Analysis"]
```

**Why three different providers?**

Each model brings different strengths — OpenAI for structured analysis, Gemini for broad factual grounding, and Claude for nuanced reasoning. Running them sequentially creates a **validation pipeline** where each agent can build on and challenge the previous agent's work.

### Vector & Graph Stores

```mermaid
graph TB
    subgraph "Ephemeral (Per-Request)"
        FAISS["FAISS In-Memory<br/>Created per document<br/>Used by RAG node"]
    end

    subgraph "Persistent (Cross-Session)"
        CHROMA["ChromaDB<br/>On-disk vector store<br/>Configurable directory"]
        NEO4J["Neo4j<br/>Knowledge graph<br/>Document → Topic relationships"]
    end

    DOC["Document"] -->|"chunk + embed"| FAISS
    DOC -->|"optional sync"| CHROMA
    DOC -->|"optional sync"| NEO4J

    QUERY["Search Query"] --> FAISS
    QUERY --> CHROMA
    CYPHER["Cypher Query"] --> NEO4J

    subgraph "Neo4j Schema"
        D_NODE["(:Document {id, title})"]
        T_NODE["(:Topic {name})"]
        D_NODE -->|"COVERS {weight}"| T_NODE
    end
```

**Vector store options:**

| Store | Type | Scope | Use Case |
|-------|------|-------|----------|
| **FAISS** | In-memory | Per-request | Fast retrieval during RAG pipeline execution |
| **ChromaDB** | On-disk | Cross-session | Persistent semantic recall across conversations |
| **Neo4j** | Graph DB | Cross-session | Relationship mapping, topic clustering, Cypher queries |

### LLM Provider Registry

The `LLMProviderRegistry` provides lazy-loaded, cached access to all LLM and embedding models.

```mermaid
graph TB
    REG["LLMProviderRegistry<br/>(singleton, @lru_cache)"]

    REG --> OAI["OpenAI<br/>GPT-4o · GPT-4o-mini"]
    REG --> ANT["Anthropic<br/>Claude 3.5 Sonnet · Claude Haiku"]
    REG --> GEM["Google<br/>Gemini 1.5 Pro"]

    REG --> EMB_HF["HuggingFace Embeddings<br/>all-MiniLM-L6-v2"]
    REG --> EMB_OAI["OpenAI Embeddings<br/>text-embedding-3-large"]
    REG --> EMB_G["Google Embeddings<br/>text-embedding-004"]
```

### Processing Modules

Thin wrappers around the `DocumentIntelligenceService` for specific tasks:

```mermaid
graph LR
    DIS["DocumentIntelligenceService"]

    DIS --> SUM["Summarizer<br/>narrative + bullet"]
    DIS --> SENT["Sentiment Analyzer<br/>JSON with confidence"]
    DIS --> TOPIC["Topic Extractor<br/>AI-powered themes"]
    DIS --> TRANS["Translator<br/>7+ languages via HF"]
    DIS --> DISC["Discussion Generator<br/>debate prompts"]
    DIS --> REC["Recommendations<br/>actionable next steps"]
    DIS --> REW["Rewriter<br/>tone-based transform"]
    DIS --> CHAT["Chat Handler<br/>context-aware Q&A"]
    DIS --> KI["Key Ideas Extractor<br/>3-7 key insights"]
```

---

## Data Flow Examples

### Document Upload & Analysis

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supervisor
    participant PB as Python Bridge
    participant AI as AI/ML (FastAPI)
    participant LG as LangGraph
    participant CA as CrewAI
    participant LLM as LLM Providers

    C->>S: POST /api/supervisor/process<br/>{intent: "document.upload", text: "..."}
    S->>S: Classify → document.upload
    S->>S: Decompose → [extract, summarize, store]

    Note over S,AI: Task 0: Extract
    S->>PB: analyzeDocument(text)
    PB->>AI: POST /api/analyze
    AI->>LG: AgenticRAGPipeline.run()

    Note over LG: Node 1: Ingest
    LG->>LG: Chunk → Embed → FAISS

    Note over LG,LLM: Node 2: RAG
    LG->>LLM: GPT-4o-mini (structured JSON)
    LLM-->>LG: {overview, topics, context, qa}

    Note over LG,CA: Node 3: Crew
    LG->>CA: kickoff()
    CA->>LLM: GPT-4o (Analyst)
    LLM-->>CA: Summary
    CA->>LLM: Gemini 1.5 Pro (Cross-Ref)
    LLM-->>CA: Verified statements
    CA->>LLM: Claude 3.5 Sonnet (Curator)
    LLM-->>CA: Action items
    CA-->>LG: Crew analysis

    Note over LG: Node 4: Finalize
    LG-->>AI: Merged result + citations
    AI-->>PB: JSON response
    PB-->>S: Extracted analysis

    Note over S,LLM: Task 1: Summarize
    S->>LLM: Claude (with system prompt)
    LLM-->>S: Summary text

    Note over S: Task 2: Store
    S->>S: Aggregate all results
    S-->>C: {summary, keyIdeas, sentiment, ...}
```

### Document Chat with Agent Loop

```mermaid
sequenceDiagram
    participant C as Client
    participant AL as Agent Loop
    participant TR as Tool Registry
    participant PB as Python Bridge
    participant AI as AI/ML Backend
    participant LLM as Claude

    C->>AL: POST /api/agent/run<br/>{message: "What are the key risks?", docContext}
    AL->>LLM: Call with tools + context

    Note over LLM: LLM decides to use tools
    LLM-->>AL: tool_use: rag_search({query: "key risks"})

    AL->>TR: Execute "rag_search"
    TR->>PB: queryRAG({query: "key risks", top_k: 5})
    PB->>AI: POST /api/rag/query
    AI-->>PB: [{chunk, score}, ...]
    PB-->>TR: Results
    TR-->>AL: Tool result JSON

    AL->>LLM: Feed tool results as user message
    Note over LLM: LLM has enough context
    LLM-->>AL: Final text response

    AL-->>C: {response, tokenUsage, iterations: 2}
```

### Batch Processing

```mermaid
flowchart TD
    INPUT["Array of N documents"] --> CHUNK["Split into batches<br/>of 10 documents"]

    CHUNK --> B1["Batch 1"]
    CHUNK --> B2["Batch 2"]
    CHUNK --> BN["Batch N/10"]

    B1 --> POOL["Concurrency Pool<br/>max 3 simultaneous batches"]
    B2 --> POOL
    BN --> POOL

    POOL --> P1["Process doc 1<br/>via LLM"]
    POOL --> P2["Process doc 2<br/>via LLM"]
    POOL --> PN["Process doc N<br/>via LLM"]

    P1 --> COLLECT["Collect Results"]
    P2 --> COLLECT
    PN --> COLLECT

    COLLECT --> REPORT["Return:<br/>results[] · errors[] · successRate"]
```

---

## Model Configuration Reference

### AI/ML Pipeline Models

| Role | Model | Provider | Temperature | Max Tokens | Purpose |
|------|-------|----------|-------------|------------|---------|
| RAG QA | `gpt-4o-mini` | OpenAI | 0.05 | 900 | Structured JSON extraction |
| Document Analyst | `gpt-4o` | OpenAI | 0.15 | 900 | Holistic summarization |
| Cross-Referencer | `gemini-1.5-pro` | Google | 0.20 | 1024 | Fact verification |
| Insights Curator | `claude-3-5-sonnet-20241022` | Anthropic | 0.15 | 1024 | Executive recommendations |
| Sentiment | `claude-3-haiku-20240307` | Anthropic | 0.05 | 512 | Sentiment scoring |

### Orchestrator Models

| Role | Model | Provider | Purpose |
|------|-------|----------|---------|
| Primary LLM | Claude (configurable) | Anthropic | Document ops, chat, summarization |
| Fallback LLM | Gemini (configurable) | Google | Provider failover, voice/translation preferred |
| Intent Classifier | Claude Haiku | Anthropic | Low-cost intent classification |

### Embedding Models

| Provider | Model | Dimensions | Use Case |
|----------|-------|------------|----------|
| HuggingFace (default) | `all-MiniLM-L6-v2` | 384 | Local, fast, no API cost |
| OpenAI | `text-embedding-3-large` | 3072 | High-quality, API-based |
| Google | `text-embedding-004` | 768 | Alternative API-based |

---

## Environment Variables

### Orchestrator

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `AI_ML_SERVICE_URL` | `http://localhost:8000` | Python AI/ML backend URL |
| `ANTHROPIC_API_KEY` | — | Claude API access |
| `GOOGLE_AI_API_KEY` | — | Gemini API access |
| `DAILY_BUDGET` | `10` | USD daily limit |
| `MONTHLY_BUDGET` | `200` | USD monthly limit |
| `CIRCUIT_BREAKER_THRESHOLD` | `3` | Failures before tripping |
| `CIRCUIT_BREAKER_COOLDOWN_MS` | `60000` | Cooldown before probe |
| `REDIS_URL` | — | For hybrid RAG keyword search |
| `BACKEND_URL` | `http://localhost:3000` | Backend proxy target |

### AI/ML Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI access |
| `ANTHROPIC_API_KEY` | — | Anthropic access |
| `GOOGLE_API_KEY` | — | Google AI access |
| `DOCUTHINKER_OPENAI_MODEL` | `gpt-4o-mini` | Override OpenAI model |
| `DOCUTHINKER_CLAUDE_MODEL` | `claude-3-5-sonnet-20241022` | Override Claude model |
| `DOCUTHINKER_GEMINI_MODEL` | `gemini-1.5-pro` | Override Gemini model |
| `DOCUTHINKER_CHUNK_SIZE` | `900` | Document chunk size (chars) |
| `DOCUTHINKER_CHUNK_OVERLAP` | `120` | Chunk overlap (chars) |
| `DOCUTHINKER_EMBEDDING_PROVIDER` | `huggingface` | Embedding provider |
| `DOCUTHINKER_EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Embedding model |
| `DOCUTHINKER_SYNC_GRAPH` | `false` | Auto-sync to Neo4j |
| `DOCUTHINKER_SYNC_VECTOR` | `false` | Auto-sync to ChromaDB |
| `DOCUTHINKER_NEO4J_URI` | — | Neo4j connection URI |
| `DOCUTHINKER_CHROMA_DIR` | — | ChromaDB persistence dir |

---

## API Surface

### Orchestrator Endpoints (Port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Full system health (circuits, costs, cache, DLQ) |
| `POST` | `/api/supervisor/process` | Main entry — classify, decompose, dispatch, aggregate |
| `POST` | `/api/agent/run` | Agent tool-use loop |
| `POST` | `/api/batch/process` | Multi-document batch processing |
| `POST` | `/api/token-check` | Context window verification |
| `POST` | `/api/tools/execute` | Direct tool execution |
| `GET` | `/api/tools` | List registered tools |
| `GET` | `/api/costs` | Cost report by provider/intent |
| `GET` | `/api/circuits` | Circuit breaker states |
| `GET` | `/api/context-metrics` | Context utilization metrics |
| `GET` | `/api/dlq` | Dead letter queue stats |
| `POST` | `/api/conversations/:userId/:docId/message` | Add conversation message |
| `GET` | `/api/conversations/:userId/:docId` | Get conversation history |
| `DELETE` | `/api/conversations/:userId/:docId` | Clear conversation |

### AI/ML Endpoints (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Full document intelligence pipeline |
| `POST` | `/api/rag/query` | Semantic RAG search |
| `POST` | `/api/crew/analyze` | CrewAI multi-agent analysis |
| `POST` | `/api/nlp/ner` | Named entity recognition |
| `POST` | `/api/nlp/sentiment` | Sentiment analysis |
| `POST` | `/api/vector/search` | ChromaDB vector search |
| `POST` | `/api/graph/query` | Neo4j Cypher queries |
| `GET` | `/health` | Service health |

### MCP Tools (stdio)

**Orchestrator MCP Server (13 tools):** `document_summarize`, `document_key_ideas`, `document_sentiment`, `document_discussion_points`, `document_analytics`, `document_bullet_summary`, `document_rewrite`, `document_recommendations`, `document_chat`, `system_health`, `system_costs`, `rag_query`, `knowledge_graph_query`

**AI/ML MCP Server (7 tools):** `agentic_document_brief`, `semantic_document_search`, `quick_topics`, `vector_upsert`, `vector_search`, `graph_upsert`, `graph_query`
