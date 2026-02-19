---
name: team-agents
description: "Use when receiving any task that involves sub-tasks like file reading, code comprehension, searching, or simple code generation - delegates micro-work to specialized models based on task type"
---

# Multi-Agent Coding Architecture

## 1. Available Models

The orchestrator uses the currently selected model for planning and orchestration tasks. It has access to the following models for dispatching subtasks. Each model has a dedicated role and a specific fallback chain. The final fallback for every role is **Claude Opus 4.6**.

### Priority Order

```
1. FREE MODELS FIRST      → Always try OpenCode Zen free models
2. CLAUDE SONNET 4.6       → General-purpose workhorse for real coding work
3. Z.AI MODELS (GLM 4.7)  → Extra capacity / fallback when free models fail and Sonnet isn't needed
4. CLAUDE OPUS 4.6         → Final authority, security, complex logic — last resort
```

### Quick Reference

| Priority | Model | ID | Provider | Cost | Context | Speed | Role |
|----------|-------|-----|----------|------|---------|-------|------|
| 1st | GLM 5 Free | `opencode/glm-5-free` | OpenCode Zen | Free | 128K | Very fast | File Explorer |
| 1st | Kimi K2.5 Free | `opencode/kimi-k2.5-free` | OpenCode Zen | Free | 128K | Fast | Code Comprehension |
| 1st | MiniMax M2.5 Free | `opencode/minimax-m2.5-free` | OpenCode Zen | Free | 128K | Fast | Lightweight Transform |
| 1st | Big Pickle | `opencode/big-pickle` | OpenCode Zen | Free | 128K | Fast | Pattern Analysis |
| 1st | GPT-5 Nano | `opencode/gpt-5-nano` | OpenCode Zen | Free | 400K | Very fast | Validation |
| 2nd | Claude Sonnet 4.6 | `anthropic/claude-sonnet-4-6` | Anthropic | Paid | 200K–1M | Fast | General Purpose (features, tests, review, refactoring) |
| 3rd | GLM 4.7 Flash | `zai-coding-plan/glm-4.7-flash` | Z.AI Coding Plan | Paid | 128K | Fast | Extra: fallback exploration |
| 3rd | GLM 4.7 FlashX | `zai-coding-plan/glm-4.7-flashx` | Z.AI Coding Plan | Paid | 128K | Moderate | Extra: fallback deep analysis |
| 3rd | GLM 4.7 | `zai-coding-plan/glm-4.7` | Z.AI Coding Plan | Paid | 128K | Moderate | Extra: fallback code execution |
| 4th | Claude Opus 4.6 | `anthropic/claude-opus-4-6` | Anthropic | Premium | 200K–1M | Moderate | Final Authority / Security / Complex Logic |

---

## 2. Model Documentation

Each model below is documented with its role, strengths, prompting guide, anti-patterns, and fallback chain. The orchestrator identifies the task type and routes directly to the specialist.

---

### 2.1 GLM 5 Free — File Explorer

**Role:** Primary file reader and codebase navigator.
**ID:** `opencode/glm-5-free` · **Subagent type:** `explore` · **Temperature:** 0.4

**Capabilities:**
- Read single files and return contents accurately
- Grep/search for patterns across directories
- List directory structures and file trees
- Check file/function existence
- Extract specific sections from known files
- High-volume parallel reads (fan-out 5–10 files simultaneously)

**How to use this model well:**
- Give explicit file paths — never ask it to "find" things without a starting directory
- One clear deliverable per prompt: "Read this file and list all exports"
- Keep prompts short and direct — best with simple, unambiguous instructions
- Ideal for fan-out: dispatch 5–10 GLM 5 agents reading different files in parallel
- Use for the "gather raw data" phase before sending results to comprehension models

**What to avoid:**
- Don't ask it to reason about code logic — it reads, it doesn't think
- Don't send multi-step reasoning tasks — it will hallucinate conclusions
- Don't ask it to generate or modify code
- Don't rely on it for understanding relationships between files

**Prompt template:**
```
Read the file at {path}. Return its contents.
List all exported functions with their line numbers.

Return as JSON:
{
  "file": "",
  "exports": [{"name": "", "line": 0}],
  "confidence": 0.0
}
```

**Fallback chain:** GPT-5 Nano → GLM 4.7 Flash (extra) → Claude Opus 4.6

---

### 2.2 Kimi K2.5 Free — Code Comprehension

**Role:** Primary code reader and understanding engine. Reads code and explains what it does, how modules connect, and where important logic lives.
**ID:** `opencode/kimi-k2.5-free` · **Subagent type:** `explore` · **Temperature:** 0.4

**Capabilities:**
- Understand how a module works and summarize its purpose
- Trace data flow across multiple files
- Build dependency maps (what imports what, what calls what)
- Identify entry points and public API surfaces
- Search + comprehend results across a codebase
- Agent swarm tasks — works well dispatched in parallel for competing hypotheses
- Visual coding context understanding

**How to use this model well:**
- Provide all relevant file paths upfront — it handles 3–8 files in one prompt well
- Ask it to explain relationships: "How does module A call module B?"
- Use for "understand before implementing" phases — dispatch before code generation
- For debugging, dispatch multiple Kimi agents with different theories in parallel (competing hypotheses)
- Give clear boundaries: "Only analyze files in src/auth/"
- It excels when you ask specific questions rather than open-ended exploration

**What to avoid:**
- Don't ask it to write production code — it understands, it doesn't generate well
- Don't use for simple file reads (use GLM 5 Free — it's faster for that)
- Don't ask it to make modifications or produce patch diffs
- Don't send vague prompts like "tell me about the codebase" — scope it down

**Prompt template:**
```
Analyze the following files: {file_list}

Explain:
1. What each file's primary responsibility is
2. How they depend on each other (imports, calls)
3. Where the main entry point is
4. Any patterns or issues you notice

Return as JSON:
{
  "files_analyzed": [],
  "dependencies": {},
  "entry_points": [],
  "observations": [],
  "confidence": 0.0
}
```

**Fallback chain:** Claude Sonnet 4.6 → GLM 4.7 FlashX (extra) → Claude Opus 4.6

---

### 2.3 MiniMax M2.5 Free — Lightweight Transform

**Role:** Mechanical code transformer. Handles renames, formatting, simple refactors, and boilerplate generation without changing logic.
**ID:** `opencode/minimax-m2.5-free` · **Subagent type:** `general` · **Temperature:** 0.2

**Capabilities:**
- Rename variables/functions across files consistently
- Reformat code to match style guidelines
- Convert between patterns (e.g., callbacks → promises, CJS → ESM)
- Generate boilerplate and stubs from specifications
- Simple refactors: extract function, inline variable, reorganize imports
- Multilingual coding — trained on 10+ languages (Go, C, C++, TypeScript, Rust, Kotlin, Python, Java, JS, PHP, Lua, Dart, Ruby)
- SOTA-level coding performance (80.2% SWE-Bench Verified) for a free model
- Thinks architecturally — decomposes tasks before executing, writes specs before code

**How to use this model well:**
- Be extremely specific about what to change and what NOT to change
- Provide before/after examples when possible
- For renames, list every file that needs the change
- State explicitly: "Do not change any logic, conditionals, or error handling"
- Let it decompose larger transforms into steps — it plans naturally
- It's surprisingly capable for a free model — trust it for mechanical work
- Great for generating boilerplate: "Generate a React component stub matching this pattern"

**What to avoid:**
- Don't let it touch logic (conditionals, loops, error handling) — escalate to Code Generation role
- Don't use for security-sensitive code modifications
- Don't trust it for async/concurrency changes
- Don't use it for complex multi-step reasoning that requires deep understanding

**Prompt template:**
```
In the following files: {file_list}

Rename all occurrences of `{old_name}` to `{new_name}`.

Rules:
- Only rename the identifier, do not change any logic
- Update imports, exports, and references
- Preserve all formatting and comments

Return as JSON:
{
  "patch_diff": "...",
  "changes": ["description of each change"],
  "files_modified": [],
  "confidence": 0.0
}
```

**Fallback chain:** Claude Sonnet 4.6 → GLM 4.7 (extra) → Claude Opus 4.6

---

### 2.4 Big Pickle — Pattern Analysis

**Role:** Codebase-wide pattern detector and summarizer. Scans large surfaces for recurring patterns, anti-patterns, and structural trends.
**ID:** `opencode/big-pickle` · **Subagent type:** `explore` · **Temperature:** 0.4

**Capabilities:**
- Detect repeated patterns across a codebase (e.g., "all API routes follow X pattern")
- Summarize module purposes across many files quickly
- Find anti-patterns and inconsistencies
- Identify deprecated API usages across modules
- Aggregate findings from multiple directories into a unified view
- Breadth over depth — scanning many files, not deep-diving one

**How to use this model well:**
- Give it a clear pattern to look for: "Find all files that use raw SQL queries"
- Use in swarm mode — dispatch one Big Pickle per module/directory
- Ask for structured categorization, not free-text analysis
- Best for the "survey" phase — get a broad picture before deep-diving specific areas
- Combine with a validator — its findings should be verified before acting on them

**What to avoid:**
- Don't ask for deep code comprehension (use Kimi K2.5 for that)
- Don't ask it to generate or modify code
- Don't use for precision tasks where false positives matter — always validate findings
- Don't use for security audits — it finds patterns, not vulnerabilities

**Prompt template:**
```
Scan all files in {directory}.

Find all occurrences of {pattern_description}.
Categorize each finding by: file path, line number, severity, and context.

Return as JSON:
{
  "findings": [{"file": "", "line": 0, "category": "", "context": ""}],
  "summary": "",
  "total_files_scanned": 0,
  "confidence": 0.0
}
```

**Fallback chain:** Kimi K2.5 Free → GLM 4.7 FlashX (extra) → Claude Opus 4.6

---

### 2.5 GPT-5 Nano — Validation

**Role:** Output validator and format checker. Verifies that other models' outputs are correct, complete, and properly structured.
**ID:** `opencode/gpt-5-nano` · **Subagent type:** `explore` · **Temperature:** 0.2

**Capabilities:**
- Validate JSON structure and schema compliance
- Check completeness — did the output cover all requested items?
- Detect hallucinated imports or dependencies
- Verify patch consistency (files_modified matches actual changes)
- Format validation and structural checks
- Massive 400K context window — can validate very large outputs
- Structured output mode — excels at returning well-formed JSON
- Fastest GPT-5 variant — $0.05/$0.40 per MTok (input/output)

**How to use this model well:**
- Give it the original task description AND the output to validate — it needs both
- Provide a clear checklist of what "valid" means for this specific output
- Ask for binary pass/fail plus specific issues found
- Use structured output mode for consistent validation results
- Dispatch it automatically after every code generation task
- Its 400K context means it can validate outputs from models with smaller contexts

**What to avoid:**
- Don't use for deep code reasoning or correctness analysis — it checks structure, not logic
- Don't ask it to fix issues it finds — it validates, it doesn't implement
- Don't rely on it alone for security validation (always use Claude Opus 4.6 for security)
- Don't ask it to generate code

**Prompt template:**
```
Validate the following output against the original task.

Original task: {task_description}
Output to validate: {agent_output}

Check for:
1. Completeness — does the output address all parts of the task?
2. JSON validity — is the output properly structured?
3. Hallucinations — any imports, files, or dependencies that don't exist?
4. Consistency — does files_modified match the actual patch_diff?

Return as JSON:
{
  "is_valid": true,
  "issues_found": [],
  "missing_elements": [],
  "requires_escalation": false,
  "confidence": 0.0
}
```

**Fallback chain:** Claude Sonnet 4.6 → GLM 4.7 Flash (extra) → Claude Opus 4.6

---

### 2.6 GLM 4.7 Flash — Extra: Fallback Explorer

**Role:** Extra capacity explorer. **Not a primary model.** Only used when free models (GLM 5 Free, GPT-5 Nano) fail at exploration tasks and the task doesn't warrant Sonnet 4.6.
**ID:** `zai-coding-plan/glm-4.7-flash` · **Subagent type:** `explore` · **Temperature:** 0.4

**Capabilities:**
- Everything GLM 5 Free does, but with higher accuracy and light reasoning
- Multi-file search with basic reasoning about results
- Dependency tracing when the structure is straightforward
- Quick re-validation when GPT-5 Nano's output needs a second check

**When to use (fallback only):**
- A free model failed at an exploration task and the task is too simple for Sonnet
- GPT-5 Nano validation was inconclusive and you need a quick second opinion
- You need slightly better reasoning than free models but don't need full Sonnet intelligence

**What to avoid:**
- Don't use as first choice — always try free models first
- Don't use for code generation — use Claude Sonnet 4.6
- Don't use for deep multi-file analysis — use Sonnet 4.6 or Opus

**Fallback chain:** Claude Sonnet 4.6 → Claude Opus 4.6

---

### 2.7 GLM 4.7 FlashX — Extra: Fallback Deep Analysis

**Role:** Extra capacity deep analyzer. **Not a primary model.** Only used as a fallback when Kimi K2.5 Free fails at comprehension and the task doesn't require Sonnet-level intelligence.
**ID:** `zai-coding-plan/glm-4.7-flashx` · **Subagent type:** `explore` · **Temperature:** 0.3

**Capabilities:**
- Multi-file deep comprehension (5–15 files)
- Architecture analysis — how modules interact, data flow, system boundaries
- Impact analysis — "if I change this, what breaks?"
- Complex dependency tracing across layers

**When to use (fallback only):**
- Kimi K2.5 Free failed at a comprehension task
- Big Pickle failed at pattern analysis and you need a second pass
- The task needs more depth than free models but is too narrow for Sonnet

**What to avoid:**
- Don't use as first choice — try Kimi K2.5 Free first
- Don't ask it to generate code — it analyzes only
- Don't use for security analysis (use Claude Opus 4.6)

**Prompt template:**
```
Analyze the architecture of {module/feature}.

Files to examine: {file_list}

Determine:
1. How the components interact (call graph, data flow)
2. What the public API surface is
3. What would break if {proposed_change} were made
4. What files would need to change for {proposed_change}

Return as JSON:
{
  "architecture_summary": "",
  "component_interactions": [],
  "public_api": [],
  "impact_analysis": {"files_affected": [], "risk_areas": []},
  "confidence": 0.0
}
```

**Fallback chain:** Claude Sonnet 4.6 → Claude Opus 4.6

---

### 2.8 GLM 4.7 — Extra: Fallback Code Executor

**Role:** Extra capacity code executor. **Not a primary model.** Only used when MiniMax M2.5 Free fails at a transform/boilerplate task and the task is too small to justify Sonnet 4.6.
**ID:** `zai-coding-plan/glm-4.7` · **Subagent type:** `general` · **Temperature:** 0.2

**Capabilities:**
- Execute well-defined, focused code changes
- Apply patches and make targeted edits to files
- Run commands and report results
- Write single functions or small code units from clear specs
- Follow explicit instructions with high reliability
- 128K context window

**When to use (fallback only):**
- MiniMax M2.5 Free failed at a lightweight transform
- You have a very precise, pre-digested microtask that doesn't need Sonnet's intelligence
- The task is a simple, mechanical code change (1–2 files) where Sonnet would be overkill

**What to avoid:**
- Don't use as first choice — try free models first, then Sonnet 4.6
- Don't use for tasks requiring reasoning or architectural judgment — use Sonnet 4.6
- Don't use for security-sensitive code — use Claude Opus 4.6
- Don't use for async/concurrency logic — use Sonnet 4.6 or Opus
- Don't ask it to modify more than 3 files at once — use Sonnet 4.6

**Prompt template:**
```
Execute the following task: {precise_task_description}

Context from prior analysis:
{explorer_output}

Files to modify: {file_list}
Project conventions: {conventions}

Rules:
- Follow existing patterns in the codebase
- No hallucinated imports — only use packages in package.json
- Declare all files_modified

Return as JSON:
{
  "summary": "",
  "patch_diff": "...",
  "files_modified": [],
  "confidence": 0.0
}
```

**Fallback chain:** Claude Sonnet 4.6 → Claude Opus 4.6

---

### 2.9 Claude Sonnet 4.6 — General Purpose

**Role:** The general-purpose workhorse. Handles feature implementation, test writing, code review, standard refactoring, and any task that needs both speed and intelligence. The default choice for most coding work that free models can't handle.
**ID:** `anthropic/claude-sonnet-4-6` · **Subagent type:** `general` · **Temperature:** 0.2 (code gen), 0.3 (tests), 0.4 (analysis)

**Capabilities:**
- Feature implementation from specifications — full functions, modules, API endpoints
- Writing comprehensive unit tests and integration tests
- Code review against standards and best practices
- Standard refactoring that involves logic changes
- Multi-file coordinated changes (up to 5 files comfortably)
- Debugging with moderate reasoning chains
- Extended thinking for non-trivial problems
- Adaptive thinking — adjusts reasoning depth to problem complexity
- 200K–1M context window (1M with beta header), 64K max output
- Training data cutoff: Jan 2026 — the most current knowledge of any model in the system
- Fast latency — significantly faster than Opus
- $3/$15 per MTok — 40% cheaper than Opus

**How to use this model well:**
- Use it as the primary model for all standard feature work, test generation, and code review
- Provide context from explorer/comprehension agents — it works best with pre-gathered context
- Include the project's coding conventions, test framework, and lint rules
- Give explicit file paths and clear specifications
- Include existing code patterns as examples: "Follow the pattern in {existing_file}"
- Enable extended thinking for problems that need step-by-step reasoning
- Use for code review: give it the original plan + implementation and ask it to review
- Use for test generation: provide the implementation + test framework patterns

**What to avoid:**
- Don't use for security audits or vulnerability analysis — always use Claude Opus 4.6
- Don't use for multi-file changes >5 files — escalate to Opus
- Don't use for async/concurrency-heavy logic where correctness is critical — use Opus
- Don't use for simple file reads or searches (use free models)
- Don't use for simple renames or formatting (use MiniMax M2.5 Free)

**Prompt template (feature implementation):**
```
Implement the following feature: {feature_description}

Context from prior analysis:
{explorer_output}

Files to modify: {file_list}
Project conventions: {conventions}
Test framework: {test_framework}

Rules:
- Follow existing patterns in the codebase
- No hallucinated imports — only use packages that exist in package.json
- Handle edge cases: {edge_cases}
- Write defensive code: null checks, early returns, error handling
- Declare all files_modified

Return as JSON:
{
  "summary": "",
  "patch_diff": "...",
  "files_modified": [],
  "edge_cases_considered": [],
  "tests_needed": [],
  "confidence": 0.0,
  "risk_flags": []
}
```

**Prompt template (code review):**
```
Review the following implementation against the original requirements.

Original task: {task_description}
Implementation: {code_or_diff}
Project conventions: {conventions}

Assess:
1. Does the implementation satisfy all requirements?
2. Are there bugs, edge cases, or logic errors?
3. Does it follow project conventions and patterns?
4. Are there any performance concerns?
5. Is error handling adequate?

Return as JSON:
{
  "approved": true,
  "issues": [{"severity": "critical|major|minor|suggestion", "location": "", "description": "", "fix": ""}],
  "confidence": 0.0
}
```

**Prompt template (test generation):**
```
Write tests for the following implementation: {implementation_description}

Code to test: {code}
Test framework: {test_framework}
Existing test patterns: {example_test}

Cover:
- Happy path for each public function
- Edge cases: {edge_cases}
- Error paths and error handling
- Boundary conditions

Return as JSON:
{
  "test_files": [{"path": "", "content": ""}],
  "coverage_targets": [],
  "confidence": 0.0
}
```

**Fallback chain:** Claude Opus 4.6

---

### 2.10 Claude Opus 4.6 — Final Authority / Security / Complex Logic

**Role:** The final fallback for everything, and the primary model for security, complex reasoning, and architectural decisions. Never skipped for security tasks. No model overrides its judgment.
**ID:** `anthropic/claude-opus-4-6` · **Subagent type:** `powerful-fallback` · **Temperature:** 0.1 (security), 0.2 (code gen), 0.3 (analysis)

**Capabilities:**
- Security audits and vulnerability analysis — XSS, SQL injection, auth bypass, CSRF, SSRF
- Complex async/concurrency logic where correctness is critical
- Multi-file changes spanning 5+ files with coordination
- Architectural decisions and system design
- Deep debugging requiring long reasoning chains (10+ steps)
- Extended thinking for problems that need thorough step-by-step analysis
- Final validation when other validators fail
- 200K–1M context window (1M with beta header), 128K max output — largest output of any model
- Most intelligent model in the system — top-tier reasoning, coding, and analysis
- $5/$25 per MTok — use when the task justifies the cost

**How to use this model well:**
- Provide full context — it can handle massive inputs with its 200K–1M context
- For security: be explicit about what to check (XSS, SQL injection, auth bypass, etc.)
- Enable extended thinking for complex architectural decisions
- Use as the final judge — provide the original task + all prior agent outputs
- For debugging, give the full error trace, relevant code, and what's been tried already
- Use for any task where prior models reported low confidence (<0.65)
- Use for multi-file changes >5 files where coordination matters
- Use for auth/crypto/authorization logic — no exceptions

**What to avoid:**
- Don't use for simple file reads or searches — it's expensive
- Don't use as first choice for standard feature implementation (use Sonnet 4.6 first)
- Don't waste it on formatting, renames, or boilerplate (use MiniMax M2.5 Free)
- Don't skip it for security reviews — this is non-negotiable

**Prompt template (security audit):**
```
Perform a security audit on the following code.

Files: {file_list}
Code context: {code}

Check for:
1. Injection vulnerabilities (SQL, XSS, command injection)
2. Authentication/authorization bypass
3. Insecure cryptographic practices
4. Input validation gaps
5. Sensitive data exposure
6. CSRF, SSRF, path traversal

Return as JSON:
{
  "vulnerabilities": [{"type": "", "location": "", "severity": "critical|high|medium|low", "description": "", "fix": ""}],
  "severity_summary": {"critical": 0, "high": 0, "medium": 0, "low": 0},
  "overall_risk": "",
  "confidence": 0.0
}
```

**Prompt template (final authority validation):**
```
You are the final authority. Validate the following work.

Original task: {task_description}
Agent outputs: {all_agent_outputs}

Assess:
1. Does the implementation fully satisfy the task?
2. Are there any bugs, edge cases, or logic errors?
3. Are there hallucinated imports or dependencies?
4. Is the code secure?
5. Would you approve this for production?

Return as JSON:
{
  "approved": true,
  "issues": [],
  "severity": "none|minor|major|critical",
  "confidence": 0.0
}
```

**Fallback chain:** None — this IS the final fallback.

---

## 3. Role-Based Routing Map

### Agent Name Mapping

These are the actual `subagent_type` values to use when dispatching via the Task tool:

| Abstract Role | subagent_type | Model | Configured In |
|---|---|---|---|
| File Explorer | `explore` | opencode/glm-5-free | opencode.json |
| Code Comprehension | `general` | opencode/kimi-k2.5-free | opencode.json |
| Lightweight Transform | `transform` | opencode/minimax-m2.5-free | opencode.json |
| Output Validator | `validator` | opencode/gpt-5-nano | opencode.json |
| Code Executor | `executor` | zai-coding-plan/glm-4.7 | opencode.json |
| Code Reviewer | `code-reviewer` | zai-coding-plan/glm-4.7 | opencode.json |
| Final Authority | (orchestrator routes to Opus for security/complex) | anthropic/claude-opus-4-6 | per team-agents rules |

> **Important:** Always use the `subagent_type` column value when dispatching tasks. These map directly to agent definitions in `opencode.json`. If you add or rename agents, update this table.

### Routing Logic

The orchestrator identifies the task type and routes to the right model following the priority order: **Free first → Sonnet 4.6 → Z.AI extras → Opus 4.6**.

```
┌─────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                          │
│        Identifies task type → routes by priority            │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌─────────────┐
   │ Simple task? │ │Real work?│ │ Security /  │
   │ Read/search/ │ │Code gen/ │ │ Complex /   │
   │ comprehend/  │ │tests/    │ │ Async /     │
   │ transform/   │ │review/   │ │ Multi-file  │
   │ validate/    │ │refactor/ │ │ >5 / Auth   │
   │ pattern scan │ │debug     │ │             │
   └──────┬───────┘ └────┬─────┘ └──────┬──────┘
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌─────────────┐
   │ FREE MODELS │ │ CLAUDE   │ │ CLAUDE      │
   │ (1st pick)  │ │ SONNET   │ │ OPUS 4.6    │
   │             │ │ 4.6      │ │ (direct)    │
   │ GLM 5 Free  │ │ (2nd)    │ │             │
   │ Kimi K2.5   │ │          │ │ No fallback │
   │ MiniMax M2.5│ └────┬─────┘ │ needed      │
   │ Big Pickle  │      │       └─────────────┘
   │ GPT-5 Nano  │      │              ▲
   └──────┬───────┘      │              │
          │ fail         │ fail         │
          ▼              ▼              │
   ┌─────────────┐ ┌──────────┐        │
   │ Z.AI EXTRAS │ │ CLAUDE   │        │
   │ (3rd, only  │ │ OPUS 4.6 │────────┘
   │ if needed)  │ │ (final)  │
   │             │ └──────────┘
   │ GLM 4.7 Fl  │      ▲
   │ GLM 4.7 FlX │      │
   │ GLM 4.7     │      │
   └──────┬───────┘      │
          │ fail         │
          └──────────────┘
```

### Task-Type Detection Rules

| Task Type | Primary Model | Priority | Detection Signals |
|-----------|--------------|----------|-------------------|
| **file_read** | GLM 5 Free | 1st (free) | "read", "cat", "show me", single file path, "list files" |
| **search** | GLM 5 Free | 1st (free) | "grep", "find", "search for", pattern + directory |
| **comprehend** | Kimi K2.5 Free | 1st (free) | "explain", "how does X work", "analyze", "understand", multiple files |
| **transform** | MiniMax M2.5 Free | 1st (free) | "rename", "reformat", "convert", "refactor" (no logic change) |
| **pattern_scan** | Big Pickle | 1st (free) | "find all", "scan for", "audit" (non-security), bulk analysis |
| **validate** | GPT-5 Nano | 1st (free) | "check", "verify", "validate", after another agent's output |
| **generate_code** | Claude Sonnet 4.6 | 2nd (paid) | "implement", "write", "create", "add feature", "build" |
| **write_tests** | Claude Sonnet 4.6 | 2nd (paid) | "write tests", "add test coverage", "test this" |
| **code_review** | Claude Sonnet 4.6 | 2nd (paid) | "review", "check quality", "does this follow conventions" |
| **refactor** | Claude Sonnet 4.6 | 2nd (paid) | "refactor" (with logic changes), "restructure", "redesign" |
| **deep_analyze** | Claude Sonnet 4.6 | 2nd (paid) | "architecture", "impact analysis", "how do these modules interact" |
| **security** | Claude Opus 4.6 | 4th (direct) | "security", "vulnerability", "auth", "crypto", "injection", "XSS" |
| **complex_logic** | Claude Opus 4.6 | 4th (direct) | async/await, concurrency, multi-file >5, confidence <0.65 |
| **architecture** | Claude Opus 4.6 | 4th (direct) | "system design", "architecture", breaking changes, >5 files |

**Note:** Z.AI models (GLM 4.7 Flash/FlashX/4.7) are **never primary routes**. They only appear in fallback chains when free models fail and the task is too small for Sonnet.

---

## 4. Fallback Chains

When a model fails, the orchestrator moves to the next model in that role's fallback chain. **Never retry the same model twice.**

| Role | Primary (try first) | Fallback 1 | Fallback 2 (Z.AI extra) | Final Fallback |
|------|---------------------|------------|-------------------------|----------------|
| File Explorer | GLM 5 Free | GPT-5 Nano | GLM 4.7 Flash | Claude Opus 4.6 |
| Code Comprehension | Kimi K2.5 Free | Claude Sonnet 4.6 | GLM 4.7 FlashX | Claude Opus 4.6 |
| Lightweight Transform | MiniMax M2.5 Free | Claude Sonnet 4.6 | GLM 4.7 | Claude Opus 4.6 |
| Pattern Analysis | Big Pickle | Kimi K2.5 Free | GLM 4.7 FlashX | Claude Opus 4.6 |
| Validation | GPT-5 Nano | Claude Sonnet 4.6 | GLM 4.7 Flash | Claude Opus 4.6 |
| Code Generation | Claude Sonnet 4.6 | — | — | Claude Opus 4.6 |
| Test Writing | Claude Sonnet 4.6 | — | — | Claude Opus 4.6 |
| Code Review | Claude Sonnet 4.6 | — | — | Claude Opus 4.6 |
| Refactoring | Claude Sonnet 4.6 | — | — | Claude Opus 4.6 |
| Deep Analysis | Claude Sonnet 4.6 | — | — | Claude Opus 4.6 |
| Security Audit | Claude Opus 4.6 | — | — | — |
| Complex Logic | Claude Opus 4.6 | — | — | — |

**Key principle:** Free → Sonnet → Z.AI extras → Opus. Z.AI models are used **only** when a free model fails and the task is too small to justify Sonnet. For real coding work, go straight from free models to Sonnet 4.6.

### When to Trigger Fallback

- Model returned empty or "I don't know"
- Response is clearly wrong or contradicts known facts
- Response is too vague to be actionable
- Confidence self-reported below 0.50
- Output is malformed JSON or missing required fields
- Model is stuck in a repetition loop
- Provider error, timeout, or rate limit

### When NOT to Trigger Fallback

- Response is slightly imperfect but 80%+ usable — fill gaps yourself
- Minor formatting issues
- Confidence is 0.50–0.65 — accept with manual review first

---

## 5. Overview

You are an **orchestrator** in a role-based, cost-optimized multi-agent coding system. Your job is to:

- **Identify** the type of each subtask
- **Route** it to the specialist model that owns that responsibility
- **Execute** specialists in parallel when tasks are independent
- **Validate** outputs with GPT-5 Nano (or Claude Opus 4.6 for critical outputs)
- **Fallback** through each role's chain when a model fails
- **Enforce** Claude Opus 4.6 as the final authority for security and complex logic

**Core principle:** Free models first, always. Use Claude Sonnet 4.6 for real coding work (features, tests, review, refactoring). Z.AI models (GLM 4.7 family) are extras — only used when free models fail and the task is too small for Sonnet. Claude Opus 4.6 is the final fallback and the only model used for security, complex logic, and architecture.

## 6. When to Use

- Any task involving file reading or codebase exploration
- Code comprehension or summarization sub-tasks
- Search/grep operations across the codebase
- Code generation (boilerplate, stubs, features, tests)
- Multi-step tasks where sub-steps are independent
- Research requiring multiple perspectives or competing hypotheses
- Security audits across modules
- Test generation for existing or new code
- Bulk analysis requiring swarm-mode microtasks

**When NOT to use:**

- Direct conversational questions (no sub-tasks needed)
- Tasks requiring a single complex reasoning step by you alone
- Tasks the user explicitly asks you to do yourself

---

## 7. Confidence System

### Dual-Mode Assessment

**Mode 1 — Model Self-Report:**
Every subagent prompt must include:
```
Return your output as JSON. Include a "confidence" field (0.0 to 1.0) indicating how
confident you are in the correctness and completeness of your output. Be honest —
do not inflate confidence. Consider: Did you find all relevant files? Are there
edge cases you couldn't verify? Did you make any assumptions?
```

**Mode 2 — Orchestrator Assessment:**
You independently assess confidence based on:
- **Completeness:** Did the agent address all parts of the task?
- **Hedging language:** "I think", "probably", "might" = lower confidence
- **Specificity:** Vague answers = lower confidence
- **Consistency:** Does the output match what you know about the codebase?
- **Missing elements:** Skipped files, edge cases, or error handling?

**Resolution rule:** The lower value wins.

### Confidence Caps

| Task Category | Max Confidence |
|--------------|---------------|
| Multi-file modification (>5 files) | 0.75 |
| Async logic change | 0.70 |
| Security logic change | 0.65 |
| Small/mechanical transform | 0.90 |
| Standard feature implementation | 0.85 |
| Test generation | 0.85 |
| File read / search | 0.95 |

### Confidence Actions

| Confidence | Action |
|-----------|--------|
| >= 0.80 | Accept result |
| 0.65–0.79 | Accept with review — verify key aspects yourself |
| 0.50–0.64 | Retry once with next model in fallback chain |
| < 0.50 | Reject — escalate to Claude Opus 4.6 immediately |

---

## 8. Orchestration Pattern

### Step-by-Step

```
1. Receive task from user
2. Decompose into subtasks with clear, independent deliverables
3. Classify each subtask by task type (Section 3)
4. Route each subtask to its specialist model
5. Dispatch independent subtasks in parallel
   a. Write precise, self-contained prompts (Section 10)
   b. Include JSON output format with confidence field
   c. Include model-specific guidance from Section 2
6. Evaluate results with confidence system (Section 7)
7. On failure: move to next model in fallback chain (Section 4)
8. Run validator (GPT-5 Nano) on critical outputs
9. For security/async/complex: always route to Claude Opus 4.6
10. Synthesize into final coherent response
```

### Task Sizing

| Size | Problem | Fix |
|------|---------|-----|
| Too small | Coordination overhead exceeds benefit | Combine related micro-tasks into one agent |
| Too large | Agent works too long, higher failure risk | Break into 2-3 focused subtasks |
| Just right | Clear deliverable, can complete independently | Aim for this |

**Rule of thumb:** 3–6 subtasks per complex user request.

### Dependency DAG

Before dispatching, identify which tasks depend on others:

```
T1 (GLM 5: read auth files) ------+
T2 (Kimi K2.5: understand flow) --+--> T4 (Sonnet 4.6: implement feature)
T3 (GLM 5: read API files) -------+            |
                                         T5 (Sonnet 4.6: write tests)
                                                |
                                         T6 (Opus 4.6: security audit)
```

- T1, T2, T3 are **parallel** (no dependencies)
- T4 depends on T1, T2, T3 (must wait)
- T5 depends on T4
- T6 depends on T4

**Dispatch T1, T2, T3 simultaneously. Wait. Then T4. Then T5 and T6 in parallel.**

---

## 9. Swarm Mode

For bulk analysis requiring 10+ independent microtasks.

### When to Use

- Analyzing 10+ files for a pattern
- Large-scale codebase audit
- Finding all usages of a deprecated API
- Bulk refactor analysis across many modules

### How It Works

1. **Generate microtasks** — 10–100 independent, identically-structured tasks
2. **Dispatch in parallel** — use specialist models (Big Pickle for patterns, GLM 5 Free for reads)
3. **Aggregate results** — combine all outputs into a unified dataset
4. **Validate** — dispatch GPT-5 Nano or Claude Opus 4.6 to validate the aggregation

### Example

```
Task: "Find all files with SQL injection vulnerabilities"

Microtasks (dispatched in parallel):
  Agent 1 (Big Pickle): Scan src/api/users/ for raw SQL patterns
  Agent 2 (Big Pickle): Scan src/api/orders/ for raw SQL patterns
  Agent 3 (Big Pickle): Scan src/api/products/ for raw SQL patterns
  ... (one per module)

Aggregation: Combine all findings
Validation: Claude Opus 4.6 reviews aggregated findings for accuracy
```

---

## 10. Writing Subagent Prompts

A subagent has NO context about your conversation. Its prompt must be **completely self-contained**.

### Required Elements

1. **State the goal explicitly** — what output do you need?
2. **Provide file paths** — don't make it search for what you already know
3. **Specify JSON output format** — include the expected schema with confidence field
4. **Set boundaries** — "Only look in src/auth/", "Focus on error handling"
5. **Include model-specific guidance** — reference Section 2 for the model you're dispatching to
6. **Hint relevant skills** — tell the subagent which skills to invoke

### Bad vs Good Prompts

```
# Bad prompt
"Look at the auth code and tell me about it"

# Good prompt (for Kimi K2.5 — Code Comprehension)
"Read the files src/auth/login.ts and src/auth/token.ts.
List all public functions with their parameters and return types.
Note any functions that make network calls.
Trace how login() calls into token.ts.

Return as JSON:
{
  "functions": [{"name": "", "params": [], "returns": "", "makes_network_calls": false}],
  "call_graph": {},
  "observations": [],
  "confidence": 0.0
}

Use the systematic-debugging skill if you find issues."
```

---

## 11. Temperature & Determinism

### Temperature by Role

| Model | Role | Temperature | Rationale |
|-------|------|------------|-----------|
| GLM 5 Free | File Explorer | 0.4 | Flexible search strategies |
| Kimi K2.5 Free | Code Comprehension | 0.4 | Flexible understanding |
| MiniMax M2.5 Free | Lightweight Transform | 0.2 | Mechanical precision |
| Big Pickle | Pattern Analysis | 0.4 | Discovery-oriented |
| GPT-5 Nano | Validation | 0.2 | Consistent pass/fail |
| GLM 4.7 Flash | Fast Exploration | 0.4 | Flexible search |
| GLM 4.7 FlashX | Deep Analysis | 0.3 | Balanced precision and insight |
| GLM 4.7 | Code Execution | 0.2 | Precise task execution |
| Claude Sonnet 4.6 | General Purpose | 0.2–0.4 | 0.2 code gen, 0.3 tests, 0.4 analysis |
| Claude Opus 4.6 | Security/Final Authority | 0.1–0.3 | 0.1 security, 0.2 code gen, 0.3 analysis |

### Determinism Rules

All agents must follow these rules (include in prompts for critical tasks):

1. **No free text outside JSON** — structured output only for machine-parseable results
2. **No file modifications without patch_diff** — all changes must be explicit
3. **No hallucinated dependencies** — only import packages that exist in the project
4. **No cross-file changes without listing files_modified** — every touched file must be declared
5. **No acceptance without validator approval** — critical outputs must be validated

---

## 12. Dispatch Strategies

### Independent Exploration

Dispatch multiple specialists to different areas simultaneously:

```
Task: "Understand the authentication flow"

Agent 1 (GLM 5 Free): Read src/auth/ directory, list all files
Agent 2 (Kimi K2.5 Free): Analyze src/auth/login.ts and src/auth/token.ts
Agent 3 (GLM 5 Free): Read package.json for auth-related dependencies
```

### Competing Hypotheses

For debugging, dispatch agents with different theories:

```
Task: "App crashes on login"

Agent 1 (Kimi K2.5): Investigate null pointer in token parsing
Agent 2 (Kimi K2.5): Investigate network timeout issue
Agent 3 (Kimi K2.5): Investigate threading/coroutine scope issue
```

### Explore → Generate → Review Pipeline

The most common multi-agent pipeline (follows priority order):

```
Phase 1 (parallel, FREE):  GLM 5 Free + Kimi K2.5 Free gather context
Phase 2 (SONNET):          Claude Sonnet 4.6 implements the feature
Phase 3 (parallel):        GPT-5 Nano (FREE) validates + Sonnet 4.6 writes tests
Phase 4 (if needed, OPUS): Claude Opus 4.6 security audit
```

Note: Z.AI models don't appear in the standard pipeline. They only activate if a free model fails in Phase 1 or 3.

### Critical Path Thinking

```
Sequential (3 file reads):
  Read A (10s) -> Read B (10s) -> Read C (10s) = 30s

Parallel (3 file reads):
  Read A (10s) -+
  Read B (10s) -+- = 10s
  Read C (10s) -+
```

**Minimize the critical path. Dispatch independent work in parallel.**

---

## 13. Failure Recovery

### Handling Stuck / Looping Agents

**Detection signs:**
- Repeated phrases or sentences in the response
- Abnormally long output that is content-free
- Response doesn't address the task at all
- Model says "I'll execute" repeatedly without doing anything

**Recovery:**
1. Discard the output entirely
2. Move to next model in fallback chain immediately
3. If multiple agents get stuck, the prompt is too vague — rewrite before re-dispatching

### Provider Failure Recovery

1. **Single failure:** Retry once
2. **Repeated failure (2+):** Move to fallback chain
3. **All models failing:** Report to user, attempt manual execution for critical subtasks

---

## 14. Quality Gates

Before presenting results to the user, verify:

1. **Completeness** — Did all dispatched agents return results?
2. **Consistency** — Do results from different agents agree? Flag contradictions.
3. **Accuracy** — Do results make sense given what you know?
4. **Confidence** — Are all confidence scores within acceptable range?
5. **Determinism** — Are all file modifications declared? Any hallucinated imports?
6. **Synthesis** — Have you combined findings into a coherent answer, not just concatenated outputs?

---

## 15. Direct-to-Opus Rules

Some tasks bypass the routing system entirely and go straight to Claude Opus 4.6:

- **Security audit** — always, no exceptions
- **Async/concurrency logic** where correctness is critical
- **Auth/authorization changes** — security-critical
- **Multi-file changes >5 files** — coordination complexity
- **Confidence <0.50 from any model** — immediate escalation
- **Validator returns is_valid: false twice** — final authority needed
- **Complex debugging** requiring 10+ tool calls or extended reasoning
- **Architectural decisions** — system design, breaking changes

**This rule is non-negotiable.** No optimization, cost concern, or time pressure overrides it.

---

## 16. Anti-Patterns

| Anti-Pattern | Symptoms | Fix |
|-------------|----------|-----|
| **Skipping Free Models** | Using Sonnet for file reads or renames, Z.AI for simple lookups | Always try free models first — they're free |
| **Z.AI as Primary** | Routing tasks directly to GLM 4.7 family | Z.AI models are extras/fallback only, not primary routes |
| **Wrong Specialist** | Sending file reads to Sonnet, code gen to GLM 5 | Match task type to model role (Section 3) |
| **Serial Collapse** | Reading files one at a time | Dispatch independent tasks simultaneously |
| **Skipping Fallback** | Retrying the same model that failed | Move to next model in chain immediately |
| **Opus for Everything** | Using Opus for standard features | Use Sonnet 4.6 for general work, Opus for security/complex |
| **No Validation** | Accepting code gen output without checking | Run GPT-5 Nano validator on critical outputs |
| **Context-Free Prompts** | "Look at the code and fix it" | Write self-contained prompts (Section 10) |
| **Skipping Security** | "Sonnet is fine for this auth change" | Security = Opus. Always. |
| **Ignoring Contradictions** | Two agents disagree, picking one randomly | Flag conflict, dispatch tiebreaker |

---

## 17. What to NEVER Delegate

- Final architectural decisions
- Security reviews (final judgment — exploration can be delegated)
- User communication and clarification
- Quality review of subagent outputs
- Confidence assessment and escalation decisions
- Choosing which model to dispatch to

---

## 18. Production Guarantees

This architecture ensures:

- **Free-first routing** — always try free OpenCode Zen models before spending on paid models
- **Role-based routing** — every model has a defined responsibility, no ambiguity
- **Graceful degradation** — every role has a fallback chain ending at Claude Opus 4.6
- **Cost optimization** — free models for reads/comprehension/transforms, Sonnet for real work, Z.AI as extras, Opus only for security/complex
- **General-purpose workhorse** — Claude Sonnet 4.6 handles the bulk of coding work at 40% less than Opus
- **Z.AI as reserve capacity** — GLM 4.7 family available as fallback when free models fail and Sonnet isn't needed
- **Deterministic execution** — structured JSON outputs, no free-text drift
- **Hallucination mitigation** — validator agents, confidence caps, import checking
- **Security-first escalation** — security tasks always route to Opus, no exceptions
- **Parallel scalability** — DAG-based task decomposition, swarm mode for bulk
- **Final authority** — Claude Opus 4.6 ensures correctness when everything else fails
