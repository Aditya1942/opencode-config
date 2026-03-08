# Cursor Agent CLI — Shell reference for subagents

This doc describes how to invoke the **Cursor Agent CLI** (`agent`) from the shell so that subagents can perform the same planning and execution work that the former cursor-agent MCP provided. Use it when you have shell access and no MCP.

## Prerequisites

- **Binary:** `agent` on PATH, or set `CURSOR_AGENT_BIN` to the full path.
- **Install:** Cursor CLI (e.g. `curl https://cursor.com/install -fsS | bash` or per Cursor docs).

Verify:

```bash
agent --version
# or
$CURSOR_AGENT_BIN --version
```

## Working directory

Pass the workspace path with `--workspace`:

```bash
agent -p "PROMPT" --trust --approve-mcps --workspace /path/to/project [--mode MODE] ...
```

## Modes (list_modes equivalent)

There is no CLI subcommand to list modes. Use these three modes:

| Mode | Description |
|------|-------------|
| `agent` | Full access; execution with tool use. Use for execute_task. |
| `plan` | Planning only; read-only, design approach. Use for plan_task. |
| `ask` | Read-only exploration; no changes. Use for exploration/summary. |

## MCP-equivalent operations

### plan_task

Build a prompt (task + optional context), then run in **plan** mode:

```bash
agent -p "Create a concrete implementation plan for the task below.
Return a concise numbered plan with assumptions, risks, and verification steps.

Task: YOUR_TASK
Context: OPTIONAL_CONTEXT" \
  --trust --approve-mcps --mode plan \
  [--model MODEL] [--workspace DIR] [--output-format stream-json] [--sandbox enabled|disabled]
```

### execute_task

Same prompt shape but use **agent** mode and add `--force` so the agent can apply changes:

```bash
agent -p "Execute the task below using Cursor Agent.
Prefer small, verifiable changes and summarize what you changed.

Task: YOUR_TASK
Plan: OPTIONAL_PLAN
Context: OPTIONAL_CONTEXT" \
  --trust --approve-mcps --mode agent --force \
  [--model MODEL] [--workspace DIR] [--output-format stream-json] [--sandbox enabled|disabled]
```

### run_prompt

Low-level: send an arbitrary prompt with optional mode and workspace:

```bash
agent -p "YOUR_PROMPT" --trust --approve-mcps \
  [--mode agent|plan|ask] [--model MODEL] [--workspace DIR] \
  [--output-format text|json|stream-json] [--sandbox enabled|disabled]
```

## Flag reference

| Flag | Description |
|------|-------------|
| `-p`, `--prompt` | Prompt text (required). |
| `--trust` | Trust execution (non-interactive). |
| `--approve-mcps` | Approve MCP tools (non-interactive). |
| `--force` | Allow applying changes; use for execute_task. |
| `--mode` | `agent` (full), `plan` (planning only), or `ask` (read-only). |
| `--model` | Model (e.g. `gpt-5.2`, `claude-sonnet-4`). |
| `--workspace` | Working directory (project path). |
| `--output-format` | `text`, `json`, or `stream-json`. |
| `--sandbox` | `enabled` or `disabled` for command execution. |

## Output

- With `--output-format json`, stdout is JSON; parse for `result`, `text`, or `output` for the primary response.
- With `--output-format stream-json`, stdout is streamed JSON events; same parsing for the final result.

## Timeout

The CLI has no timeout flag. Wrap in a shell timeout if needed (e.g. `timeout 600000 agent ...`). The former MCP used a 10-minute default (600000 ms).

## Example: plan then execute

```bash
# 1. Plan (read-only)
agent -p "Create a concrete implementation plan for: Add a new API endpoint for user preferences." \
  --trust --approve-mcps --mode plan --workspace /path/to/project

# 2. Execute (with optional plan in prompt)
agent -p "Execute the task below.
Task: Add a new API endpoint for user preferences.
Plan: 1. Add route. 2. Add handler. 3. Add tests." \
  --trust --approve-mcps --mode agent --force --workspace /path/to/project
```
