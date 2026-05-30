# Escalation Report

> **Date**: {ISO 8601}
> **Agent ID**: {unique agent identifier}
> **Session**: `.agent-sessions/active/{session-file}.md`
> **Severity**: 🟢 Low / 🟡 Medium / 🔴 High

---

## Summary

{1–2 sentence description of the problem that requires escalation.}

---

## Escalation Type

> Check the applicable type:

- [ ] **Reservation Conflict** — Two agents need the same conflict-zone file
- [ ] **Dependency Deadlock** — Circular dependency between beads
- [ ] **Budget Exceeded** — Daily or monthly cost limit reached
- [ ] **Pre-existing Test Failure** — Tests failing before any changes were made
- [ ] **Architecture Decision** — Change requires cross-layer modification beyond agent's role
- [ ] **Security Concern** — Potential secret exposure, vulnerability, or policy violation
- [ ] **Scope Creep** — Bead requirements are unclear or expanding beyond original definition
- [ ] **Other** — {Describe}

---

## Detailed Description

### What Happened
{Chronological description of the events leading to this escalation.}

### What Was Attempted
{Steps the agent took to resolve the issue before escalating.}

### Why It Cannot Be Resolved at This Level
{Specific reason — e.g., "Requires write access to `orchestrator/index.js` which is reserved by agent-xyz" or "Architecture decision that affects both orchestrator and AI/ML layers."}

---

## Affected Resources

### Beads
| Bead ID | Impact |
|---------|--------|
| {AREA-NUM} | {Blocked / partially complete / cannot start} |

### Files
| File | Current Reservation | Conflict |
|------|-------------------|----------|
| `path/to/file` | {Agent ID or "none"} | {Description of the conflict} |

### Agents
| Agent ID | Role | Impact |
|----------|------|--------|
| {agent-id} | {role} | {How this agent is affected} |

---

## Proposed Resolution

> The escalating agent's recommendation. The resolver may choose a different approach.

| Option | Pros | Cons |
|--------|------|------|
| {Option A} | {Benefits} | {Drawbacks} |
| {Option B} | {Benefits} | {Drawbacks} |

**Recommended**: {Option letter} — {Brief justification}

---

## Resolution

> Filled in by the agent or human who resolves this escalation.

- **Resolved by**: {Agent ID or human name}
- **Date**: {ISO 8601}
- **Resolution**: {What was done}
- **Outcome**: {Result — e.g., "Reservation transferred", "Bead split into two", "Budget increased"}

---

## Impact Assessment

> Filled in after resolution.

| Dimension | Before | After |
|-----------|--------|-------|
| Blocked beads | {count} | {count} |
| Blocked agents | {count} | {count} |
| Schedule impact | {description} | {description} |

---

> **See also:** [Session Schema](../SCHEMA.md) · [Agent Sessions README](../README.md) · [AGENTS.md](../../AGENTS.md)
