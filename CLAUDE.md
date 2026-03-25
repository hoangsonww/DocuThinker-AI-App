# DocuThinker — Claude Code Configuration

## Architecture Overview
- **Frontend**: React 18 + Material-UI in `frontend/`
- **Backend**: Express.js + Firebase Auth in `backend/`
- **Orchestrator**: Agentic layer in `orchestrator/` (Node.js, port 4000)
- **AI/ML**: Python LangGraph + CrewAI in `ai_ml/`
- **Mobile**: React Native in `mobile-app/`
- **Infrastructure**: K8s + Helm + Terraform + Docker

## Code Standards
- Orchestrator: JavaScript (Node.js 18+), CommonJS modules
- AI/ML: Python 3.10+, type hints
- Backend: JavaScript, CommonJS (DO NOT MODIFY)
- Frontend: React functional components (DO NOT MODIFY)

## Testing
- Orchestrator: `cd orchestrator && npm test`
- Integration: `cd orchestrator && npx jest __tests__/`

## Build & Run
- Orchestrator: `cd orchestrator && npm install && npm start`
- Full stack: `docker compose up --build`
