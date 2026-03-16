---
name: subagent-driven-development
description: "Orchestrator must use this. All work via subagents (@sequencer, @executor, @explore); never perform tasks directly."
---

# Subagent-Driven Development (Orchestrator)

The **orchestrator** must follow subagent-driven development: it **never performs the task directly**. All work is done by **subagents** using opencode tools (Read, Write, Edit, Bash).

## Iron Rule

- **Always** drive work through subagents — **never** read, write, edit, or run bash to do the task yourself.
- **Allowed:** Dispatch subagents; synthesize results; summarize; ask the user.

## When to Use (Orchestrator)

The orchestrator invokes this skill at **every** session start. No exceptions.

## Subagent Routing Table

| Task | Preferred |
|------|-----------|
| Codebase exploration / summary | @explore |
| Big / multi-step execution | @sequencer → @executor |
| Small / single-step coding | direct tools or @executor |
| Planning-only | @ultron |
| Code review | @code-reviewer |

## Checklist

- [ ] For codebase exploration/summary → spawn @explore.
- [ ] For big or multi-step tasks → spawn @sequencer, then @executor with the plan.
- [ ] For planning-only → spawn @ultron.
- [ ] For code review → spawn @code-reviewer.
- [ ] All execution, exploration, and validation go through subagents — never perform them locally.
- [ ] Summarize outcomes and risks after subagents complete.

## Forbidden (Orchestrator)

- Do **not** read files to implement or explore the codebase (dispatch @explore).
- Do **not** write or edit files (dispatch @executor).
- Do **not** run bash for task execution (subagents do that).
- Do **not** do token-heavy analysis locally (use subagents).

## Integration

- **sequential-task-runner** — when to spawn @sequencer then @executor.
