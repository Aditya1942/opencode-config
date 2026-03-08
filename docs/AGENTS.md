# Agent System — Deep Dive

**Last Updated:** 2026-03-08  
**Scope:** The 7 agents defined in opencode.json; worker CLI usage.

For coding standards, skills table, slash commands, and anti-patterns, see root **[AGENTS.md](../AGENTS.md)**.

---

## Agent Hierarchy (9 agents)

| Agent | Model | Mode | Role |
|-------|--------|------|------|
| **build** | user-selected | primary | Default agent. Invokes worker-selection; for big/multi-step tasks spawns @sequencer then @executor; otherwise does work via chosen worker CLI (shell). |
| **plan** | user-selected | primary | Planning only. **Must** spawn @ultron for planning (per-step skills + worker); then optional validation/review via CLI. Does not implement. |
| **orchestrator** | user-selected | primary | **PURE dispatcher:** never performs tasks directly. Routes by task type: explore → @explorer; big/multi-step → @sequencer then @executor; small → worker CLI via shell. |
| **sequencer** | Claude Sonnet | subagent | Takes big task → worker-selection → chosen CLI via shell to plan and output ordered steps. Spawn first for multi-step work. |
| **executor** | Claude Haiku | subagent | Takes plan → worker-selection → executes steps sequentially via chosen CLI via shell (validate + review per step). Spawn after sequencer. |
| **explorer** | Claude Haiku | subagent | Explores codebase via chosen CLI via shell (explore/ask mode); outputs structured summary. Read-only. Use @explorer for mapping or onboarding. |
| **ultron** | Claude Sonnet | subagent | Planning sub-agent (planner merged): requirements, architecture review, phases, skill-chooser + worker-selection per step. Outputs structured plan only; does not execute. |
| **architect** | Claude Sonnet | subagent | Software architecture specialist: system design, scalability, trade-offs, ADRs. Use when planning features or refactoring large systems. |
| **code-reviewer** | Claude Sonnet | subagent | Code review specialist: quality, security, maintainability. Use after code changes; required before claiming work done. |

---

## Worker CLI (claude vs agent)

All task work (planning, exploration, implementation, validation, review) is done via the **claude** or **agent** CLI invoked **via shell**, not via OpenCode subagents. Primary agents and subagents (sequencer, executor, explorer) call the chosen CLI per docs.

- **Default:** Use the **agent** CLI for all tasks when possible.
- **claude** (Opus/Sonnet): Only when the task is **very complex** and the **user has granted permission**.
- **Quota full:** Use **agent** for everything.

Invoke **worker-selection** at task start; then run the chosen CLI per [worker-selection-guide.md](worker-selection-guide.md), [cli-claude-code.md](cli-claude-code.md), [cli-cursor-agent.md](cli-cursor-agent.md).

---

## Orchestrator Rules

- **PURE dispatcher:** Orchestrator never uses Read, Write, Edit, or Bash for task work. It only routes and summarizes.
- **When a plan is provided:** Follow the plan; do not load skills without reading the plan first; load skills only when the plan or current step requires them.
- **Session start (no plan):** Invoke my-skills:subagent-driven-development and my-skills:worker-selection.
- **Before completion:** Validator and code-reviewer must run (via CLI or executor).

---

## Related Docs

- [ultron-design.md](ultron-design.md) — Ultron planning sub-agent: output format, when to spawn.
- [worker-selection-guide.md](worker-selection-guide.md) — When to use claude vs agent.
- [config-change-checklist.md](config-change-checklist.md) — Files to update when changing agents/commands/MCPs.
