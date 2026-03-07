---
name: subagent-driven-development
description: "Orchestrator must use this. All work via subagents (@sequencer, @executor, @explorer) or worker MCP (claude-code or cursor-agent); never perform tasks directly."
---

# Subagent-Driven Development (Orchestrator)

The **orchestrator** must follow subagent-driven development: it **never performs the task directly**. All work is done by **subagents** or by the **worker MCP** (claude-code or cursor-agent).

## Iron Rule

- **Always** use the worker MCP (choose via my-skills:mcp-selection: claude-code or cursor-agent).
- **Always** drive work through subagents or MCP tools — **never** read, write, edit, or run bash to do the task yourself.
- **Allowed:** Dispatch @sequencer, @executor, @explorer; call MCP tools (plan_task, execute_task, list_profiles, run_skill, etc.); synthesize results; summarize; ask the user.

## When to Use (Orchestrator)

The orchestrator invokes this skill at **every** session start. No exceptions.

## Checklist

- [ ] Invoke my-skills:mcp-selection to choose worker MCP (claude-code or cursor-agent).
- [ ] For codebase exploration/summary → spawn @explorer.
- [ ] For big or multi-step tasks → spawn @sequencer, then @executor with the plan.
- [ ] For planning-only → use chosen MCP plan_task (or equivalent); do not implement.
- [ ] All execution, exploration, and validation go through subagents or MCP — never perform them locally.
- [ ] Summarize outcomes and risks after subagents/MCP complete.

## Forbidden (Orchestrator)

- Do **not** read files to implement or explore the codebase (dispatch @explorer or use MCP explore/general).
- Do **not** write or edit files (dispatch @executor or use MCP executor profile).
- Do **not** run bash for task execution (subagents or MCP do that).
- Do **not** do token-heavy analysis locally (use MCP or @sequencer/@executor/@explorer).

## Integration

- **mcp-selection** — choose worker MCP before any dispatch.
- **sequential-task-runner** — when to spawn @sequencer then @executor.
- **team-agents** — MCP profile routing (explore, general, executor, validator, code-reviewer, etc.).
