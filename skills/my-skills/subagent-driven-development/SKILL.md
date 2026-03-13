---
name: subagent-driven-development
description: "Orchestrator must use this. All work via subagents (@sequencer, @executor, @explore, @cursor-explorer, @cursor-general, @cursor-reviewer); never perform tasks directly."
---

# Subagent-Driven Development (Orchestrator)

The **orchestrator** must follow subagent-driven development: it **never performs the task directly**. All work is done by **subagents** using tools (Read, Write, Edit, Bash) or the cursor_agent tool.

## Iron Rule

- **Always** drive work through subagents — **never** read, write, edit, or run bash to do the task yourself.
- **Allowed:** Dispatch subagents; synthesize results; summarize; ask the user.

## When to Use (Orchestrator)

The orchestrator invokes this skill at **every** session start. No exceptions.

## Subagent Routing Table

| Task | Preferred | Alternative |
|------|-----------|-------------|
| Codebase exploration / summary | @cursor-explorer (Cursor-native) | @explore (opencode tools, Haiku) |
| Big / multi-step execution | @sequencer → @cursor-general (Cursor-native) | @sequencer → @executor (opencode tools, Haiku) |
| Small / single-step coding | @cursor-general | direct tools |
| Planning-only | @ultron or @cursor-explorer (mode=plan) | @sequencer |
| Code review | @cursor-reviewer (Cursor-native) | @code-reviewer |

## Checklist

- [ ] For codebase exploration/summary → spawn @cursor-explorer (or @explore for lightweight).
- [ ] For big or multi-step tasks → spawn @sequencer, then @cursor-general (or @executor) with the plan.
- [ ] For planning-only → spawn @ultron; optionally @cursor-explorer for architecture context.
- [ ] For code review → spawn @cursor-reviewer (or @code-reviewer).
- [ ] All execution, exploration, and validation go through subagents — never perform them locally.
- [ ] Summarize outcomes and risks after subagents complete.

## Forbidden (Orchestrator)

- Do **not** read files to implement or explore the codebase (dispatch @cursor-explorer or @explore).
- Do **not** write or edit files (dispatch @cursor-general or @executor).
- Do **not** run bash for task execution (subagents do that).
- Do **not** do token-heavy analysis locally (use subagents).

## Integration

- **sequential-task-runner** — when to spawn @sequencer then @cursor-general / @executor.
- **cursor-agent** skill — how to use the cursor_agent tool (used by cursor-explorer, cursor-general, cursor-reviewer).
