# Beads — Atomic Task Units for Agent Swarm Coordination

Beads are **self-contained, dependency-aware task units** that any AI agent (or human developer) can pick up, execute, and complete. They are the fundamental building block of DocuThinker's multi-agent coordination system, enabling safe parallel development across the codebase.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Directory Layout](#directory-layout)
- [Bead Lifecycle](#bead-lifecycle)
- [Creating a Bead](#creating-a-bead)
- [Status Tracking](#status-tracking)
- [File Reservation Protocol](#file-reservation-protocol)
- [Conflict Zones](#conflict-zones)
- [Safe Parallel Zones](#safe-parallel-zones)
- [Branch Naming](#branch-naming)
- [Acceptance Criteria](#acceptance-criteria)
- [Integration with Agent Sessions](#integration-with-agent-sessions)
- [Quick Reference](#quick-reference)

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Bead** | An atomic unit of work with a clear background, desired outcome, file list, dependency chain, and acceptance criteria. |
| **Reservation** | A lock on one or more files claimed by an agent via `.status.json` — prevents concurrent writes. |
| **Conflict Zone** | A file that only one agent may reserve at a time (shared entry points and configs). |
| **Safe Zone** | A directory or file type where multiple agents can work in parallel without risk. |
| **Dependency** | A directed edge between beads: `Depends on` (upstream) and `Blocks` (downstream). |
| **Acceptance Criteria** | Testable conditions that must all pass before a bead is considered complete. |

---

## Directory Layout

```
.beads/
├── .status.json              # Live agent reservations, counters, timestamps
├── README.md                 # This file — comprehensive beads guide
├── active/                   # Beads currently available for agents to pick up
│   └── (bead markdown files)
├── completed/                # Archive of successfully finished beads
│   └── (bead markdown files)
└── templates/
    └── feature-bead.md       # Canonical template for creating new beads
```

> **Note:** The `active/` and `completed/` directories are created as beads are authored and finished. If they don't exist yet, create them when authoring your first bead.

---

## Bead Lifecycle

```
┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌──────┐
│ Authored │────▶│ Claimed  │────▶│ In Progress │────▶│ Testing  │────▶│ Done │
└──────────┘     └──────────┘     └─────────────┘     └──────────┘     └──────┘
                                        │    ▲              │
                                        ▼    │              │
                                   ┌─────────┐              │
                                   │ Blocked │              │
                                   └─────────┘    (fail)───┘
```

| State | Description | `.status.json` Change |
|-------|-------------|-----------------------|
| **Authored** | Bead created in `active/` from template | None |
| **Claimed** | Agent reserves files | `agents[id]` added, `reservations` updated, `beadsActive++` |
| **In Progress** | Agent is implementing | Heartbeat updates `lastUpdated` every 30 min |
| **Blocked** | Upstream dependency not yet complete | Agent may release reservation and pick another bead |
| **Testing** | Code changes done, running acceptance criteria | No status change |
| **Done** | All criteria pass | Reservations released, bead moved to `completed/`, `beadsCompleted++`, `beadsActive--` |

---

## Creating a Bead

1. Copy the template:

   ```bash
   cp .beads/templates/feature-bead.md .beads/active/AREA-NUM-short-title.md
   ```

2. Fill in every section of the template:

   | Section | What to Write |
   |---------|---------------|
   | **Title** | `[AREA-NUM] Short Descriptive Title` (e.g., `[ORCH-04] Add retry backoff to Python Bridge`) |
   | **Background** | 2–3 sentences on why this work exists and what problem it solves |
   | **Current State** | List every file the agent should READ before making changes |
   | **Desired Outcome** | A specific, testable description of the end state |
   | **Files to Touch** | `READ FIRST, then ENHANCE: path/to/file` or `CREATE NEW: path/to/file` |
   | **Dependencies** | `Depends on: [AREA-NUM]` and `Blocks: [AREA-NUM]` — leave blank if none |
   | **Acceptance Criteria** | Checklist — always include `All existing tests still pass` |

3. Commit the bead file so other agents can discover it.

### Area Prefixes

| Prefix | Layer |
|--------|-------|
| `ORCH` | Orchestrator (Node.js) |
| `AIML` | AI/ML Pipeline (Python) |
| `FE` | Frontend (React) |
| `BE` | Backend (Express) |
| `INFRA` | Infrastructure (K8s, Helm, Terraform, Docker) |
| `DOC` | Documentation |
| `TEST` | Testing |

---

## Status Tracking

### Schema (`.beads/.status.json`)

```json
{
  "version": "1.0.0",
  "agents": {
    "agent-abc123": {
      "name": "feature-agent",
      "role": "feature",
      "startedAt": "2025-01-15T10:00:00Z",
      "currentBead": "ORCH-04",
      "heartbeat": "2025-01-15T10:30:00Z"
    }
  },
  "reservations": {
    "orchestrator/core/python-bridge.js": "agent-abc123",
    "orchestrator/__tests__/python-bridge.test.js": "agent-abc123"
  },
  "lastUpdated": "2025-01-15T10:30:00Z",
  "beadsCompleted": 12,
  "beadsActive": 1
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Schema version (currently `1.0.0`) |
| `agents` | `Record<string, AgentMeta>` | Map of agent IDs → metadata |
| `agents[].name` | `string` | Human-readable agent name |
| `agents[].role` | `string` | Role from `.claude/team-config.json` (`lead`, `feature`, `test`) |
| `agents[].startedAt` | `ISO 8601` | When the agent registered |
| `agents[].currentBead` | `string` | Bead ID currently being worked on |
| `agents[].heartbeat` | `ISO 8601` | Last heartbeat timestamp |
| `reservations` | `Record<string, string>` | File path → agent ID holding the reservation |
| `lastUpdated` | `ISO 8601 / null` | Timestamp of last status change |
| `beadsCompleted` | `number` | Total beads successfully finished |
| `beadsActive` | `number` | Beads currently in progress |

### Stale Reservation Detection

An agent's reservation is considered **stale** if its `heartbeat` is older than 60 minutes. Stale reservations may be reclaimed by another agent after logging a warning. The `post-session.sh` hook (`.claude/hooks/post-session.sh`) automatically cleans up reservations when an agent session ends.

---

## File Reservation Protocol

```
1. READ   .beads/.status.json
2. CHECK  no existing reservation on your target files
3. WRITE  your agent ID + file paths into reservations
4. WORK   implement the bead
5. HEARTBEAT  update lastUpdated every 30 minutes
6. RELEASE    remove your reservations on completion or failure
```

### Rules

- **Never** modify a file you haven't reserved.
- **Never** reserve a file already held by another agent — wait or pick a different bead.
- If you need a file in a conflict zone that's already reserved, check back after the holding agent's heartbeat window (30 min). If stale (>60 min), you may reclaim it.
- On session exit (normal or crash), the `post-session.sh` hook cleans up your reservations automatically.

---

## Conflict Zones

These files are **single-agent only** — only one reservation at a time:

| File | Why |
|------|-----|
| `docker-compose.yml` | Global service topology — all services depend on it |
| `ai_ml/services/orchestrator.py` | Central AI/ML façade — every pipeline routes through it |
| `ai_ml/providers/registry.py` | Shared LLM provider configuration |
| `orchestrator/index.js` | Orchestrator entry point and Express route wiring |
| Any shared config (`.env`, `package.json` root, etc.) | Cross-service build and runtime settings |

---

## Safe Parallel Zones

Multiple agents can work in these areas simultaneously:

| Zone | Examples |
|------|----------|
| **Separate service directories** | `orchestrator/context/` vs. `ai_ml/pipelines/` |
| **Independent test files** | `orchestrator/__tests__/new-feature.test.js` |
| **New files in new directories** | `ai_ml/providers/new-provider.py` |
| **Documentation** | `README.md`, `ARCHITECTURE.md` (coordinate via sections, not whole-file locks) |
| **Infrastructure modules** | `terraform/modules/new-module/` |
| **Individual skill files** | `.claude/skills/new-skill.md` |

---

## Branch Naming

All agent work happens on branches following this convention:

```
agent/<agent-name>/<bead-id>
```

**Examples:**
- `agent/claude-feature/ORCH-04`
- `agent/claude-test/TEST-02`
- `agent/claude-lead/INFRA-11`

This enables:
- Tracking which agent produced which changes
- Reverting individual agent contributions without affecting others
- Clean PR-per-bead workflow

---

## Acceptance Criteria

Every bead **must** include acceptance criteria. The minimum baseline is:

```markdown
## Acceptance Criteria
- [ ] [Specific functional criterion]
- [ ] All existing tests still pass
```

### Running Tests

| Layer | Command |
|-------|---------|
| Orchestrator | `cd orchestrator && npm test` |
| AI/ML | `cd ai_ml && python -m pytest` |
| Integration | `cd orchestrator && npx jest __tests__/` |
| Full stack | `docker compose up --build` (verify `/health` endpoints) |

An agent must **not** mark a bead as Done until every criterion is checked off.

---

## Integration with Agent Sessions

Beads and agent sessions are complementary systems:

| System | Scope | Tracks |
|--------|-------|--------|
| **Beads** (`.beads/`) | Task-level coordination | What work exists, who's doing it, file locks |
| **Agent Sessions** (`.agent-sessions/`) | Session-level history | What happened, decisions made, handoff notes |

When completing a bead, the agent should also log a session entry (see `.agent-sessions/README.md`) documenting:
- Which bead was worked on
- Files modified
- Decisions made and rationale
- Recommendations for the next session

---

## Quick Reference

```bash
# See who's working on what
cat .beads/.status.json | python -m json.tool

# List available beads
ls .beads/active/

# List completed beads
ls .beads/completed/

# Create a new bead from template
cp .beads/templates/feature-bead.md .beads/active/ORCH-05-add-retry-jitter.md

# Check for stale reservations (>60 min heartbeat)
node -e "
const s = require('./.beads/.status.json');
const now = Date.now();
for (const [id, a] of Object.entries(s.agents || {})) {
  const age = (now - new Date(a.heartbeat).getTime()) / 60000;
  if (age > 60) console.log('STALE:', id, a.currentBead, Math.round(age) + 'min');
}
"
```

---

> **See also:** [AGENTS.md](../AGENTS.md) · [ARCHITECTURE.md — Beads Task Coordination](../ARCHITECTURE.md#beads-task-coordination) · [AI_ML.md — Beads Integration](../AI_ML.md#beads-integration) · [`.agent-sessions/README.md`](../.agent-sessions/README.md)
