# Agent System — Deep Dive

**Last Updated:** 2026-03-16  
**Scope:** The 9 agents defined in opencode.json.

For coding standards, skills table, slash commands, and anti-patterns, see root **[AGENTS.md](../AGENTS.md)**.

---

## Agent Hierarchy (9 agents)

| Agent | Model | Mode | Role |
|-------|--------|------|------|
| **build** | user-selected | primary | Default agent. For codebase exploration spawn @explore; for big/multi-step spawn @sequencer then @executor; for small/single-step does work directly using tools. |
| **plan** | user-selected | primary | Planning only. **Must** spawn @ultron for planning (per-step skills); then optional validation/review via executor or directly. Does not implement. |
| **orchestrator** | user-selected | primary | **PURE dispatcher:** never performs tasks directly. Routes by task type: explore → @explore; big/multi-step → @sequencer then @executor; small → direct tools or @executor. |
| **sequencer** | Claude Sonnet | subagent | Takes big task and produces ordered plan using tools; outputs ordered steps. Spawn first for multi-step work. |
| **executor** | Claude Haiku | subagent | Takes plan and executes steps sequentially using tools (validate + review per step). Spawn after sequencer. |
| **explore** | Claude Haiku | subagent | Explores codebase using tools; outputs structured summary. Read-only. Use @explore for mapping or onboarding. |
| **ultron** | Claude Sonnet | subagent | Planning sub-agent (planner merged): requirements, architecture review, phases, skill selection per step. Outputs structured plan only; does not execute. |
| **architect** | Claude Sonnet | subagent | Software architecture specialist: system design, scalability, trade-offs, ADRs. Use when planning features or refactoring large systems. |
| **code-reviewer** | Claude Sonnet | subagent | Code review specialist: quality, security, maintainability. Use after code changes; required before claiming work done. |

---

## Orchestrator Rules

- **PURE dispatcher:** Orchestrator never uses Read, Write, Edit, or Bash for task work. It only routes and summarizes.
- **When a plan is provided:** Follow the plan; do not load skills without reading the plan first; load skills only when the plan or current step requires them.
- **Session start (no plan):** Invoke my-skills:subagent-driven-development.
- **Before completion:** Validator and @code-reviewer must run (via executor or directly).

---

## Related Docs

- [ultron-design.md](ultron-design.md) — Ultron planning sub-agent: output format, when to spawn.
- [config-change-checklist.md](config-change-checklist.md) — Files to update when changing agents/commands/MCPs.
