# Tiered Agent Fleet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure the 7-agent tiered fleet in `opencode.json` so the orchestrator dispatches subagents to the correct free/paid models, and write a model management guide doc.

**Architecture:** Override the built-in `explore` and `general` subagents with free models (GLM 5 Free, Kimi K2.5 Free). Add two new hidden subagents (`transform`, `validator`). Keep existing `executor` and `code-reviewer` on Z.AI GLM 4.7. Update the orchestrator prompt to reference actual agent names. Update the `team-agents` skill and `AGENTS.md` to match. Write `docs/guides/model-management.md` for future model changes.

**Tech Stack:** OpenCode.ai config (JSON), Markdown skills/docs

---

## Task 1: Add `explore` agent override to `opencode.json`

**Files:**
- Modify: `opencode.json` — add `explore` agent definition in the `agent` block

**Step 1: Add the `explore` agent definition**

Add the following agent entry after the `build` agent in `opencode.json`. This overrides the built-in `explore` subagent to use GLM 5 Free instead of inheriting the invoking agent's model.

```json
"explore": {
  "mode": "subagent",
  "model": "opencode/glm-5-free",
  "description": "Fast, read-only file explorer using free model. Use for file reads, grep, directory listing, and simple lookups.",
  "prompt": "You are a File Explorer Agent. Your job is to read files, search codebases, and return structured results.\n\n## RULES\n- Read files and return contents accurately\n- Search for patterns across directories\n- List directory structures\n- Return structured JSON output when requested\n- Include a confidence field (0.0-1.0) in your responses\n- Be precise and concise — you read, you don't reason about code logic\n- Never modify files"
}
```

**Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

---

## Task 2: Add `general` agent override to `opencode.json`

**Files:**
- Modify: `opencode.json` — add `general` agent definition

**Step 1: Add the `general` agent definition**

Add after the `explore` agent. This overrides the built-in `general` subagent to use Kimi K2.5 Free for code comprehension instead of inheriting the invoking agent's model.

```json
"general": {
  "mode": "subagent",
  "model": "opencode/kimi-k2.5-free",
  "description": "Code comprehension and multi-file analysis using free model. Use for understanding how modules work, tracing data flow, building dependency maps, and explaining code.",
  "prompt": "You are a Code Comprehension Agent. Your job is to understand code and explain how it works.\n\n## RULES\n- Analyze how modules work and summarize their purpose\n- Trace data flow across multiple files\n- Build dependency maps (what imports what, what calls what)\n- Identify entry points and public API surfaces\n- Return structured JSON output when requested\n- Include a confidence field (0.0-1.0) in your responses\n- Be specific — scope your analysis to the files provided"
}
```

**Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

---

## Task 3: Add `transform` agent to `opencode.json`

**Files:**
- Modify: `opencode.json` — add `transform` agent definition

**Step 1: Add the `transform` agent definition**

Add after the `general` agent. This is a new hidden subagent for lightweight mechanical code transforms using MiniMax M2.5 Free.

```json
"transform": {
  "mode": "subagent",
  "hidden": true,
  "model": "opencode/minimax-m2.5-free",
  "description": "Lightweight mechanical code transformer using free model. Use for renames, reformatting, simple refactors, pattern conversions, and boilerplate generation. Does NOT change logic.",
  "prompt": "You are a Code Transform Agent. You perform mechanical code transformations without changing logic.\n\n## RULES\n- Rename variables/functions consistently across files\n- Reformat code to match style guidelines\n- Convert between patterns (e.g., callbacks to promises, CJS to ESM)\n- Generate boilerplate and stubs from specifications\n- NEVER change conditionals, loops, error handling, or business logic\n- Return structured JSON output when requested\n- Include a confidence field (0.0-1.0) in your responses\n- List all files_modified in your output"
}
```

**Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

---

## Task 4: Add `validator` agent to `opencode.json`

**Files:**
- Modify: `opencode.json` — add `validator` agent definition

**Step 1: Add the `validator` agent definition**

Add after the `transform` agent. This is a new hidden subagent for output validation using GPT-5 Nano.

```json
"validator": {
  "mode": "subagent",
  "hidden": true,
  "model": "opencode/gpt-5-nano",
  "description": "Output validator and format checker. Use to verify other agents' outputs are correct, complete, and properly structured. Checks for hallucinated imports, missing elements, and JSON validity.",
  "prompt": "You are a Validation Agent. You verify that other agents' outputs are correct and complete.\n\n## RULES\n- Validate JSON structure and schema compliance\n- Check completeness — did the output cover all requested items?\n- Detect hallucinated imports or dependencies\n- Verify patch consistency (files_modified matches actual changes)\n- Return pass/fail with specific issues found\n- Include a confidence field (0.0-1.0) in your responses\n- You validate, you do NOT fix issues or generate code"
}
```

**Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

---

## Task 5: Update the orchestrator prompt in `opencode.json`

**Files:**
- Modify: `opencode.json` — update `agent.orchestrator.prompt`

**Step 1: Update the orchestrator prompt**

Replace the existing orchestrator prompt with an updated version that references actual agent names (`explore`, `general`, `transform`, `validator`, `executor`, `code-reviewer`) instead of abstract model names. The key change is in the 3-TIER MODEL ROUTING section — map each tier to actual `subagent_type` values the Task tool accepts.

The updated routing table in the prompt should be:

```
## 3-TIER MODEL ROUTING

### Tier 0 — Free Models (exploration, reads, lightweight tasks)
| Agent Role | subagent_type | Model | When to Use |
|---|---|---|---|
| File Explorer | explore | GLM 5 Free | File reads, grep, directory listing, simple lookups |
| Code Comprehension | general | Kimi K2.5 Free | Code comprehension, multi-file search + understand |
| Lightweight Transform | transform | MiniMax M2.5 Free | Renames, formatting, simple refactors, no logic changes |
| Output Validator | validator | GPT-5 Nano | Validate other agents' outputs, format checks |

### Tier 1 — Z.AI (code generation, execution)
| Agent Role | subagent_type | Model | When to Use |
|---|---|---|---|
| Code Executor | executor | GLM 4.7 | Feature implementation, code generation, tests, refactoring |

### Tier 2 — Anthropic (final authority, complex/security)
| Agent Role | subagent_type | Model | When to Use |
|---|---|---|---|
| You (orchestrator) | — | Claude Opus 4.6 | Complex logic, architecture, security-sensitive code — handle directly, do NOT delegate |
```

Also add a note: "When dispatching via the Task tool, use the exact `subagent_type` values listed above (explore, general, transform, validator, executor, code-reviewer)."

**Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

---

## Task 6: Update `AGENTS.md` to reflect new agent fleet

**Files:**
- Modify: `AGENTS.md` — update Agent Hierarchy table and 3-Tier Model Routing table

**Step 1: Update the Agent Hierarchy table**

Replace the existing 4-row table with a 7-row table reflecting all agents:

```markdown
### Agent Hierarchy

| Agent              | Model                         | Role                                    | Mode      |
|--------------------|-------------------------------|-----------------------------------------|-----------|
| `build` (primary)  | (user-selected)               | Default primary agent, delegates complex tasks to orchestrator | primary |
| `orchestrator`     | (user-selected)               | Planning orchestrator — decomposes, plans, dispatches | primary (plan only) |
| `explore`          | GLM 5 Free (OpenCode Zen)     | File reads, grep, directory listing      | subagent  |
| `general`          | Kimi K2.5 Free (OpenCode Zen) | Code comprehension, multi-file analysis  | subagent  |
| `transform`        | MiniMax M2.5 Free (OpenCode Zen) | Renames, formatting, simple refactors | subagent (hidden) |
| `validator`        | GPT-5 Nano (OpenCode Zen)     | Output validation, format checks         | subagent (hidden) |
| `executor`         | GLM 4.7 (Z.AI Coding Plan)   | Code generation, implementation          | subagent  |
| `code-reviewer`    | GLM 4.7 (Z.AI Coding Plan)   | Post-implementation review               | subagent  |
```

**Step 2: Update the 3-Tier Model Routing table**

Ensure it matches the actual config. No changes needed to the tier descriptions, just verify alignment.

---

## Task 7: Update `team-agents` skill to reference actual agent names

**Files:**
- Modify: `skills/team-agents/SKILL.md` — update Section 3 (Role-Based Routing Map) to use actual `subagent_type` values

**Step 1: Add a mapping section**

Add a new subsection at the top of Section 3 that maps abstract roles to actual `subagent_type` values:

```markdown
### Agent Name Mapping

| Abstract Role | subagent_type | Model |
|---|---|---|
| File Explorer | `explore` | opencode/glm-5-free |
| Code Comprehension | `general` | opencode/kimi-k2.5-free |
| Lightweight Transform | `transform` | opencode/minimax-m2.5-free |
| Output Validator | `validator` | opencode/gpt-5-nano |
| Code Executor | `executor` | zai/glm-4.7 |
| Code Reviewer | `code-reviewer` | zai/glm-4.7 |
| Final Authority | (orchestrator routes to Opus for security/complex) | anthropic/claude-opus-4-6 |

When dispatching via the Task tool, always use the `subagent_type` column value.
```

---

## Task 8: Write `docs/guides/model-management.md`

**Files:**
- Create: `docs/guides/model-management.md`

**Step 1: Write the model management guide**

Create a comprehensive guide covering:

1. **How the agent-model routing works** — how `opencode.json` agent definitions map to Task tool `subagent_type` values
2. **How to replace a model** — step-by-step for swapping one model for another (e.g., replacing GLM 5 Free with a newer free model)
3. **How to add a new model from a new provider** — including provider config, model definition, and agent assignment
4. **How to add a new agent role** — creating a new subagent for a new capability
5. **Checklist of files to update** — every file that references models/agents
6. **Provider configuration** — how the `provider` block works in `opencode.json`
7. **Model ID format** — `provider/model-id` convention
8. **Testing changes** — how to verify routing works after changes

The guide should be self-contained — someone with no context should be able to follow it.

---

## Task 9: Run integration test to verify routing

**Step 1: Start a new session and verify agent routing**

After all config changes are applied, test by dispatching tasks to each subagent type and verifying the correct model is used. The test from the earlier session can be rerun:

- Dispatch `explore` task → should use GLM 5 Free (not Opus)
- Dispatch `general` task → should use Kimi K2.5 Free (not Opus)
- Dispatch `executor` task → should use GLM 4.7
- Dispatch `validator` task → should use GPT-5 Nano

**Note:** Model verification may require checking the session logs or observing response characteristics, since the Task tool doesn't explicitly report which model was used.

---

## Execution Summary

| Task | Files | Action | Complexity |
|------|-------|--------|------------|
| T1 | `opencode.json` | Add `explore` agent | Simple |
| T2 | `opencode.json` | Add `general` agent | Simple |
| T3 | `opencode.json` | Add `transform` agent | Simple |
| T4 | `opencode.json` | Add `validator` agent | Simple |
| T5 | `opencode.json` | Update orchestrator prompt | Medium |
| T6 | `AGENTS.md` | Update tables | Simple |
| T7 | `skills/team-agents/SKILL.md` | Add agent name mapping | Simple |
| T8 | `docs/guides/model-management.md` | Create guide | Medium |
| T9 | (runtime test) | Verify routing | Simple |

**Total: 9 tasks, all independent except T9 (depends on T1-T5)**
**Estimated time: ~15-20 minutes**
