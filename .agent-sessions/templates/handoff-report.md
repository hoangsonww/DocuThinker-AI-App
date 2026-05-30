# Handoff Report: {outgoing-agent} → {incoming-agent}

> **Date**: {ISO 8601}
> **Outgoing Session**: `.agent-sessions/completed/{session-file}.md`
> **Incoming Agent Role**: {lead | feature | test}

---

## Context Summary

{2–3 paragraph summary of what was accomplished, what the current state of the codebase is, and why the handoff is happening (session end, role change, escalation, etc.)}

---

## Bead Status

| Bead ID | Title | Status | Branch | Notes |
|---------|-------|--------|--------|-------|
| {AREA-NUM} | {Title} | ✅ Done | `agent/{name}/{bead}` | {Merged / awaiting review} |
| {AREA-NUM} | {Title} | 🔄 In Progress | `agent/{name}/{bead}` | {What remains — be specific} |
| {AREA-NUM} | {Title} | ⛔ Blocked | — | {What it's blocked on} |
| {AREA-NUM} | {Title} | ⏭️ Not Started | — | {Ready to pick up} |

---

## Open Questions

> Decisions the outgoing agent could not make — the incoming agent or a lead must resolve these.

| # | Question | Context | Suggested Answer |
|---|----------|---------|-----------------|
| 1 | {Question} | {Why it matters} | {Your recommendation, if any} |
| 2 | {Question} | {Context} | {Recommendation} |

---

## Environment State

> What the incoming agent needs to have running or configured.

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] `cd orchestrator && npm install` run
- [ ] `.env` file configured (see `.env.example`)

### Running Services
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Orchestrator | 4000 | {Running / Stopped} | {Any special flags} |
| AI/ML Backend | 8000 | {Running / Stopped / Mocked} | {Mock details if applicable} |
| Redis | 6379 | {Running / Stopped} | {Data state — empty or populated} |

### Branch State
- **Current branch**: `agent/{name}/{bead}`
- **Uncommitted changes**: {Yes — describe / No}
- **Divergence from main**: {number of commits ahead}

---

## Recommended Next Steps

> Ordered by priority. Be specific — file paths, bead IDs, and concrete actions.

1. **{Action}** — {Why this should be done first}
   - Files: `path/to/file`
   - Bead: `{AREA-NUM}`

2. **{Action}** — {Why}
   - Files: `path/to/file`

3. **{Action}** — {Why}

---

## Risk Flags

> Known fragile areas, flaky tests, tight deadlines, or anything that could go wrong.

| Risk | Severity | Mitigation |
|------|----------|------------|
| {Description} | 🟢 Low / 🟡 Medium / 🔴 High | {How to avoid or handle it} |

---

## Outgoing Session Metrics

| Metric | Value |
|--------|-------|
| Session duration | {e.g., 90 min} |
| Beads completed | {e.g., 2} |
| Beads blocked | {e.g., 1} |
| Tests passing | {e.g., 47/47} |
| Estimated cost | {e.g., $0.12} |

---

> **See also:** [Session Schema](../SCHEMA.md) · [Beads README](../../.beads/README.md) · [AGENTS.md](../../AGENTS.md)
