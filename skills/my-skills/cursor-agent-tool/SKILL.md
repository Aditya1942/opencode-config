---
name: cursor-agent-tool
description: "Quick reference for the cursor_agent tool: run a coding task via Cursor's CLI agent from opencode and get only the success result (and optionally thinking)."
---

# Cursor Agent Tool — Quick Reference

Run the **Cursor CLI agent** with a single prompt and get only the assistant's **success result**. Use from opencode agents and subagents when you want to delegate a coding task (edits, commands, exploration) to Cursor's agent and receive a single, deterministic response.

> For the full usage guide including examples, integration patterns, and anti-patterns, see `my-skills:cursor-agent`.

---

## When to Use

- Delegating a **coding task** (file edits, shell commands, codebase exploration) to Cursor's agent from an opencode agent or subagent.
- When you need a **single "result only"** response (no progress or tool-call noise).
- When the task should run in a specific **working directory**, **mode**, or with a specific **model**.

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|:--------:|---------|-------------|
| `prompt` | string | **Yes** | — | The exact prompt to send to the Cursor agent. |
| `cwd` | string | No | opencode config dir | Working directory. **Always set for project tasks.** |
| `mode` | string | No | `"agent"` | `"agent"` (edits+commands), `"plan"` (read-only planning), `"ask"` (Q&A). |
| `model` | string | No | Cursor account default | Model slug. Use `"auto"` or `"composer-1.5"`. ⚠️ Ignored when `include_thinking: true`. |
| `workspace` | string | No | same as `cwd` | Workspace root override (passed as `--workspace`). Must be absolute path. ⚠️ Ignored when `include_thinking: true`. |
| `include_thinking` | boolean | No | `false` | If `true`, uses ACP mode and returns thinking alongside result. Cannot combine with `model` or `workspace`. |

---

## Via OpenCode Tool

```js
// Default (agent mode, full edits+commands)
cursor_agent({ prompt: "Add a unit test for parseConfig in src/config.js", cwd: "/my/project" })

// Plan only — no file mutations
cursor_agent({ prompt: "Outline steps to refactor the auth module", mode: "plan", cwd: "/my/project" })

// With a specific model
cursor_agent({ prompt: "Review SQL queries in src/db/queries.ts for N+1 problems", model: "composer-1.5", cwd: "/my/project" })

// With thinking visible
cursor_agent({ prompt: "Explain how this function works", include_thinking: true, cwd: "/my/project" })

// Workspace override
cursor_agent({ prompt: "Add types to all public functions", cwd: "/my/project/src", workspace: "/my/project" })
```

---

## Via Shell

From the config root (`~/.config/opencode`):

```bash
# Basic (print mode)
node scripts/run-cursor-agent.js -- "your prompt here"

# With cwd and mode
node scripts/run-cursor-agent.js --cwd /path/to/project --mode ask -- "Explain the main entry point"

# With specific model
node scripts/run-cursor-agent.js --cwd /path/to/project --model composer-1.5 -- "Refactor auth module"

# With workspace override
node scripts/run-cursor-agent.js --cwd /path/src --workspace /path -- "Add JSDoc to all exports"

# With thinking (ACP mode)
node scripts/run-cursor-agent.js --cwd /path/to/project --thinking -- "Refactor this function"
```

---

## Output Behavior

**Success (print mode):**
```
<assistant's full response text>
```
The tool returns the raw result string. Only the final success result is returned — no progress lines, tool-call summaries, or intermediate output.

**Success with thinking (ACP mode):**
```
Result:
<assistant's response>

Thinking:
<thinking chunk 1>
...
```

**Failure:**
```json
{ "success": false, "error": "<actionable error message>" }
```
Failures are **always explicit** — no silent failure. The message always includes the root cause.

---

## Shell Output Envelope

The script (`run-cursor-agent.js`) always writes a single JSON line to stdout:

- Success: `{ "success": true, "result": "<full assistant text>", "thinking"?: [...] }`
- Failure: `{ "success": false, "error": "<message>" }` — exit code 1

---

## Thinking (ACP Mode)

Setting `include_thinking: true` runs in **ACP (Agent Client Protocol)** mode via JSON-RPC over stdio:
- Each ACP request has a **20-second timeout** (hangs are impossible).
- `stderr` is captured and filtered — benign debug lines are suppressed; real errors are surfaced.
- Process exit events are handled — no hung promises on agent crash.
- Captures `agent_message_chunk` events (result text) and `agent_thinking` events (reasoning).
- Each ACP request has a **20-second timeout** per step (4 steps total → up to ~80s max), preventing indefinite hangs. An outer 120s plugin timeout is also active.
- `model` and `workspace` are **not forwarded** in ACP mode.
- Use for debugging complex tasks; otherwise default print-mode JSON is faster and simpler.

---

## Prerequisites

- **Cursor CLI** installed and on `PATH`: `agent --version`
- **Authenticated**: `agent login` in terminal, or set `CURSOR_API_KEY` / `CURSOR_AUTH_TOKEN`
- **Node.js** (for the script and plugin)

---

## See Also

- **`my-skills:cursor-agent`** — Full usage guide with examples, integration patterns, anti-patterns, failure recovery
- [Cursor CLI: Using Agent](https://cursor.com/docs/cli/using) — Modes, prompting, non-interactive use
- [Cursor CLI: Output format](https://cursor.com/docs/cli/reference/output-format) — JSON and stream-json success/failure shape
- [Cursor CLI: ACP](https://cursor.com/docs/cli/acp) — JSON-RPC over stdio for custom clients
