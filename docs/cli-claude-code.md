# Claude Code CLI — Shell reference for subagents

This doc describes how to invoke the **Claude Code CLI** (`claude`) from the shell so that subagents can perform the same planning, execution, and exploration work that the former claude-code MCP provided. Use it when you have shell access and no MCP.

## Prerequisites

- **Binary:** `claude` on PATH, or set `CLAUDE_CODE_BIN` to the full path.
- **Auth:** Claude Code must be authenticated (e.g. `claude auth login` or equivalent).

Verify:

```bash
claude --version
# or
$CLAUDE_CODE_BIN --version
```

## Working directory

The CLI has no `--cwd` flag. Run from the desired project directory:

```bash
cd /path/to/project && claude -p "PROMPT" --output-format json ...
```

## MCP-equivalent operations

### list_profiles

There is no CLI subcommand for profiles. "Profiles" are implemented by passing **system prompt** text. To emulate a profile from the shell:

- Use `--system-prompt "..."` to replace the default system prompt, or
- Use `--append-system-prompt "..."` to add to it.

Profile names and their roles (use these to build `--append-system-prompt` or `--system-prompt` text as needed):

| Profile | Use for |
|---------|--------|
| `explore` | Read-only codebase mapping, search, symbol tracing |
| `general` | Code comprehension, dependency tracing |
| `librarian` | Docs research, official references, examples |
| `planner` | Implementation plans with assumptions, risks, verification |
| `executor` | Implementation, edits, tests, verification |
| `validator` | Output validation, completeness, hallucination checks |
| `code-reviewer` | Security-first code review, bug finding |
| `architect` | Architecture design, trade-offs, system structure |
| `transform` | Mechanical refactors, renames, formatting |
| `build-error-resolver` | Minimal-diff build/type/lint fixes |
| `refactor-cleaner` | Dead-code cleanup, dependency cleanup |
| `doc-updater` | README and doc updates |
| `tdd-guide` | Test-first development discipline |
| `skill-chooser` | Recommend skills/workflows for a task |

### list_agents

List built-in and configured Claude Code agents:

```bash
claude agents [--plugin-dir DIR...] [--setting-sources A,B] [--settings JSON_OR_PATH]
```

### plan_task

Build a prompt (task + optional context), then run in **plan** mode (read-only planning):

```bash
cd /path/to/project && claude -p "Create a concrete implementation plan for the task below.
Return a concise numbered plan with assumptions, risks, and verification steps.

Task: YOUR_TASK
Context: OPTIONAL_CONTEXT" \
  --output-format json \
  --permission-mode plan \
  [--model MODEL] [--agent AGENT] [--append-system-prompt "PROFILE_TEXT"] [--add-dir DIR...]
```

Use `--permission-mode plan` so Claude does not apply edits.

### execute_task

Same as plan_task but allow edits:

```bash
cd /path/to/project && claude -p "Execute the task below using Claude Code.
Prefer small, verifiable changes and summarize what you changed.

Task: YOUR_TASK
Plan: OPTIONAL_PLAN
Context: OPTIONAL_CONTEXT" \
  --output-format json \
  --permission-mode acceptEdits \
  [--model MODEL] [--agent AGENT] [--append-system-prompt "PROFILE_TEXT"] [--add-dir DIR...]
```

### run_skill

Invoke a slash command or skill by sending it as the prompt (e.g. `/skillName args` plus optional context). Use the same invocation as **run_prompt** with that prompt.

### run_prompt

Low-level: send an arbitrary prompt with optional controls:

```bash
cd /path/to/project && claude -p "YOUR_PROMPT" \
  --output-format json \
  [--permission-mode MODE] [--model MODEL] [--agent AGENT] \
  [--system-prompt "..." | --append-system-prompt "..."] [--add-dir DIR...]
```

## Flag reference

| Flag | Description |
|------|-------------|
| `-p`, `--prompt` | Prompt text (required for task runs). |
| `--output-format` | `text`, `json`, or `stream-json`. For automation use `json` or `stream-json`. |
| `--permission-mode` | `default`, `acceptEdits`, `plan`, `dontAsk`, `auto`, `bypassPermissions`. Use `plan` for planning-only, `acceptEdits` for execution. |
| `--model` | Model alias or full name (e.g. `sonnet`, `opus`, `claude-sonnet-4-6`). |
| `--agent` | Claude Code agent name for this run. |
| `--system-prompt` | Replace default system prompt. |
| `--append-system-prompt` | Append to default system prompt (use for profile text). |
| `--add-dir` | Additional directories Claude may access (repeat for multiple). |
| `--plugin-dir` | Plugin directories (repeat for multiple). |
| `--settings` | JSON object, JSON string, or path to settings file. |
| `--setting-sources` | Comma-separated sources (e.g. `user,project,local`). |
| `--max-turns` | Maximum agent turns. |
| `--effort` | `low`, `medium`, or `high`. |
| `--fallback-model` | Fallback model for print mode. |
| `--no-session-persistence` | Disable session persistence for one-off runs. |
| `--verbose` | Verbose output. |
| `--debug` | Enable debug logging (optional category filter). |
| `--debug-file` | Write debug logs to file. |

## Output

- With `--output-format json`, stdout is a single JSON object; parse it for the final result.
- With `--output-format stream-json`, stdout is newline-delimited JSON events; the last `type: "result"` event carries the final output.

## Timeout

The CLI has no timeout flag. For long runs, wrap in a shell timeout (e.g. `timeout 600000` or your env default). The former MCP used a 10-minute default (600000 ms).

## Example: plan then execute

```bash
# 1. Plan (read-only)
cd /path/to/project && claude -p "Create a concrete implementation plan for: Add a new API endpoint for user preferences." \
  --output-format json --permission-mode plan

# 2. Execute (with optional plan in prompt)
cd /path/to/project && claude -p "Execute the task below.
Task: Add a new API endpoint for user preferences.
Plan: 1. Add route. 2. Add handler. 3. Add tests." \
  --output-format json --permission-mode acceptEdits
```
