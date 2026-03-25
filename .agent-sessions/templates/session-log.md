# Session: {YYYYMMDD}-{HHMMSS}-{agent-name}

## Meta

- **Agent ID**: {unique agent identifier, e.g., claude-feature-001}
- **Role**: {lead | feature | test}
- **Started**: {ISO 8601, e.g., 2025-01-15T10:30:00Z}
- **Completed**: {ISO 8601 or "in-progress"}
- **Status**: {active | completed | paused | abandoned}

---

## Objective

{1–2 sentences describing what this session aims to accomplish. Be specific — "Implement retry backoff in the Python Bridge and add unit tests" not "Work on orchestrator stuff."}

---

## Beads Worked

| Bead ID | Title | Start Status | End Status | Notes |
|---------|-------|-------------|------------|-------|
| {AREA-NUM} | {Short title} | {claimed/in-progress} | {done/blocked/in-progress} | {Brief note} |

---

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `path/to/file` | Modified | {What changed and why} |
| `path/to/new-file` | Created | {What this file does} |
| `path/to/deleted-file` | Deleted | {Why it was removed} |

---

## Decisions Made

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | {What was decided} | {Why — tied to project goals} | {What else was considered} |
| 2 | {What was decided} | {Why} | {Alternatives} |

---

## Blockers

> Remove this section if no blockers were encountered.

| Blocker | Severity | Resolution / Escalation |
|---------|----------|------------------------|
| {Description} | 🟢 Low / 🟡 Medium / 🔴 High | {How it was resolved or where it was escalated} |

---

## Handoff Notes

> These notes must be specific enough that a new agent can start working within 5 minutes without re-exploring the codebase.

### Completed Work
- {What was finished and where to find it}

### Remaining Work
- {What still needs to be done, with specific file paths and bead IDs}

### Warnings
- {Any fragile areas, flaky tests, or known issues the next agent should know about}

### Recommended Next Bead
- **{AREA-NUM}**: {Why this should be picked up next}

---

## Metrics

> Optional but recommended. Fill in what you can.

| Metric | Value |
|--------|-------|
| Session duration | {e.g., 45 min} |
| Tokens (input) | {e.g., 12,400} |
| Tokens (output) | {e.g., 3,200} |
| Estimated cost | {e.g., $0.08} |
| Agent loop iterations | {e.g., 6} |
| Tests run | {e.g., 14} |
| Tests passed | {e.g., 14} |

---

## Trace IDs

> Optional. Record orchestrator trace IDs if you ran the system during testing.

| Trace ID | Description |
|----------|-------------|
| `dt-{timestamp}-{random}` | {What was tested} |

---

## Environment Notes

> Optional. Record any local setup that the next agent needs to know about.

- Node.js version: {e.g., 18.19.0}
- Python version: {e.g., 3.11.5}
- Services running: {e.g., Orchestrator :4000, Redis :6379}
- Services mocked: {e.g., AI/ML :8000}

---

## References

- Branch: `agent/{agent-name}/{bead-id}`
- PR: #{number}
- Bead: `.beads/active/{bead-file}.md`
- Previous session: `.agent-sessions/completed/{session-file}.md`
