# Agent Sessions — Session-Level History & Coordination

Agent Sessions provide **session-level tracking, handoff continuity, and audit history** for every AI agent (or human developer) working on the DocuThinker codebase. While [Beads](../.beads/README.md) coordinate *what work is being done* (task-level), Agent Sessions coordinate *how work progresses over time* (session-level).

---

## Table of Contents

- [Purpose](#purpose)
- [Directory Layout](#directory-layout)
- [Session Lifecycle](#session-lifecycle)
- [Creating a Session](#creating-a-session)
- [Session Schema](#session-schema)
- [Active vs. Completed Sessions](#active-vs-completed-sessions)
- [Handoff Protocol](#handoff-protocol)
- [Escalation & Conflict Resolution](#escalation--conflict-resolution)
- [Integration with Beads](#integration-with-beads)
- [Integration with the Orchestrator](#integration-with-the-orchestrator)
- [Agent Roles](#agent-roles)
- [Configuration](#configuration)
- [Monitoring & Auditing](#monitoring--auditing)
- [Quick Reference](#quick-reference)

---

## Purpose

When multiple agents collaborate on a codebase over hours, days, or weeks, critical context is lost between sessions:

- *Why* was a particular design decision made?
- *Which* beads were attempted but blocked?
- *What* should the next agent pick up?
- *Who* last modified a conflict-zone file?

Agent Sessions solve this by recording:

| What | Why |
|------|-----|
| **Objective** | What the session aimed to accomplish |
| **Beads worked** | Which task units were claimed, progressed, or completed |
| **Files modified** | Exact paths and a brief description of each change |
| **Decisions made** | Rationale for every non-trivial choice |
| **Blockers encountered** | What prevented progress and how it was resolved (or escalated) |
| **Handoff notes** | Specific, actionable recommendations for the next session |
| **Metrics** | Token usage, cost, duration, iterations |

---

## Directory Layout

```
.agent-sessions/
├── README.md                          # This file — comprehensive guide
├── config.json                        # Global session configuration
├── SCHEMA.md                          # Formal session data structure docs
├── active/                            # Sessions currently in progress
│   └── {YYYYMMDD}-{HHMMSS}-{agent}.md
├── completed/                         # Archive of finished sessions
│   └── {YYYYMMDD}-{HHMMSS}-{agent}.md
└── templates/
    ├── session-log.md                 # Standard session log template
    ├── handoff-report.md              # Agent-to-agent handoff template
    └── escalation-report.md           # Conflict / blocker escalation template
```

---

## Session Lifecycle

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐
│  Start   │────▶│  Active  │────▶│  Wrapping  │────▶│ Completed │
│          │     │          │     │    Up      │     │           │
└──────────┘     └──────────┘     └────────────┘     └───────────┘
                      │                 │
                      ▼                 ▼
                 ┌──────────┐     ┌───────────┐
                 │  Paused  │     │  Handoff  │
                 │(blocked) │     │ (to next  │
                 └──────────┘     │  agent)   │
                                  └───────────┘
```

| Phase | Actions |
|-------|---------|
| **Start** | Create session file in `active/` from template. Register in `.beads/.status.json` if claiming files. |
| **Active** | Work on beads. Log decisions, files modified, and blockers in real time. Heartbeat every 30 min. |
| **Paused** | Session interrupted by a blocker (dependency, conflict, budget limit). Document the blocker. |
| **Wrapping Up** | Run final tests. Update bead status. Write handoff notes. |
| **Completed** | Move session file from `active/` to `completed/`. Release all bead reservations. |
| **Handoff** | Produce a handoff report (see [Handoff Protocol](#handoff-protocol)) for the next agent. |

---

## Creating a Session

1. **Copy the template:**

   ```bash
   cp .agent-sessions/templates/session-log.md \
      .agent-sessions/active/$(date +%Y%m%d-%H%M%S)-feature-agent.md
   ```

2. **Fill in the header** with your agent ID, role, objective, and target beads.

3. **Update as you work** — every decision, file change, and blocker should be logged before you forget the context.

4. **On completion**, move the file:

   ```bash
   mv .agent-sessions/active/20250115-103000-feature-agent.md \
      .agent-sessions/completed/
   ```

---

## Session Schema

Each session log follows a structured format. See [SCHEMA.md](SCHEMA.md) for the full specification. At a glance:

| Field | Required | Description |
|-------|----------|-------------|
| `Session ID` | ✅ | `{YYYYMMDD}-{HHMMSS}-{agent-name}` |
| `Agent ID` | ✅ | Unique identifier (matches `.beads/.status.json`) |
| `Role` | ✅ | `lead`, `feature`, or `test` (from `.claude/team-config.json`) |
| `Objective` | ✅ | 1–2 sentence goal for this session |
| `Beads Worked` | ✅ | List of bead IDs with status (claimed / in-progress / done / blocked) |
| `Files Modified` | ✅ | Path + brief description of change |
| `Decisions Made` | ✅ | Decision + rationale (even if the decision was "do nothing") |
| `Blockers` | If any | What blocked progress, resolution or escalation path |
| `Handoff Notes` | ✅ | Specific next steps for the next session/agent |
| `Metrics` | Optional | Tokens used, cost, duration, iterations |
| `Trace IDs` | Optional | Orchestrator `traceId` values if runtime testing was performed |

---

## Active vs. Completed Sessions

| Aspect | `active/` | `completed/` |
|--------|-----------|--------------|
| **Contents** | Sessions currently being worked on | Finished session archives |
| **Mutability** | Updated in real time | Immutable after move |
| **Retention** | Until session completes or is abandoned | Indefinite (prunable by date) |
| **Naming** | `{YYYYMMDD}-{HHMMSS}-{agent}.md` | Same — preserves original timestamp |

### Abandoned Sessions

If an agent session is found in `active/` with no heartbeat update in `.beads/.status.json` for over 60 minutes, it is considered **abandoned**. Another agent may:

1. Review the abandoned session log for context.
2. Reclaim any bead reservations held by the stale agent.
3. Create a new session referencing the abandoned one.

---

## Handoff Protocol

When one agent finishes and another must continue the work, the outgoing agent produces a **handoff report** (`.agent-sessions/templates/handoff-report.md`):

### Handoff Checklist

1. ✅ All bead reservations released in `.beads/.status.json`.
2. ✅ Session log moved to `completed/`.
3. ✅ Handoff report created in `active/` or attached to the next session.
4. ✅ Branch pushed with descriptive commit messages.
5. ✅ Any failing tests documented with reproduction steps.

### What Goes in a Handoff Report

| Section | Content |
|---------|---------|
| **Context Summary** | What was accomplished and what remains |
| **Bead Status** | Per-bead status: done, in-progress, or blocked |
| **Open Questions** | Decisions the outgoing agent couldn't make |
| **Environment State** | Any local setup the next agent needs (installed deps, running services, env vars) |
| **Recommended Next Bead** | Which bead to pick up first and why |
| **Risk Flags** | Known fragile areas, flaky tests, or tight deadlines |

### Runtime Handoffs (Orchestrator)

The orchestrator's `HandoffManager` (`orchestrator/core/handoff.js`) handles **runtime** agent-to-agent context transfer (e.g., Node.js → Python). It serializes:

- Conversation summary
- Document reference
- Task state and user preferences
- Handoff reason

Development-time handoff reports (this system) serve the same purpose but at the *human/AI agent collaboration* level.

---

## Escalation & Conflict Resolution

When an agent encounters a problem it cannot resolve, it writes an **escalation report** (`.agent-sessions/templates/escalation-report.md`):

### When to Escalate

| Trigger | Example |
|---------|---------|
| **Reservation conflict** | Two agents need the same conflict-zone file |
| **Dependency deadlock** | Bead A depends on B, B depends on A |
| **Budget exceeded** | Daily or monthly cost limit hit (see `.claude/team-config.json`) |
| **Test failures** | Pre-existing test failures unrelated to your bead |
| **Architecture decision** | Change requires cross-layer modification beyond agent's role |

### Escalation Severity

| Level | Meaning | Action |
|-------|---------|--------|
| 🟢 **Low** | Informational — next agent should be aware | Log in session, note in handoff |
| 🟡 **Medium** | Blocks current bead but other beads available | Document blocker, pick another bead |
| 🔴 **High** | Blocks all progress — requires human or lead-agent intervention | Write escalation report, pause session |

---

## Integration with Beads

Agent Sessions and Beads are complementary:

```
  BEADS (.beads/)                    AGENT SESSIONS (.agent-sessions/)
  ─────────────────                  ─────────────────────────────────
  What work exists                   Who did the work and when
  File reservations                  Session-level audit trail
  Task dependencies                  Decision rationale
  Acceptance criteria                Handoff continuity
  Completion counters                Metrics and cost tracking
```

### Cross-Reference Pattern

- Every session log lists which **bead IDs** were worked on.
- Every bead's commit messages reference the **session ID**.
- Handoff reports reference both the **outgoing session** and the **target bead**.

### Typical Flow

```
1. Agent starts a session       → creates .agent-sessions/active/{session}.md
2. Agent claims a bead          → updates .beads/.status.json
3. Agent works on bead          → logs decisions in session file
4. Agent completes bead         → updates .beads/.status.json, checks off criteria
5. Agent wraps up session       → writes handoff notes
6. Agent ends session           → moves session to completed/, releases reservations
7. Next agent starts            → reads completed session + handoff, picks next bead
```

---

## Integration with the Orchestrator

When an agent tests changes by running the orchestrator, the session log should capture:

| Orchestrator Concept | Session Log Field |
|---------------------|-------------------|
| `traceId` (per-request identifier) | **Trace IDs** section — for debugging and replay |
| Cost Tracker output | **Metrics** section — token usage and cost |
| Circuit breaker trips | **Blockers** section — provider failures during testing |
| DLQ entries | **Blockers** section — operations that failed after retries |
| Agent Loop iterations | **Metrics** section — iteration count per test run |

---

## Agent Roles

Roles are defined in `.claude/team-config.json` and determine what an agent is allowed to do:

| Role | Description | Allowed Directories | Session Expectations |
|------|-------------|--------------------|--------------------|
| **lead** | Architecture decisions, cross-cutting changes | `*` (all) | Detailed decision rationale; may resolve escalations |
| **feature** | Feature implementation | `orchestrator/`, `ai_ml/` | Bead-focused logs; handoff notes for partial work |
| **test** | Testing and quality assurance | `testing/`, `orchestrator/__tests__/` | Test results, coverage deltas, flaky test reports |

### Concurrency Limits

From `team-config.json`:
- **Max concurrent agents:** 3
- **Cost limits:** $10/day, $200/month, alert at 80%

If the concurrency limit is reached, new agents must wait until an active session completes.

---

## Configuration

The `config.json` file controls session behavior:

```json
{
  "version": "1.0.0",
  "sessionIdFormat": "{YYYYMMDD}-{HHMMSS}-{agentName}",
  "heartbeatIntervalMinutes": 30,
  "staleThresholdMinutes": 60,
  "retentionPolicy": {
    "completedSessionsMaxAge": "90d",
    "activeSessionStaleAction": "flag-for-review"
  },
  "requiredFields": [
    "sessionId", "agentId", "role", "objective",
    "beadsWorked", "filesModified", "decisionsMade", "handoffNotes"
  ],
  "metricsCollection": {
    "trackTokenUsage": true,
    "trackCost": true,
    "trackDuration": true,
    "trackIterations": true
  }
}
```

---

## Monitoring & Auditing

### Audit Trail

The `completed/` directory serves as a permanent audit log. To review agent activity:

```bash
# List all sessions by date
ls -la .agent-sessions/completed/

# Find all sessions that worked on a specific bead
grep -rl "ORCH-04" .agent-sessions/completed/

# Find all escalations
grep -rl "Severity.*High\|🔴" .agent-sessions/completed/

# Find all sessions by a specific agent role
grep -rl "Role.*feature" .agent-sessions/completed/
```

### Metrics Aggregation

After multiple sessions, aggregate metrics to understand cost and efficiency trends:

```bash
# Total tokens used across all completed sessions (grep for Metrics sections)
grep -A5 "## Metrics" .agent-sessions/completed/*.md
```

### Health Indicators

| Indicator | Healthy | Warning |
|-----------|---------|---------|
| Beads completed per session | ≥ 1 | 0 (blocked or scope too large) |
| Session duration | 30–120 min | > 180 min (fatigue / scope creep) |
| Escalations per session | 0 | ≥ 2 (systemic issue) |
| Handoff clarity | Next agent can start within 5 min | Next agent needs to re-explore |

---

## Quick Reference

```bash
# Start a new session
cp .agent-sessions/templates/session-log.md \
   .agent-sessions/active/$(date +%Y%m%d-%H%M%S)-my-agent.md

# Complete a session
mv .agent-sessions/active/20250115-103000-my-agent.md \
   .agent-sessions/completed/

# Create a handoff report
cp .agent-sessions/templates/handoff-report.md \
   .agent-sessions/active/$(date +%Y%m%d-%H%M%S)-handoff-my-agent.md

# File an escalation
cp .agent-sessions/templates/escalation-report.md \
   .agent-sessions/active/$(date +%Y%m%d-%H%M%S)-escalation.md

# Check for stale sessions
find .agent-sessions/active/ -name "*.md" -mmin +60 -exec echo "STALE: {}" \;
```

---

> **See also:** [Beads README](../.beads/README.md) · [AGENTS.md](../AGENTS.md) · [ARCHITECTURE.md — Beads Task Coordination](../ARCHITECTURE.md#beads-task-coordination) · [AI_ML.md — Beads Integration](../AI_ML.md#beads-integration)
