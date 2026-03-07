---
name: mcp-selection
description: "Decide which worker MCP to use for the current task — claude-code (complex) or cursor-agent (default). Use at task start or when switching context."
---

# MCP Selection

Choose between **claude-code** and **cursor-agent** for the current task. Both provide planning, exploration, implementation, verification, and review; use this skill to pick one.

## When to Use This Skill

- At the **start of any substantive task**
- When the user does not specify which MCP to use
- After a claude-code quota/rate-limit failure (re-evaluate: switch to cursor-agent)
- When switching from a complex sub-task to a simple one (or vice versa)

## Checklist

1. **Quota gate**: If Claude Code quota is full or exhausted (check `/claude-code-usage` or plugin signals), **use cursor-agent for all tasks**. Stop here.
2. **Classify the task** using the criteria below.
3. **Output your decision** in this form:

   ```
   MCP: [claude-code | cursor-agent]
   Reason: [one line]
   (If claude-code: prefer Opus/Sonnet for complex work.)
   ```

## Task Classification

### Use **claude-code** (Opus/Sonnet for complex work) when **any** apply:

- Token-heavy: broad codebase exploration, multi-file comprehension, large-context research
- Planning: multi-step plans, decomposition, risk analysis, sequencing
- Architecture: system design, ADRs, scalability
- Deep implementation: non-trivial features, refactors, cross-module changes
- Verification required: code review, validation, or security-sensitive changes
- Specialist profile needed: planner, architect, code-reviewer, validator, tdd-guide, build-error-resolver, refactor-cleaner, doc-updater, skill-chooser

### Use **cursor-agent** when **all** apply:

- No quota issue
- Task is simple: single-file edits, typos, config tweaks, quick lookups, small refactors, dependency updates
- No mandatory Claude-backed validation or review

## After Deciding

- **claude-code**: Use `claude-code.list_profiles`, `claude-code.plan_task`, `claude-code.execute_task` with the right `profile`. See `team-agents` skill for routing.
- **cursor-agent**: Use cursor-agent tools for planning, execution, and review in the same way you would use claude-code profiles.

## Reference

Full rules: `docs/mcp-selection-guide.md`.
