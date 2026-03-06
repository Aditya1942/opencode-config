# Agent Test Prompts

Use these prompts to verify each agent responds correctly to its role. Each prompt is designed to exercise the agent's specific specialty. Run them by invoking the agent directly (e.g. `@explore`, `@executor`).

---

## How to Use

1. Start a new session in OpenCode
2. Invoke the agent using `@<agent-name> <prompt>`
3. Check the response against the **What to look for** criteria
4. A passing agent hits all or most criteria points

---

## Primary Agents

### `@explore` — Claude Haiku 4.5 (20251001)
> Codebase mapping, search, LSP/ast_grep/ripgrep (read-only)

**Test prompt:**
```
Map the structure of this repository. List all top-level directories, identify what each one contains, and tell me which files define agent configuration and which files define skills.
```

**What to look for:**
- Lists top-level dirs: `skills/`, `plugins/`, `docs/`, `.agents/`, `node_modules/`, etc.
- Correctly identifies `opencode.json` as the agent/model configuration file
- Correctly identifies `skills/*/SKILL.md` as skill definitions
- Returns file paths and line references, not vague descriptions
- Does NOT modify any files (read-only constraint respected)

---

### `@explore-fallback` — MiniMax M2.5 Free
> Fallback explorer — connectivity and basic read capability

**Test prompt:**
```
List all files in the skills/superpowers/ directory and return their names.
```

**What to look for:**
- Returns a valid list of file/directory names from `skills/superpowers/`
- No errors or refusals
- Responds within a reasonable time (fallback connectivity confirmed)

---

### `@general` — GLM 4.7
> Code comprehension, multi-file analysis, dependency maps

**Test prompt:**
```
Analyse how the superpowers plugin system works in this repo. Trace how a skill gets loaded: starting from plugins/superpowers.js, explain what it does, how it injects skills into the system prompt, and which files it depends on.
```

**What to look for:**
- Correctly identifies `plugins/superpowers.js` as the bootstrap plugin
- Explains the skill injection mechanism (reads SKILL.md files, injects into system prompt)
- Maps dependencies between `superpowers.js` and the `skills/` directory
- Returns a structured explanation (not just a file listing)
- Includes a `confidence` score or equivalent certainty indicator

---

### `@librarian` — GLM 4.7
> Research: docs, multi-repo, GitHub examples, library best practices

**Test prompt:**
```
I'm using the @modelcontextprotocol/server-memory MCP in this project. Look up the official documentation and find: (1) what transport protocol it uses, (2) what tools/capabilities it exposes, and (3) any known limitations or gotchas when running it with npx.
```

**What to look for:**
- Cites official MCP documentation or the GitHub repo (not hallucinated facts)
- Lists actual tool names exposed by server-memory (e.g. `create_entities`, `search_nodes`)
- Mentions the transport protocol (stdio)
- Distinguishes official docs from community/blog sources
- Provides source links or references

---

### `@librarian-fallback` — Claude Haiku 4.5 (20251001)
> Fallback librarian — connectivity and basic research capability

**Test prompt:**
```
What is the latest stable version of the @modelcontextprotocol/server-memory npm package? Check npm or the official docs.
```

**What to look for:**
- Returns a version number (or states it cannot access live data)
- No errors or refusals
- Fallback connectivity confirmed

---

### `@transform` — GLM 4.7
> Mechanical renames, reformatting, simple refactors (no logic changes)

**Test prompt:**
```
In the opencode.json file, all agent `description` fields currently use em-dashes (—). Reformat them to use a simple hyphen-dash ( - ) instead. Do not change any other content — only the punctuation in description strings.
```

**What to look for:**
- Identifies every `description` field containing `—` in `opencode.json`
- Produces a diff/patch that replaces only `—` with ` - ` in description values
- Does NOT change any model IDs, prompt text, or structural JSON
- Lists `files_modified: ["opencode.json"]`
- Includes a `confidence` score

> **Note:** After reviewing the output, do NOT apply this change — it's a test only. Revert if accidentally applied.

---

### `@validator` — GPT-5 Nano
> Output validation, format checks, hallucination detection

**Test prompt:**
```
Validate this JSON snippet for schema correctness and completeness. The schema requires every agent entry to have: "mode", "model", "description", and "prompt" fields. Report any missing fields.

```json
{
  "explorer-agent": {
    "mode": "subagent",
    "model": "anthropic/claude-haiku-4-5-20251001",
    "description": "Fast codebase explorer."
  },
  "writer-agent": {
    "mode": "subagent",
    "model": "zai-coding-plan/glm-4.7",
    "description": "Code writer.",
    "prompt": "You write code."
  }
}
```
```

**What to look for:**
- Correctly identifies `explorer-agent` is missing the `"prompt"` field
- Correctly marks `writer-agent` as valid (all 4 fields present)
- Returns a pass/fail verdict per entry
- Does NOT fix or generate missing fields (validator role only)
- Includes a `confidence` score

---

### `@executor` — GLM 4.7
> Implements microtasks from orchestrator; full tool access

**Test prompt:**
```
Add a new slash command called `antigravity-quota` to opencode.json. It should have:
- template: "Check the Antigravity API quota by running: opencode auth status"
- description: "Check Antigravity API quota and remaining credits"

Place it alongside the existing commands (brainstorm, write-plan, execute-plan). Then verify the JSON is still valid.
```

**What to look for:**
- Reads `opencode.json` first before making changes
- Adds the `antigravity-quota` command in the correct `"command"` block
- Preserves all existing commands untouched
- Validates JSON after editing (runs a parse check or equivalent)
- Declares `files_modified: ["opencode.json"]`
- Ends with a text summary (not a tool call)

> **Note:** This command may already exist — check before running. If it does, change the prompt to add a `status` command instead.

---

### `@executor-fallback` — Claude Haiku 4.5 (20251001)
> Fallback executor — connectivity and basic write capability

**Test prompt:**
```
Create a file at docs/test-output.txt with the content: "executor-fallback connectivity test passed". Then confirm the file was created by reading it back.
```

**What to look for:**
- Creates `docs/test-output.txt` with the exact content
- Reads it back and confirms the content matches
- No errors or refusals
- Clean up: delete the file after confirming (or note it should be deleted)

---

### `@code-reviewer` — GLM 4.7
> Security-first code review: quality, React/Next.js, Node.js patterns

**Test prompt:**
```
Review the `plugins/custom-hooks.js` file. Apply your full checklist including Code Quality and Node.js backend patterns. Make sure to organize your findings by CRITICAL/HIGH/MEDIUM/LOW severity and provide a final verdict (APPROVE / WARNING / BLOCK). Report only issues you are >80% confident about.
```

**What to look for:**
- Actually reads `plugins/custom-hooks.js`
- Checks for Node.js patterns and general quality (missing error handling, large functions)
- Groups findings by severity (CRITICAL/HIGH/MEDIUM/LOW)
- Provides a summary table and Verdict at the end
- Does NOT flood the review with low-confidence noise
- Ends with a text summary (not a tool call)

---

## Specialist Agents

### `@architect` — GLM 4.7
> System design, scalability, ADRs, trade-off analysis (read-only)

**Test prompt:**
```
I want to add a centralized logging service to this OpenCode project that stores Agent execution logs. Create an Architecture Decision Record (ADR) evaluating whether we should use local file-based logging (SQLite/JSON) or an external database (Supabase/PostgreSQL).
```

**What to look for:**
- Creates a structured ADR (Context, Decision, Consequences)
- Evaluates trade-offs (pros/cons) of local vs external storage
- Recommends a final decision with rationale
- Highlights potential scalability bottlenecks or architectural principles
- Does NOT alter files (read-only constraint)

---

### `@build-error-resolver` — GLM 4.7
> Build/type error fixer — minimal diffs, no refactoring

**Test prompt:**
```
Assume we ran `npx eslint .` and got an error in `plugins/custom-hooks.js`: "'console' is not allowed". How would you fix this specific error with minimal changes? Do not rewrite the file.
```

**What to look for:**
- Focuses entirely on fixing the error with minimal disruption
- Proposes adding an eslint-disable comment or replacing console with a compatible logger
- Does NOT propose refactoring the code structure
- Adheres to the "speed and precision over perfection" mandate

---

### `@refactor-cleaner` — GLM 4.7
> Dead code cleanup, duplicate elimination, dependency cleanup

**Test prompt:**
```
Explain the exact command sequence and safety workflow you would use to find and safely remove unused code or exports in this repository.
```

**What to look for:**
- Mentions using detection commands (`npx knip`, `npx ts-prune`, `npx depcheck`)
- Outlines the categorical workflow (Analyze -> Verify -> Remove Safely)
- Explains safety rules (checking for dynamic imports via grep, running tests)
- Emphasizes committing changes in batches and not doing it during feature development

---

### `@doc-updater` — Claude Haiku 4.5 (20251001)
> Documentation and codemap generation/maintenance

**Test prompt:**
```
Generate an architectural codemap for the repository structure. Read the `AGENTS.md` and `opencode.json` files to build a mapping of the system's architecture, key modules, and data flow.
```

**What to look for:**
- Follows the exact Codemap format (Headers: Architecture, Key Modules, Data Flow)
- Includes freshness timestamps
- Extrapolates imports/dependencies across the configs and `plugins/`
- Keeps outputs concise and linked to the source of truth

---

### `@tdd-guide` — GLM 4.7
> TDD specialist — Red-Green-Refactor, 80%+ coverage

**Test prompt:**
```
I'm planning to implement a new custom hook in `plugins/hooks/`. Walk me through how you would guide me to build this using your Test-Driven Development workflow. What specific edge cases should I prepare tests for?
```

**What to look for:**
- Outlines the RED-GREEN-REFACTOR cycle clearly
- Enforces writing tests BEFORE implementation code
- Suggests testing edge cases (null inputs, empty values, error paths)
- Advises against testing implementation details
- Promotes mocking for external dependencies

---

## Planning Agents

### `@prometheus-lite` — User-selected model
> Strategic planner; creates plans in `.agents/plans/` (never writes code)

**Test prompt:**
```
I want to add a new subagent called `summarizer` to this OpenCode config. Its job is to summarise long agent outputs into 3-5 bullet points. It should use GLM 4.7 and be hidden. Create a work plan for adding it — don't implement anything yet.
```

**What to look for:**
- Enters interview mode and asks at least one clarifying question before planning
- Calls `@metis` for gap analysis before generating the plan
- Produces a plan file at `.agents/plans/<name>.md`
- Plan includes: objective, deliverables, tasks with file paths, verification strategy
- Does NOT write any code or edit `opencode.json`
- Tells user to run `/execute-plan` or `/start-work` when ready

---

### `@metis` — GLM 4.7
> Pre-planning consultant; intent classification and gap analysis (read-only)

**Test prompt:**
```
Analyse this request before planning begins: "I want to replace the executor agent's model with Claude Sonnet 4.6 and update all documentation." Classify the intent type, identify hidden risks or ambiguities, and list the files that would need to change. Do not create a plan — just the analysis.
```

**What to look for:**
- Classifies intent correctly (Refactoring / Mid-sized Task)
- Identifies at least these files: `opencode.json`, `AGENTS.md`, `README.md`, `skills/team-agents/SKILL.md`, `docs/guides/model-management.md`
- Flags risks: description strings mentioning the old model name, fallback chain implications
- Does NOT modify any files (read-only)
- Output is actionable analysis feeding into a planner, not a full plan

---

### `@momus` — GLM 4.7
> Plan reviewer; verifies executable plans and valid file references (read-only)

**Test prompt:**
```
Review the most recent plan file in .agents/plans/. Verify: (1) all referenced files actually exist in the repo, (2) each task has enough context to start work, (3) there are no contradictions. Report any blocking issues only — do not nitpick style or approach.
```

**What to look for:**
- Reads the actual plan file from `.agents/plans/`
- Checks file references exist (uses file system tools)
- Applies approval bias — only flags genuine blockers, not minor gaps
- Returns APPROVED or NEEDS REVISION with specific blocking issues listed
- Does NOT modify the plan file
- Does NOT question the approach or architecture

---

## Orchestrator

### `@orchestrator` — User-selected model
> Token-efficient conductor — PURE DISPATCHER (never does work directly)

**Test prompt:**
```
Orchestrate the following task: audit all agent description fields in opencode.json and check that each one accurately reflects the agent's actual model and role as defined in AGENTS.md. Report any mismatches.
```

**What to look for:**
- Starts response with `[ORCHESTRATOR]`
- Does NOT read files directly — dispatches `@explore` or `@general` to do the reading
- Dispatches `@metis` first for intent analysis (Iron Law step 1)
- Creates a plan via `@prometheus-lite` (step 2)
- Asks for user **GO** before executing (step 3)
- Synthesises results from subagents rather than doing work itself
- Never uses Read, Write, Edit, or Bash tools directly

---

## Quick Reference: All Agents at a Glance

| Agent | Model | Test Focus |
|-------|-------|-----------|
| `explore` | Claude Haiku 4.5 | Repo structure mapping |
| `explore-fallback` | MiniMax M2.5 Free | Connectivity / dir listing |
| `general` | GLM 4.7 | Multi-file code comprehension |
| `librarian` | GLM 4.7 | External docs research with sources |
| `librarian-fallback` | Claude Haiku 4.5 | Connectivity / npm lookup |
| `transform` | GLM 4.7 | Mechanical text substitution (no logic) |
| `validator` | GPT-5 Nano | Schema validation, pass/fail verdict |
| `executor` | GLM 4.7 | File edit + JSON validation |
| `executor-fallback` | Claude Haiku 4.5 | Connectivity / file write |
| `code-reviewer` | GLM 4.7 | Security/quality compliance with verdicts |
| `architect` | GLM 4.7 | System design tradeoffs, ADRs |
| `build-error-resolver` | GLM 4.7 | Minimal-diff build fixing |
| `refactor-cleaner` | GLM 4.7 | Safe dead-code categorization |
| `doc-updater` | Claude Haiku 4.5 | Codemap generation |
| `tdd-guide` | GLM 4.7 | Red-Green test guidance |
| `prometheus-lite` | User-selected | Interview → plan file (no code) |
| `metis` | GLM 4.7 | Intent classification + gap analysis |
| `momus` | GLM 4.7 | Plan executability review |
| `orchestrator` | User-selected | Pure dispatch, never direct work |
