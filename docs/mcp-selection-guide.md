# MCP Selection Guide: claude-code vs cursor-agent

Both **claude-code** and **cursor-agent** MCPs provide a similar worker layer (planning, exploration, implementation, verification, review). This guide decides which to use for the current task.

## Decision Rules

| Condition | Use |
|-----------|-----|
| **Claude Code quota is full or exhausted** | **cursor-agent** for all tasks |
| **Task is complex** (see below) | **claude-code** — prefer Opus or Sonnet when available |
| **All other tasks** | **cursor-agent** |

## What Counts as "Complex"

Use **claude-code** (Opus/Sonnet) when the task has **any** of:

- **Token-heavy work**: Broad codebase exploration, multi-file comprehension, large-context research
- **Planning / decomposition**: Multi-step plans, risk analysis, sequencing
- **Architecture**: System design, ADRs, scalability decisions
- **Deep implementation**: Non-trivial features, refactors, cross-module changes
- **Mandatory verification**: Code review, validation, or security-sensitive changes
- **Specialist profiles needed**: planner, architect, code-reviewer, validator, tdd-guide, build-error-resolver, refactor-cleaner, doc-updater, skill-chooser

Use **cursor-agent** when the task is:

- Simple edits, single-file changes, typos, config tweaks
- Quick lookups, small refactors, dependency updates
- Tasks that do not need Claude-backed validation or review

## Quota Check

- **Before routing**: If you have reason to believe Claude Code quota is full (e.g. `/claude-code-usage` or plugin signals), use **cursor-agent** for everything until quota resets or user confirms otherwise.
- **After a failure**: If a claude-code MCP call fails with a quota/rate-limit error, fall back to **cursor-agent** for the remainder of the session or until quota is restored.

## Summary

1. **Quota full** → cursor-agent for all.
2. **Complex task** → claude-code (Opus/Sonnet).
3. **Otherwise** → cursor-agent.

Use the **mcp-selection** skill at task start to decide which MCP to use for the current task.
