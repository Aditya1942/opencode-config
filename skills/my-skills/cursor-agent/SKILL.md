---
name: cursor-agent
description: "Comprehensive usage guide for the cursor_agent tool — delegate coding tasks to Cursor's CLI agent from opencode agents and subagents. Covers all parameters, modes, thinking capture, failure recovery, and integration patterns."
risk: medium
source: my-skills
date_added: "2026-03-12"
---

# Cursor Agent Tool — Usage Guide

Delegate a coding task to the **Cursor CLI `agent`** and receive only the final success result. The tool runs `agent` as a subprocess, parses its output, and returns either a clean result string or an explicit, actionable error — never silent failure.

> **Risk: medium** — In `agent` mode (default), Cursor can edit files and run shell commands in the target directory. Always set `cwd` precisely. Use `mode: "plan"` or `mode: "ask"` for read-only operations.

---

## When to Use

✅ **Use `cursor_agent` when:**
- You need Cursor's native file-editing tools (multi-file edits, refactors, code generation).
- A task requires shell command execution in a specific project context.
- You want to delegate a well-scoped coding step to Cursor as a subagent.
- You need planning/analysis in a project directory without switching context.
- You want to see the agent's *reasoning* for a complex decision (`include_thinking: true`).

❌ **Do NOT use `cursor_agent` when:**
- You can read/write files directly with opencode's built-in tools (Read, Write, Edit) — direct tools are faster and cheaper.
- The task is a single file read or a simple search (use Grep, Read, Glob instead).
- The prompt is ambiguous or extremely long without a clear cwd — Cursor needs context to be effective.
- You are in a tight token budget and the task can be done inline.

---

## Mode Guide

| Mode | Effect | File Edits? | Shell? | Best For |
|------|--------|:-----------:|:------:|----------|
| `agent` *(default)* | Full autonomous agent | ✅ Yes | ✅ Yes | Implementation, refactors, code generation |
| `plan` | Read-only analysis; no mutations | ❌ No | ❌ No | Planning, architecture review, feasibility checks |
| `ask` | Q&A/explanation; read-only | ❌ No | ❌ No | Understanding code, explaining patterns, answering questions |

> **Caution:** `plan` mode prevents file edits but the agent may still read any file in `cwd`. If you only want Q&A without codebase access, use `ask`.

---

## Parameter Reference

| Parameter | Type | Required | Default | Description |
|-----------|------|:--------:|---------|-------------|
| `prompt` | string | **Yes** | — | The exact prompt sent to the Cursor agent. Be specific: include file paths, expected outcome, and constraints. |
| `cwd` | string | No* | opencode config dir | Working directory. ***Always set this*** for project tasks — omitting it means agent runs in the wrong directory. |
| `mode` | string | No | `"agent"` | Execution mode: `"agent"` / `"plan"` / `"ask"`. |
| `model` | string | No | Cursor account default | Model slug. Recommended: `"auto"` (Cursor picks best) or `"composer-1.5"`. ⚠️ **Ignored when `include_thinking: true`** (ACP mode does not support model selection). |
| `workspace` | string | No | same as `cwd` | Workspace root override (passed as `--workspace`). Must be absolute path. ⚠️ **Ignored when `include_thinking: true`** (ACP mode). |
| `include_thinking` | boolean | No | `false` | If `true`, uses ACP mode and returns `thinking` array alongside result. Slower (up to ~80s total); use for debugging complex tasks. Cannot combine with `model` or `workspace`. |

> \* `cwd` is technically optional but **practically required** for any project task.

---

## Output Format

### Success (default)
```
<assistant's full response text>
```
The tool returns the raw result string directly — no wrapper JSON in the tool output.

### Success with thinking (`include_thinking: true`)
```
Result:
<assistant's full response text>

Thinking:
<thinking chunk 1>
<thinking chunk 2>
...
```

### Failure
```json
{ "success": false, "error": "<human-readable error message>" }
```
Failures are **always explicit** — the error string will tell you what went wrong (auth, timeout, bad mode, CLI not found, etc.).

---

## Writing Effective Prompts

Good prompts are **specific, complete, and scoped**:

| ✅ Good | ❌ Bad |
|--------|--------|
| `"Add a JSDoc comment to the parseConfig function in src/config.js describing its params and return type"` | `"Add comments"` |
| `"Refactor the Auth class in src/auth/index.ts to use dependency injection; keep the public API identical"` | `"Refactor auth"` |
| `"Write a unit test for the calculateTotal function in lib/cart.js using Jest; mock the DB calls"` | `"Write tests"` |
| `"Fix the TypeScript error on line 42 of packages/api/src/routes.ts — type X is not assignable to Y"` | `"Fix the error"` |

**Tips:**
1. **Include file paths** — relative to `cwd`.
2. **State the expected outcome** — what should exist or be true after the task.
3. **State constraints** — keep API compatible, don't add new deps, match existing style.
4. **One focused task per call** — for multi-step work, chain multiple `cursor_agent` calls via sequencer/executor.

---

## Examples

### 1. Implement a feature (agent mode, default)
```
cursor_agent({
  prompt: "Add a retry mechanism with exponential backoff to the fetchUser function in src/api/user.ts. Max 3 retries, starting at 500ms.",
  cwd: "/Users/me/projects/my-app"
})
```

### 2. Planning only (no file edits)
```
cursor_agent({
  prompt: "Analyze the current authentication flow in src/auth/ and propose a plan to add OAuth2 support. List the files that need changes and the key steps.",
  cwd: "/Users/me/projects/my-app",
  mode: "plan"
})
```

### 3. Q&A about the codebase
```
cursor_agent({
  prompt: "Explain how the middleware chain in src/server/middleware.ts works and what order the middlewares execute in.",
  cwd: "/Users/me/projects/my-app",
  mode: "ask"
})
```

### 4. Using a specific model
```
cursor_agent({
  prompt: "Review the SQL queries in src/db/queries.ts for N+1 query problems and suggest fixes.",
  cwd: "/Users/me/projects/my-app",
  model: "composer-1.5"
})
```

### 5. Debug with thinking visible
```
cursor_agent({
  prompt: "Find why the user session is being lost after refresh in src/auth/session.ts and fix it.",
  cwd: "/Users/me/projects/my-app",
  include_thinking: true
})
```

### 6. Shell script (via node directly)
```bash
node ~/.config/opencode/scripts/run-cursor-agent.js \
  --cwd /Users/me/projects/my-app \
  --mode plan \
  --model composer-1.5 \
  -- "Outline the steps to migrate the DB schema from v1 to v2"
```

---

## Thinking Mode (ACP)

When `include_thinking: true`:
- The tool uses **ACP (Agent Client Protocol)** mode — JSON-RPC over stdio instead of print mode.
- **Slower**: ACP requires 4 sequential requests: `initialize` → `authenticate` → `session/new` → `session/prompt`. Each has a **20-second timeout**, so worst-case total is **~80 seconds**. An outer 120s plugin timeout is also in place.
- **Captures**: Both `agent_message_chunk` events (result) and `agent_thinking` events (reasoning).
- **Limitations**: `model` and `workspace` parameters are **not forwarded** in ACP mode — the agent uses its account default model. Do not set these alongside `include_thinking: true`.
- **Use for**: Debugging why the agent made a decision, verifying complex reasoning, transparency in orchestration.
- **Don't use for**: Routine tasks where speed matters — default print mode is faster and more reliable.

---

## Failure Recovery

| Error Pattern | Cause | Recovery |
|---------------|-------|----------|
| `"Failed to spawn agent: ENOENT"` | Cursor CLI not on PATH | Run `agent --version` to verify; install or add to PATH |
| `"Exit code 1. Ensure Cursor CLI is... authenticated"` | Not logged in | Run `agent login` or set `CURSOR_API_KEY` env var |
| `"Timed out waiting for initialize (20000ms)"` | ACP mode: agent acp not responding | Retry; check Cursor service status |
| `"agent acp exited unexpectedly (code=1)"` | ACP crash on startup | Check stderr in error msg; usually auth or network issue |
| `"Agent returned: {\"type\":\"result\",\"subtype\":\"error\",...}"` | Agent completed but with error subtype | Read the full JSON for the agent's error message |
| `"No success result in output."` | Print mode: no result line found | Agent may have crashed mid-run; try again with `include_thinking: true` for more visibility |

**General recovery strategy:**
1. Check the error string — it always contains the root cause.
2. Verify `cwd` is correct and the target files exist.
3. Retry once; if still failing, switch to `mode: "ask"` to diagnose without edits.
4. For persistent ACP failures, fall back to print mode (remove `include_thinking`).

---

## Integration Patterns

### With Sequencer → Executor
In a multi-step plan, `cursor_agent` handles implementation steps while opencode tools handle inspection/validation:
```
Step 1: Read + Grep (opencode) → understand the codebase
Step 2: cursor_agent mode=plan → get Cursor's implementation plan  
Step 3: cursor_agent mode=agent → execute the implementation
Step 4: Bash (opencode) → run tests to verify
Step 5: code-reviewer (subagent) → review the changes
```

### As Orchestrator delegation
When a step is complex enough to warrant Cursor's native tools (multi-file edits, deep codebase exploration), delegate via `cursor_agent` rather than spawning another opencode subagent:
```
Orchestrator → cursor_agent({ prompt: "<scoped task>", cwd: "<project>" })
             → receives clean result string
             → passes to next step or code-reviewer
```

### Chaining results
The result of one `cursor_agent` call can be used as context for the next:
```
const plan = await cursor_agent({ prompt: "Plan the refactor", mode: "plan", cwd })
const result = await cursor_agent({ prompt: `Execute this plan:\n${plan}`, cwd })
```

---

## Anti-Patterns

❌ **Omitting `cwd`** — Agent runs in the opencode config dir, not your project. Always set it.

❌ **Using `agent` mode when you only need to read** — Wasteful and risky. Use `mode: "ask"` or `mode: "plan"` for read-only tasks, or use opencode's Read/Grep tools directly.

❌ **Mega-prompts without scope** — Don't paste 500 lines of code as context. Give Cursor a file path and let it read the file itself.

❌ **Using `include_thinking` for every call** — ACP mode is slower and has a 20s per-request timeout. Reserve it for complex debugging or reasoning transparency.

❌ **Assuming the result is always code** — The result is the agent's full response text, which may include explanation prose. Parse/extract what you need.

❌ **No error handling** — Always check if the result starts with `{"success":false`. Treat it as an actionable error, not a string to pass downstream.

---

## Prerequisites

- **Cursor CLI** installed and on `PATH`: verify with `agent --version`
- **Authenticated**: run `agent login` in terminal, or set `CURSOR_API_KEY` / `CURSOR_AUTH_TOKEN` environment variable
- **Node.js** available (used by `run-cursor-agent.js` script)

---

## See Also

- `my-skills:cursor-agent-tool` — Shorter quick-reference for the tool (shell usage, JSON envelope format)
- `my-skills:subagent-driven-development` — Orchestrator rules for when to delegate to subagents
- `my-skills:sequential-task-runner` — How to chain sequencer → executor for multi-step plans
