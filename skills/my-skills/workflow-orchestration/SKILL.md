---
name: workflow-orchestration
description: "Orchestrator's end-to-end workflow: plan (@ultron) → sequence (@sequencer + sequential-thinking) → execute (@executor) → review (@code-reviewer). Pure dispatch — no direct work."
---

# Workflow Orchestration

The orchestrator is a **pure dispatcher**. It never reads, writes, edits, or runs bash for task work. All work flows through subagents in strict phases.

## Phases

### Phase 1 — Plan (via @ultron)

Spawn **@ultron** with the user's task. Ultron:
- Understands requirements, reviews architecture, assigns skills per step
- Outputs a structured plan (steps, skills per step, risks, verification)

> Skip this phase only for trivial / single-step tasks.

### Phase 2 — Sequence (via @sequencer + sequential-thinking)

Spawn **@sequencer** with Ultron's plan (or the user's task if Phase 1 was skipped).
- Sequencer uses `sequential-thinking` MCP to reason through ordering and dependencies
- Outputs an ordered, executable step list with assumptions, risks, and verification points

> For single-step tasks, skip directly to Phase 3.

### Phase 3 — Execute (via @executor)

Spawn **@executor** with the sequencer's ordered plan. The executor works step-by-step using opencode tools (Read, Write, Edit, Bash) with validation after each step.

### Phase 4 — Code Review (mandatory gate)

Spawn **@code-reviewer** before marking work done.

Review checks: Security (CRITICAL) → Code quality (HIGH) → Patterns (HIGH) → Performance (MEDIUM).

Verdict: **Approve** (no CRITICAL/HIGH) · **Block** (any CRITICAL) · **Warning** (MEDIUM/LOW only).

> Do NOT skip this phase. Code review is a hard gate.

### Phase 5 — Close

- Summarize outcomes and risks (2–4 lines)
- Do not repeat full subagent output
- Report review verdict

## Routing Quick Reference

| Task type | Phase flow |
|-----------|------------|
| Big / multi-step | Plan → Sequence → Execute → Review → Close |
| Medium / clear scope | Sequence → Execute → Review → Close |
| Small / single-step | Execute → Review → Close |
| Exploration / summary | @explore (read-only) |
| Planning-only | @ultron only; present plan, do not execute |

## Iron Rules

1. **Never** do task work directly — orchestrator dispatches only
2. **Always** run code review before marking done
3. **Pass context forward** — each phase feeds the next
4. **Use sequential-thinking** in sequencer for dependency reasoning
5. **Skill loading** — load skills only when a plan step requires them

## Related Skills

- `subagent-driven-development` — dispatch discipline
- `sequential-task-runner` — sequencer → executor flow
- `code-review-excellence` — review standards
