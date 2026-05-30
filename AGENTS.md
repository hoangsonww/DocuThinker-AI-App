# DocuThinker — Agent Coordination Protocol

## Project Overview
DocuThinker is a FERN-Stack AI-powered document analysis app with a Python AI/ML layer (`ai_ml/`) and a Node.js orchestrator (`orchestrator/`).

## File Reservation System
Each agent declares file reservations before editing.
Check `.beads/.status.json` before starting ANY work.
Use branch naming: `agent/<agent-name>/<bead-id>`

## Conflict Zones (single agent only)
- `docker-compose.yml`
- `ai_ml/services/orchestrator.py`
- `ai_ml/providers/registry.py`
- `orchestrator/index.js`
- Any shared config files

## Safe Parallel Zones
- Separate service directories
- Independent test files
- New files in new directories
- Documentation files

## Communication Protocol
1. Post to `.beads/.status.json` with agent ID and claimed files
2. Check for conflicts before editing
3. Update status every 30 minutes
4. Release reservations on completion
