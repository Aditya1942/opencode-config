---
name: team-agents
description: "Use when routing work through the claude-code MCP profiles instead of OpenCode subagents"
---

# Claude Code Routing

## Overview

This repo no longer uses OpenCode subagents for execution. The `claude-code` MCP is the specialization layer and should be the default worker path whenever a matching Claude profile exists, especially for token-heavy work.

When a task needs a specialized role, call the Claude MCP with a `profile` instead of dispatching an OpenCode agent.

## When to Use

Use this skill when:
- the task would previously have gone to an OpenCode subagent
- you need to choose the right Claude profile for planning, exploration, research, implementation, or review
- you want to invoke bridged OpenCode skills inside Claude Code

## Checklist

- Use `claude-code.list_profiles` to inspect available Claude profiles
- Use `claude-code.plan_task` for plan-first work
- Use `claude-code.execute_task` for analysis, implementation, verification, and review
- Pass `profile` to select the role Claude should emulate
- Use `claude-code.list_bridge_prompts` to inspect bridged skills and command aliases
- Use `claude-code.run_skill` to invoke a bridged skill or command workflow inside Claude Code
- Route token-heavy work through Claude Code, especially exploration, broad search, multi-file comprehension, and large-context research
- For any change-producing task, require Claude-backed validation and code review before completion
- Do not dispatch OpenCode subagents for tasks now covered by Claude profiles

## Entry Agents

| Agent | Expected Claude Code Usage |
|-------|-----------------------------|
| `build` | Use Claude Code as the default worker layer for planning, implementation, validation, and review |
| `plan` | Use Claude Code for plan creation plus plan validation/review before returning |
| `orchestrator` | Use Claude Code end-to-end across planning, context gathering, implementation, validation, and review |

## Routing

| Task Type | Claude MCP Tool | Profile |
|-----------|-----------------|---------|
| Planning only | `plan_task` | `planner` |
| Codebase search / mapping | `execute_task` | `explore` |
| Code comprehension | `execute_task` | `general` |
| Docs / external research | `execute_task` | `librarian` |
| Mechanical transforms | `execute_task` | `transform` |
| Validation | `execute_task` | `validator` |
| Implementation | `execute_task` | `executor` |
| Code review | `execute_task` | `code-reviewer` |
| Architecture | `execute_task` | `architect` |
| Build / type fixes | `execute_task` | `build-error-resolver` |
| Cleanup / dedupe | `execute_task` | `refactor-cleaner` |
| Documentation updates | `execute_task` | `doc-updater` |
| TDD-first execution | `execute_task` | `tdd-guide` |
| Skill selection | `execute_task` | `skill-chooser` |

## Details

### Profile Discipline

- `profile` sets Claude Code's system prompt for the run
- prefer the narrowest profile that matches the task
- token-heavy work should default to Claude Code even when local tools could technically do part of it
- if a task spans multiple concerns, split it into multiple Claude MCP calls instead of overloading one profile

### Skill Invocation

The MCP also bridges local OpenCode skills and command aliases into Claude Code.

- inspect them with `claude-code.list_bridge_prompts`
- invoke them with `claude-code.run_skill`
- examples: `brainstorm`, `write-plan`, `brainstorming`, `team-agents`

### Complex Tasks

For larger tasks:
1. `plan_task` with `profile='planner'`
2. `execute_task` with `profile='explore'` or `profile='general'` for context gathering
3. `execute_task` with `profile='executor'` for implementation
4. `execute_task` with `profile='validator'` for validation
5. `execute_task` with `profile='code-reviewer'` for review

## Anti-Patterns

- Do not rely on removed OpenCode subagents like `@explore` or `@executor`
- Do not keep routing through legacy orchestrator workflows
- Do not use a broad implementation profile when a narrower analysis or review profile fits
- Do not keep token-heavy exploration or research local when Claude Code has a matching profile
- Do not skip Claude-backed validation after Claude performs edits
- Do not skip Claude-backed code review after Claude performs edits
