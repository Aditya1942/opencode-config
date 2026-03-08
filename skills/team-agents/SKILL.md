---
name: team-agents
description: "Use when routing work through the claude or agent CLI (via shell) instead of OpenCode subagents"
---

# Worker CLI Routing

## Overview

This repo routes specialized work through the **claude** or **agent** CLI, invoked **via shell**. There is no MCP for planning/execution. Use docs/cli-claude-code.md and docs/cli-cursor-agent.md for exact syntax.

When a task needs a specialized role, run the chosen CLI via shell with the appropriate prompt and mode/profile equivalent.

## When to Use

Use this skill when:
- the task would previously have gone to an OpenCode subagent
- you need to choose the right profile or mode for planning, exploration, research, implementation, or review
- you are invoking the worker CLI via shell and need the routing table

## Checklist

- Use my-skills:worker-selection to choose worker CLI (claude or agent).
- Use docs/cli-claude-code.md or docs/cli-cursor-agent.md for invocation syntax.
- For **claude**: plan = `claude -p "..." --output-format json --permission-mode plan`; execute = `--permission-mode acceptEdits`; profile = `--append-system-prompt` with profile text (see docs/cli-claude-code.md for profile names and roles).
- For **agent**: plan = `agent -p "..." --trust --approve-mcps --mode plan`; execute = `--mode agent --force`.
- Route token-heavy work through the chosen CLI, especially exploration, broad search, multi-file comprehension, and large-context research.
- For any change-producing task, require validation and code review (via CLI or executor) before completion.
- Do not dispatch OpenCode subagents for tasks now covered by CLI profiles/modes.

## Entry Agents

| Agent | Expected Worker CLI Usage |
|-------|-----------------------------|
| `build` | Use chosen CLI via shell as the default worker layer for planning, implementation, validation, and review |
| `plan` | **Must** spawn @ultron for plan creation (skill-chooser + worker-selection per step); then optional plan validation/review via chosen CLI before returning |
| `orchestrator` | Use chosen CLI via shell end-to-end across planning, context gathering, implementation, validation, and review |

## Planning Sub-Agent (Ultron)

| Agent | Role | When to spawn |
|-------|------|----------------|
| `ultron` | Planning sub-agent: reads task; uses **agent** CLI for exploration, summarizing, and small tasks; skill-chooser + worker-selection per step. Outputs structured plan only; does not execute plan steps. | When you need a plan with **per-step skill recommendations** and **per-step worker CLI assignment**; then hand plan to sequencer/executor or run CLI per step yourself. |

## Routing (CLI invocation)

| Task Type | claude (CLI) | agent (CLI) | Profile / mode |
|-----------|--------------|-------------|-----------------|
| Planning only | `claude -p "..." --permission-mode plan` | `agent -p "..." --mode plan` | planner / plan |
| Codebase search / mapping | `claude -p "..." --permission-mode plan` + explore profile | `agent -p "..." --mode ask` | explore / ask |
| Code comprehension | execute_task equiv + general profile | run_prompt + ask | general / ask |
| Docs / external research | execute_task equiv + librarian profile | run_prompt | librarian |
| Mechanical transforms | execute_task equiv + transform profile | run_prompt + agent | transform / agent |
| Validation | execute_task equiv + validator profile | run_prompt | validator |
| Implementation | execute_task equiv + executor profile | execute_task equiv (agent --force) | executor / agent |
| Code review | execute_task equiv + code-reviewer profile | run_prompt | code-reviewer |
| Architecture | execute_task equiv + architect profile | run_prompt | architect |
| Build / type fixes | execute_task equiv + build-error-resolver | run_prompt + agent | build-error-resolver / agent |
| Cleanup / dedupe | execute_task equiv + refactor-cleaner | run_prompt + agent | refactor-cleaner / agent |
| Documentation updates | execute_task equiv + doc-updater | run_prompt + agent | doc-updater / agent |
| TDD-first execution | execute_task equiv + tdd-guide | run_prompt + agent | tdd-guide / agent |
| Skill selection | execute_task equiv + skill-chooser | run_prompt | skill-chooser |

## Details

### Profile (claude) / Mode (agent)

- **claude**: Use `--append-system-prompt` with profile text (see docs/cli-claude-code.md for profile names and roles) or `--system-prompt` to replace. Prefer the narrowest profile that matches the task.
- **agent**: Use `--mode plan` (planning), `--mode ask` (read-only), `--mode agent` (full execution with `--force` for execute_task).
- If a task spans multiple concerns, split into multiple CLI runs instead of overloading one profile/mode.

### Complex Tasks

For larger tasks:
1. Run CLI in plan mode (claude `--permission-mode plan` or agent `--mode plan`).
2. Run CLI for context gathering (explore/general profile or ask mode).
3. Run CLI for implementation (executor profile or agent mode with --force).
4. Run CLI for validation (validator profile).
5. Run CLI for review (code-reviewer profile).

## Anti-Patterns

- Do not rely on MCP tools (plan_task, execute_task); use shell and the docs.
- Do not do token-heavy exploration or implementation locally when the CLI has a matching profile/mode.
- Do not skip validation after the CLI performs edits.
- Do not skip code review after the CLI performs edits.
