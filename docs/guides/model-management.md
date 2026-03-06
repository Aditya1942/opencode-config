# Model & Agent Management Guide

How to replace, add, or reconfigure models and agents in the OpenCode multi-agent system.

---

## 1. How It Works

The agent system has three moving parts:

1. **Agent definitions** in `opencode.json` — each agent has a `name`, `model`, `mode`, `description`, and `prompt`
2. **The Task tool** — dispatches work to agents using `subagent_type`, which maps directly to agent names in the config
3. **Model inheritance** — if an agent has no `model` field, subagents inherit the invoking primary agent's model

```
opencode.json           Task tool               Agent execution
┌──────────────┐        ┌──────────────┐        ┌──────────────────┐
│ "explore": {  │        │ subagent_type │        │ Runs with       │
│   "model":    │───────▶│  = "explore"  │───────▶│ claude-haiku-4-5│
│   "anthropic/ │        └──────────────┘        └──────────────────┘
│    claude-haiku- │
│    4-5"       │
│ }             │
└──────────────┘
```

**Key rule:** If you define an agent named `foo` with `"mode": "subagent"`, it becomes available as `subagent_type: "foo"` in the Task tool automatically.

---

## 2. Current Agent Fleet

| Agent | Model | Provider | Tier | Mode | Purpose |
|-------|-------|----------|------|------|---------|
| `build` | (user-selected) | — | — | primary | Default agent, delegates complex tasks |
| `orchestrator` | (user-selected) | — | — | primary (plan only) | Decomposes tasks, plans, dispatches |
| `explore` | `anthropic/claude-haiku-4-5-20251001` | Anthropic | — | subagent | File reads, grep, directory listing (primary) |
| `explore-fallback` | `opencode/minimax-m2.5-free` | OpenCode Zen | T0 (free) | subagent (hidden) | File reads, grep, directory listing (fallback) |
| `general` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent | Code comprehension, multi-file analysis |
| `transform` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent (hidden) | Renames, formatting, simple refactors |
| `validator` | `opencode/gpt-5-nano` | OpenCode Zen | T0 (free) | subagent (hidden) | Output validation, format checks |
| `executor` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent | Primary code executor (implementation, tests) |
| `executor-fallback` | `anthropic/claude-haiku-4-5-20251001` | Anthropic | — | subagent (hidden) | Fallback code executor (when executor fails) |
| `librarian` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent | Research: docs, GitHub, library best practices |
| `librarian-fallback` | `anthropic/claude-haiku-4-5-20251001` | Anthropic | — | subagent (hidden) | Fallback librarian (when librarian fails) |
| `code-reviewer` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent | Post-implementation review |
| `metis` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent (hidden) | Pre-planning consultant; intent + gap analysis |
| `momus` | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | T1 | subagent (hidden) | Plan reviewer; executable plans, valid refs |

---

## 3. How to Replace a Model

When swapping one model for another within an existing agent.

### Steps

1. **Open `opencode.json`** and find the agent definition:
    ```json
    "explore": {
      "model": "anthropic/claude-haiku-4-5-20251001",
      ...
    }
    ```

2. **Change the `model` field** to the new model ID:
   ```json
   "explore": {
     "model": "opencode/new-model-name",
     ...
   }
   ```

3. **Update the `description`** to mention the new model (helps the orchestrator make routing decisions):
   ```json
   "description": "Fast, read-only file explorer using New Model. Use for file reads, grep, directory listing."
   ```

4. **Update the `prompt`** if the new model has different capabilities or needs different instructions.

5. **Check if the provider is configured** — see [Section 6: Adding a New Provider](#6-how-to-add-a-new-provider).

6. **Update all documentation** — see [Section 8: Files to Update Checklist](#8-files-to-update-checklist).

7. **Validate JSON:**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid')"
   ```

8. **Test routing** — start a new session and dispatch a task to the agent (see [Section 9: Testing Changes](#9-testing-changes)).

### Example: Replacing Claude Haiku 4.5 with a Newer Free Model

```json
// Before
"explore": {
  "mode": "subagent",
  "model": "anthropic/claude-haiku-4-5-20251001",
  "description": "Fast, read-only file explorer using Claude Haiku 4.5."
}

// After
"explore": {
  "mode": "subagent",
  "model": "opencode/newer-free-model",
  "description": "Fast, read-only file explorer using newer free model."
}
```

---

## 4. How to Add a New Agent

When adding a completely new agent role to the fleet.

### Steps

1. **Choose a name** — kebab-case (e.g., `pattern-scanner`, `security-auditor`)

2. **Add the definition** to `opencode.json` under `agent`:
   ```json
   "pattern-scanner": {
     "mode": "subagent",
     "model": "opencode/big-pickle",
     "description": "Scans codebase for patterns, anti-patterns, and structural trends.",
     "prompt": "You are a Pattern Scanner Agent...",
     "hidden": true
   }
   ```

3. **Choose the right options:**
   - `mode`: `"subagent"` (invoked by other agents), `"primary"` (user-facing), or `"all"` (both)
   - `hidden`: `true` to hide from `@` autocomplete (the agent is still available via Task tool)
   - `model`: the model ID in `provider/model-id` format
   - `steps`: optional max iterations before forcing a text response

4. **The agent is now available** as `subagent_type: "pattern-scanner"` in the Task tool

5. **Update the orchestrator prompt** — add the new agent to the routing table so the orchestrator knows when to use it

6. **Update documentation** — see [Section 8: Files to Update Checklist](#8-files-to-update-checklist)

7. **Validate and test**

### Agent Definition Reference

```json
{
  "agent-name": {
    "mode": "subagent",           // Required: "subagent" | "primary" | "all"
    "model": "provider/model-id", // Optional: inherits from invoker if omitted
    "description": "...",         // Required: when to use this agent
    "prompt": "...",              // Optional: system prompt
    "hidden": false,              // Optional: hide from @ menu (subagent only)
    "steps": 50,                  // Optional: max agentic iterations
    "temperature": 0.2,           // Optional: 0.0-1.0
    "permission": {               // Optional: tool permissions
      "edit": "allow",
      "bash": "ask",
      "task": {
        "*": "allow"
      }
    }
  }
}
```

---

## 5. How to Remove an Agent

1. **Delete the agent definition** from `opencode.json`
2. **Update the orchestrator prompt** — remove from routing table
3. **Update documentation** — see [Section 8: Files to Update Checklist](#8-files-to-update-checklist)
4. **Note:** Removing a built-in agent (`explore`, `general`) reverts it to the default behavior (inherits invoking agent's model)

---

## 6. How to Add a New Provider

### Built-in Providers (no config needed)

These providers are built into OpenCode and require no `provider` block:
- `opencode` — OpenCode Zen models (free and paid)
- `anthropic` — Claude models
- Other built-in providers — run `opencode models` to see all available

### Custom Providers

For providers not built in, add to the `provider` block in `opencode.json`:

```json
"provider": {
  "my-provider": {
    "models": {
      "model-name": {
        "name": "Human-Readable Display Name",
        "limit": {
          "context": 128000,
          "output": 16384
        },
        "modalities": {
          "input": ["text"],
          "output": ["text"]
        }
      }
    }
  }
}
```

Then use the model as `my-provider/model-name` in agent definitions.

### Environment Variables

Most providers require API keys set as environment variables. Check the provider's documentation and OpenCode's [providers docs](https://opencode.ai/docs/providers) for details.

---

## 7. Model ID Format

- **Format:** `provider/model-id` (e.g., `anthropic/claude-opus-4-6`)
- **Provider names:** lowercase (e.g., `opencode`, `anthropic`, `zai`)
- **Model IDs:** use the provider's naming convention
- **Discovery:** run `opencode models` to list all available models
- **Schema reference:** model IDs conform to `https://models.dev/model-schema.json`

### Examples

| Model ID | Provider | Model |
|----------|----------|-------|
| `opencode/minimax-m2.5-free` | OpenCode Zen | MiniMax M2.5 Free |
| `opencode/gpt-5-nano` | OpenCode Zen | GPT-5 Nano |
| `anthropic/claude-haiku-4-5-20251001` | Anthropic | Claude Haiku 4.5 (latest) |
| `anthropic/claude-opus-4-6` | Anthropic | Claude Opus 4.6 |
| `anthropic/claude-sonnet-4-6` | Anthropic | Claude Sonnet 4.6 |
| `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | GLM 4.7 |
| `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | GLM 4.7 |

---

## 8. Files to Update Checklist

When making **any** model or agent change, update ALL of these files:

| File | What to Update |
|------|---------------|
| `opencode.json` → agent definition | `model`, `description`, `prompt` fields |
| `opencode.json` → orchestrator prompt | 3-TIER MODEL ROUTING table (inside the prompt string) |
| `AGENTS.md` | Agent Hierarchy table (lines ~52-59) |
| `AGENTS.md` | 3-Tier Model Routing table (if tier membership changes) |
| `skills/team-agents/SKILL.md` | Agent Name Mapping table (Section 3) |
| `skills/team-agents/SKILL.md` | Model Documentation section (Section 2) |
| `skills/team-agents/SKILL.md` | Fallback Chains table (Section 4) |
| `docs/guides/model-management.md` | Current Agent Fleet table (Section 2 of this file) |

### Quick Validation After Changes

```bash
# 1. Validate JSON
node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid')"

# 2. Check agent count
node -e "const c = JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log(Object.keys(c.agent).length + ' agents defined')"

# 3. List all agent models
node -e "const c = JSON.parse(require('fs').readFileSync('opencode.json','utf8')); Object.entries(c.agent).forEach(([n,a]) => console.log(n + ': ' + (a.model || '(inherited)')))"
```

---

## 9. Testing Changes

After any model or agent change:

1. **Validate JSON** (see above)

2. **Start a new session** — model changes require a fresh OpenCode session to take effect

3. **Dispatch a test task** to the changed agent:
   ```
   Use the Task tool with subagent_type set to the agent name.
   Give it a simple task like "Read /Users/me/.config/opencode/package.json and return its contents."
   ```

4. **Verify the correct model** — check:
   - Response speed and style (free models respond faster, differently)
   - Session child navigation (`<Leader>+Right`) to see the subagent session
   - Token usage in session status (`<Leader>+s`)

5. **If the agent is used by the orchestrator**, test via the orchestrator:
   - Ask the orchestrator to do a task that would route to the changed agent
   - Verify the orchestrator's plan shows the correct agent name
   - Confirm the task completes successfully

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Agent uses wrong model | Missing `model` field — inherits from invoking agent | Add explicit `model` field to the agent definition |
| Agent not available in Task tool | Not defined in config, or `permission.task` denies it | Add agent definition or check permissions |
| Agent not in `@` autocomplete | `hidden: true` is set | Remove `hidden` or set to `false` |
| Provider not found | Provider not configured or API key missing | Add `provider` config block or set env var |
| JSON parse error after edit | Syntax error in `opencode.json` | Run `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8'))"` to see the error |
| Subagent returns empty | Model doesn't support the requested task, or exceeded limits | Check model capabilities; try the next model in fallback chain |
| Orchestrator routes to wrong agent | Orchestrator prompt routing table doesn't match config | Update the routing table inside the orchestrator prompt |
| Changes not taking effect | Using an existing session | Start a **new** OpenCode session |
