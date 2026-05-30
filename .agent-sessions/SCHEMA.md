# Agent Session Schema

This document defines the formal data structure for agent session logs. All session files (in `active/` and `completed/`) must conform to this schema.

---

## File Naming Convention

```
{YYYYMMDD}-{HHMMSS}-{agent-name}.md
```

**Examples:**
- `20250115-103000-claude-feature.md`
- `20250115-140000-claude-lead.md`
- `20250116-090000-claude-test.md`

The timestamp is set at session **start** and never changes, even after the session moves to `completed/`.

---

## Session Log Structure

### Required Sections

Every session log **must** include all of the following sections:

```markdown
# Session: {sessionId}

## Meta
- **Agent ID**: {unique agent identifier}
- **Role**: {lead | feature | test}
- **Started**: {ISO 8601 timestamp}
- **Completed**: {ISO 8601 timestamp or "in-progress"}
- **Status**: {active | completed | paused | abandoned}

## Objective
{1–2 sentence description of what this session aims to accomplish}

## Beads Worked
| Bead ID | Title | Status | Notes |
|---------|-------|--------|-------|
| ORCH-04 | Add retry backoff | done | Implemented exponential backoff |
| ORCH-05 | Add jitter | blocked | Depends on ORCH-04 merge |

## Files Modified
| File | Change Description |
|------|-------------------|
| `orchestrator/core/python-bridge.js` | Added exponential backoff to retry logic |
| `orchestrator/__tests__/python-bridge.test.js` | Added 3 new retry tests |

## Decisions Made
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Used exponential backoff (base 2) | Industry standard; prevents thundering herd | Linear backoff, fixed delay |
| Capped retries at 5 | Balances reliability vs. latency | 3 (too few), 10 (too slow) |

## Blockers
| Blocker | Severity | Resolution |
|---------|----------|------------|
| ORCH-05 depends on ORCH-04 merge | 🟡 Medium | Picked ORCH-06 instead |

## Handoff Notes
{Specific, actionable recommendations for the next agent/session}

- ORCH-04 is ready for review on branch `agent/claude-feature/ORCH-04`
- ORCH-05 can be started once ORCH-04 is merged
- The retry tests use mock timers — see `jest.useFakeTimers()` pattern
```

### Optional Sections

These sections add value but are not strictly required:

```markdown
## Metrics
| Metric | Value |
|--------|-------|
| Duration | 47 min |
| Tokens (input) | 12,400 |
| Tokens (output) | 3,200 |
| Estimated cost | $0.08 |
| Agent loop iterations | 6 |
| Tests run | 14 |
| Tests passed | 14 |

## Trace IDs
| Trace ID | Description |
|----------|-------------|
| `dt-1705312200000-0.4521` | Upload + summarize test run |
| `dt-1705312500000-0.7834` | Chat with retry failure simulation |

## Environment Notes
- Node.js 18.19.0
- Orchestrator running on port 4000
- AI/ML service mocked (not running)
- Redis running locally on 6379

## References
- PR: #142
- Bead: .beads/active/ORCH-04-retry-backoff.md
- Related session: .agent-sessions/completed/20250114-160000-claude-lead.md
```

---

## Field Definitions

### Meta Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Agent ID` | `string` | ✅ | Unique identifier matching `.beads/.status.json` agent entries |
| `Role` | `enum` | ✅ | One of: `lead`, `feature`, `test` (per `.claude/team-config.json`) |
| `Started` | `ISO 8601` | ✅ | Timestamp when the session began |
| `Completed` | `ISO 8601 \| "in-progress"` | ✅ | Timestamp when completed, or `"in-progress"` if still active |
| `Status` | `enum` | ✅ | One of: `active`, `completed`, `paused`, `abandoned` |

### Bead Status Values

| Status | Meaning |
|--------|---------|
| `claimed` | Reserved in `.beads/.status.json` but not yet started |
| `in-progress` | Actively being worked on |
| `done` | All acceptance criteria pass |
| `blocked` | Cannot proceed due to dependency or conflict |
| `skipped` | Intentionally not worked on this session (document why) |

### Blocker Severity

| Level | Icon | Meaning |
|-------|------|---------|
| Low | 🟢 | Informational — next agent should know |
| Medium | 🟡 | Blocks current bead, but agent can switch to another |
| High | 🔴 | Blocks all progress — requires escalation |

### Decision Quality Checklist

A well-documented decision includes:
- ✅ What was decided
- ✅ Why (rationale tied to project goals or constraints)
- ✅ What alternatives were considered and rejected
- ✅ Any trade-offs or risks accepted

---

## Validation

Before moving a session from `active/` to `completed/`, verify:

1. ☐ All required sections are present and non-empty
2. ☐ Every bead listed has a final status (`done`, `blocked`, or `skipped`)
3. ☐ Files Modified lists every file you touched
4. ☐ Handoff Notes are specific enough for a new agent to continue without re-exploration
5. ☐ All bead reservations in `.beads/.status.json` are released
6. ☐ Branch is pushed with commits referencing the session and bead IDs

---

> **See also:** [Session templates](templates/) · [Agent Sessions README](README.md) · [Beads README](../.beads/README.md)
