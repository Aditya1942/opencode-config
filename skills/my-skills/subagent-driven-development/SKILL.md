---
name: subagent-driven-development
description: "Orchestrator must use this. All work via subagents (@sequencer, @executor, @explorer) or worker CLI (claude or agent) via shell; never perform tasks directly."
---

# Subagent-Driven Development (Orchestrator)

The **orchestrator** must follow subagent-driven development: it **never performs the task directly**. All work is done by **subagents** or by running the **worker CLI** (claude or agent) **via shell** per docs/cli-claude-code.md and docs/cli-cursor-agent.md.

## Iron Rule

- **Always** choose the worker CLI via my-skills:worker-selection (claude or agent).
- **Always** drive work through subagents or by **running the chosen CLI via shell** — **never** read, write, edit, or run bash to do the task yourself.
- **Allowed:** Dispatch @sequencer, @executor, @explorer; run `claude` or `agent` via shell with the right prompt and flags (see docs); synthesize results; summarize; ask the user.

## When to Use (Orchestrator)

The orchestrator invokes this skill at **every** session start. No exceptions.

## Checklist

- [ ] Invoke my-skills:worker-selection to choose worker CLI (claude or agent).
- [ ] For codebase exploration/summary → spawn @explorer.
- [ ] For big or multi-step tasks → spawn @sequencer, then @executor with the plan.
- [ ] For planning-only → run chosen CLI in plan mode via shell (docs); do not implement.
- [ ] All execution, exploration, and validation go through subagents or CLI via shell — never perform them locally.
- [ ] Summarize outcomes and risks after subagents/CLI complete.

## Forbidden (Orchestrator)

- Do **not** read files to implement or explore the codebase (dispatch @explorer or run CLI in explore/ask mode).
- Do **not** write or edit files (dispatch @executor or run CLI in execute mode).
- Do **not** run bash for task execution (subagents or CLI do that).
- Do **not** do token-heavy analysis locally (use CLI via shell or @sequencer/@executor/@explorer).

## Integration

- **worker-selection** — choose worker CLI before any dispatch.
- **sequential-task-runner** — when to spawn @sequencer then @executor.
- **docs** — CLI routing (explore, general, executor, validator, code-reviewer, etc.): docs/cli-claude-code.md, docs/cli-cursor-agent.md, docs/worker-selection-guide.md.
