# Model & Agent Management Guide

How to replace, add, or reconfigure models and agents in the OpenCode config. **Current config:** 7 agents (build, plan, orchestrator, sequencer, executor, explore, ultron); task work is done by subagents using tools. See root [AGENTS.md](../../AGENTS.md).

---

## 1. How It Works

1. **Agent definitions** in `opencode.json` — under the `agent` key. Each entry can have `model`, `mode`, `description`, `prompt`.
2. **Subagents** (sequencer, executor, explore, ultron) are invoked via the Task tool / `@mention`; they use tools (Read, Write, Edit, Bash) for actual work.
3. **Model inheritance** — if an agent has no `model` field, it may inherit from the invoking context; primary agents typically use user-selected model.

**Key rule:** Agents defined in `opencode.json` under `agent` are available as subagents. Adding an agent named `foo` with `"mode": "subagent"` makes it available as `@foo` / Task tool.

---

## 2. Current Agent Fleet (7 agents)

| Agent | Model | Mode | Purpose |
|-------|-------|------|---------|
| `build` | user-selected | primary | Default agent; @sequencer then @executor or do work directly using tools |
| `plan` | user-selected | primary | Planning only; must spawn @ultron; optional validation via executor or directly |
| `orchestrator` | user-selected | primary | PURE dispatcher; routes to @explore, @sequencer then @executor, or delegate |
| `sequencer` | Claude Sonnet | subagent | Big task → tools → ordered plan |
| `executor` | Claude Haiku | subagent | Plan → tools → execute steps (validate + review per step) |
| `explore` | Claude Haiku | subagent | Read-only codebase summary using tools |
| `ultron` | Claude Sonnet | subagent | Planning: skill selection per step; structured plan only |

---

## 3. How to Replace a Model

1. **Open `opencode.json`** and find the agent under `agent` (e.g. `sequencer`, `executor`, `explore`, `ultron`).
2. **Change the `model` field** to the new model ID (e.g. `anthropic/claude-sonnet-4-6`).
3. **Update `description`** if the new model changes when to use the agent.
4. **Ensure the provider is configured** (see Section 6).
5. **Update docs** per [../config-change-checklist.md](../config-change-checklist.md) (AGENTS.md, README, etc.).
6. **Validate JSON:** `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid')"`
7. **Restart OpenCode** and test.

---

## 4. How to Add a New Agent

1. **Choose a kebab-case name** (e.g. `reviewer`, `scanner`).
2. **Add the definition** to `opencode.json` under `agent`:
   ```json
   "my-agent": {
     "mode": "subagent",
     "model": "anthropic/claude-haiku-4-5-20251001",
     "description": "Short description of when to use this agent.",
     "prompt": "You are the my-agent. ..."
   }
   ```
3. **Update all files** that track config: see [../config-change-checklist.md](../config-change-checklist.md) (README, AGENTS.md, .opencode/INSTALL.md).
4. **Validate and test** in a new session.

---

## 5. How to Remove an Agent

1. **Remove the agent entry** from `opencode.json` → `agent`.
2. **Update docs** per [../config-change-checklist.md](../config-change-checklist.md) (AGENTS.md, README, etc.).
3. **Restart OpenCode.**

---

## 6. How to Add a New Provider

- **Built-in providers** (e.g. `anthropic`, `opencode`) need no extra config; set API keys / auth as required.
- **Custom providers:** Add a `provider` block in `opencode.json` per OpenCode docs; then use `provider-name/model-id` in agent `model` fields.
- See OpenCode documentation for provider schema and environment variables.

---

## 7. Model ID Format

- **Format:** `provider/model-id` (e.g. `anthropic/claude-sonnet-4-6`, `anthropic/claude-haiku-4-5-20251001`).
- **Discovery:** run `opencode models` (or equivalent) to list available models.
- Use IDs that match your configured providers.

---

## 8. Files to Update Checklist

When changing agents or models, follow **[../config-change-checklist.md](../config-change-checklist.md)**:

- `opencode.json` — agent definitions (key: `agent`)
- `README.md` — Agent tables, counts
- `AGENTS.md` (root) — Agent Hierarchy table
- `.opencode/INSTALL.md` — Verification step, directory structure if needed
- `docs/AGENTS.md`, `docs/INDEX.md` — if you added/removed agents

---

## 9. Testing Changes

1. **Validate JSON** (see Section 3).
2. **Start a new OpenCode session** so config is reloaded.
3. **Invoke the agent** (e.g. spawn @sequencer or run a task that routes to the changed agent).
4. **Confirm** the correct model and behavior (e.g. response style, token usage).

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Agent uses wrong model | Missing `model` or inheritance | Set explicit `model` on the agent in `opencode.json` |
| Agent not available | Not in `opencode.json` or typo | Check `agent` key in opencode.json |
| Provider not found | Provider not configured or API key missing | Add provider config or set env vars; check OpenCode docs |
| JSON error after edit | Syntax error | Run `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8'))"` to locate it |
| Changes not applied | Cached session | Restart OpenCode / start a new session |
