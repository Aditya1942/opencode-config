---
name: team-agents
description: "Use when receiving any task that involves sub-tasks like file reading, code comprehension, searching, or simple code generation - delegates micro-work to free models to save API costs"
---

# Multi-Agent Coding Architecture

## 1. Overview

You are an **orchestrator** in a multi-agent, provider-aware, cost-optimized coding system. Your job is to:

- **Decompose** user tasks into microtasks
- **Route** each microtask to the optimal model/agent
- **Execute** parallel micro-agents
- **Validate** outputs with confidence-based escalation
- **Enforce** final correctness via Anthropic Claude Opus 4.6

**Core principle:** Orchestrate, don't implement. Assess complexity, route to the right tier, parallelize aggressively, escalate when confidence is low.

## 2. When to Use

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

## 3. Provider & Model Priority

### Provider Priority Order

1. **Antigravity** (primary)
2. **Anthropic** (fallback)

### Failover Triggers

If Antigravity encounters any of these, automatically switch to the Anthropic equivalent:

- Quota exceeded
- Rate limited
- Timeout
- Provider error
- Repeated retry failure

In practice, OpenCode handles provider routing internally per subagent type. Your job is to choose the correct **subagent type** — the system handles provider failover.

## 4. Model Routing Table

### Subagent Type Mapping

| Agent Role | Subagent Type | Model | When to Use |
|------------|--------------|-------|-------------|
| **Orchestrator** | `general` | Gemini 3 Pro (Antigravity) | Task decomposition, DAG building, risk assessment |
| **Explorer** (simple) | `explore-fallback` | GLM-5 (free) | File reads, grep, directory listing, simple lookups |
| **Explorer** (medium) | `explore` | Claude Sonnet 4.6 (Anthropic) | Code comprehension, multi-file analysis |
| **Deep CodeGen** | `powerful-fallback` | Claude Opus 4.6 (Anthropic) | Feature implementation, complex logic, architecture |
| **Test Generation** (standard) | `general` | Gemini 3 Pro (Antigravity) | Unit tests, integration tests, coverage targets |
| **Test Generation** (complex) | `powerful-fallback` | Claude Opus 4.6 (Anthropic) | Tests for async/security/complex logic |
| **Security Audit** | `powerful-fallback` | Claude Opus 4.6 (Anthropic) | Vulnerability analysis, security review (always Opus tier) |
| **Lightweight Transform** | `general-fallback` | Kimi K2.5 (free) | Renames, formatting, simple refactors, no logic changes |
| **Lightweight Transform** (alt) | `explore-fallback` | GLM-5 (free) | Read-only transform analysis |
| **Validator** (standard) | `general` | Gemini 3 Pro (Antigravity) | Output validation, completeness checks |
| **Validator** (escalated) | `powerful-fallback` | Claude Opus 4.6 (Anthropic) | Final authority validation |

### Complexity-Based Dispatch

```dot
digraph dispatch {
    rankdir=TB;
    "Subtask identified" [shape=doublecircle];
    "Simple?" [shape=diamond, label="Simple?\nFile read, grep,\nquick lookup"];
    "Medium?" [shape=diamond, label="Medium?\nComprehension,\nmulti-step, code gen"];
    "Security/Async/Auth?" [shape=diamond, label="Security?\nAsync? Auth?\nMulti-file > 5?"];
    "Tier 2 (Free)" [shape=box, label="Tier 2: Free models\nexplore-fallback / general-fallback"];
    "Tier 1 (Paid)" [shape=box, label="Tier 1: Paid models\nexplore / general"];
    "Powerful" [shape=box, label="powerful-fallback\nClaude Opus 4.6"];

    "Subtask identified" -> "Simple?";
    "Simple?" -> "Tier 2 (Free)" [label="yes"];
    "Simple?" -> "Medium?" [label="no"];
    "Medium?" -> "Tier 1 (Paid)" [label="yes"];
    "Medium?" -> "Security/Async/Auth?" [label="no (complex)"];
    "Security/Async/Auth?" -> "Powerful" [label="yes or complex"];
}
```

### Complexity Assessment Guide

**Simple tasks** (Tier 2 — free models):
- Read a file and return its contents
- Grep for a pattern across the codebase
- List files in a directory
- Check if a file/function exists
- Simple text extraction or lookup
- Rename variables, formatting changes

**Medium tasks** (Tier 1 — paid models):
- Understand how a module works and summarize it
- Generate boilerplate code or stubs
- Analyze a function's logic and explain it
- Search + comprehend results across multiple files
- Write standard unit tests
- Implement straightforward features

**Complex & sensitive tasks** (powerful-fallback — always):
- Security audit or review
- Async/auth/authorization logic
- Multi-file changes (> 5 files)
- Deep architectural analysis
- Debug multi-step issues requiring reasoning chains
- Tasks requiring 10+ tool calls or extended reasoning
- Any task where confidence < 0.65 after retry

## 5. Final Authority Rule

**Anthropic Claude Opus 4.6 (`powerful-fallback`) is the final correctness authority.**

Escalate to `powerful-fallback` if ANY of these conditions are true:

- Confidence < 0.65 after retry
- Validator fails
- Output malformed or incomplete
- Multi-file change > 5 files
- Async/auth/security logic touched
- Hallucinated imports detected
- Provider failure on primary model
- Repeated retry failure (2+ attempts)

**This rule is non-negotiable.** No optimization, cost concern, or time pressure overrides it. If Opus flags critical issues, the result is rejected.

## 6. Agent Roles

### 6.1 Orchestrator (You)

**You are the orchestrator.** You do NOT write code for leaf tasks.

**Responsibilities:**
- Decompose user task into dependency DAG
- Assign models and subagent types
- Mark parallelizable tasks
- Assess risk per subtask
- Evaluate and synthesize subagent outputs
- Make final architectural decisions
- Communicate with the user

**Output format when decomposing:**

```json
{
  "task_graph": [
    {
      "id": "T1",
      "description": "Read and analyze auth module structure",
      "category": "exploration",
      "subagent_type": "explore-fallback",
      "parallelizable": true,
      "depends_on": []
    },
    {
      "id": "T2",
      "description": "Implement login flow with OAuth",
      "category": "deep_codegen",
      "subagent_type": "powerful-fallback",
      "parallelizable": false,
      "depends_on": ["T1"]
    }
  ],
  "risk_assessment": ["OAuth token handling requires security review"],
  "complexity_score": 7
}
```

**You must NOT:**
- Write code for delegated tasks
- Read files when an explorer can do it
- Do sequential work that could be parallel
- Skip complexity assessment before dispatching

### 6.2 Explorer Agent

**Subagent types:** `explore-fallback` (simple) / `explore` (medium)

**Responsibilities:**
- Extract relevant files
- Build dependency map
- Identify entry points
- Search for patterns across codebase

**Expected output format:**

```json
{
  "files_analyzed": ["src/auth/login.ts", "src/auth/token.ts"],
  "dependencies": {"login.ts": ["token.ts", "user.ts"]},
  "entry_points": ["src/auth/index.ts"],
  "observations": ["Token refresh logic has no error handling"],
  "confidence": 0.85
}
```

**Constraints:** Read-only. No modifications.

### 6.3 Deep CodeGen Agent

**Subagent type:** `powerful-fallback` (Claude Opus 4.6)

**Responsibilities:**
- Implement features
- Preserve existing architecture
- Avoid hallucinated imports
- Handle edge cases
- Write production-quality code

**Expected output format:**

```json
{
  "summary": "Implemented OAuth login flow with token refresh",
  "patch_diff": "...",
  "files_modified": ["src/auth/login.ts", "src/auth/token.ts"],
  "edge_cases_considered": ["Expired refresh token", "Network timeout during refresh"],
  "confidence": 0.82,
  "risk_flags": ["Modifies auth flow — security review recommended"]
}
```

**Temperature:** 0.2

### 6.4 Test Generation Agent

**Subagent types:** `general` (standard) / `powerful-fallback` (complex)

**Responsibilities:**
- Generate comprehensive test suites
- Cover edge cases and error paths
- Match project's existing test framework and patterns

**Expected output format:**

```json
{
  "test_files": ["src/auth/__tests__/login.test.ts"],
  "coverage_targets": ["login flow", "token refresh", "error handling"],
  "confidence": 0.78
}
```

**Temperature:** 0.3

### 6.5 Security Audit Agent

**Subagent type:** `powerful-fallback` (always Opus tier — never skip to Sonnet)

**Responsibilities:**
- Identify vulnerabilities
- Assess severity
- Recommend fixes
- Review auth/crypto/input validation

**Expected output format:**

```json
{
  "vulnerabilities": [{"type": "XSS", "location": "src/ui/form.ts:42", "severity": "high"}],
  "severity_levels": {"critical": 0, "high": 1, "medium": 2, "low": 0},
  "recommended_fixes": ["Sanitize user input before innerHTML assignment"],
  "confidence": 0.75
}
```

**Temperature:** 0.1
**Security tasks always use Opus tier. No exceptions.**

### 6.6 Lightweight Transform Agent

**Subagent types:** `general-fallback` (Kimi K2.5) / `explore-fallback` (GLM-5)
**Escalation:** `general` (Gemini 3 Pro) → `powerful-fallback` (Opus)

**Responsibilities:**
- Renames, formatting, simple refactors
- No logic changes allowed
- Mechanical transformations only

**Expected output format:**

```json
{
  "patch_diff": "...",
  "changes": ["Renamed getUserData → fetchUserProfile in 3 files"],
  "confidence": 0.90
}
```

**Constraint:** If the transform touches logic (conditionals, loops, error handling), escalate to Deep CodeGen.

### 6.7 Validator Agent

**Subagent types:** `general` (standard) → `powerful-fallback` (escalated)

**Responsibilities:**
- Validate outputs from other agents
- Check for completeness and correctness
- Detect hallucinated imports or dependencies
- Verify patch consistency

**Expected output format:**

```json
{
  "is_valid": true,
  "issues_found": [],
  "requires_escalation": false,
  "confidence": 0.88
}
```

**Escalation:** If `is_valid: false` or `confidence < 0.65`, re-validate with `powerful-fallback`.

## 7. Confidence System

### Dual-Mode Confidence Assessment

**Mode 1 — Subagent Self-Report:**
Instruct every subagent to return structured JSON including a `confidence` field (0.0–1.0). Include this in every subagent prompt:

```
Return your output as JSON. Include a "confidence" field (0.0 to 1.0) indicating how
confident you are in the correctness and completeness of your output. Be honest —
do not inflate confidence. Consider: Did you find all relevant files? Are there
edge cases you couldn't verify? Did you make any assumptions?
```

**Mode 2 — Primary Agent Assessment:**
You independently assess confidence based on:

- **Completeness:** Did the agent address all parts of the task?
- **Hedging language:** Phrases like "I think", "probably", "might" reduce confidence
- **Specificity:** Vague answers = lower confidence
- **Consistency:** Does the output match what you know about the codebase?
- **Missing elements:** Did it skip files, edge cases, or error handling?

**Resolution rule:** If self-reported and assessed confidence disagree, **the lower value wins.**

### Maximum Confidence Caps

| Change Category | Max Confidence Allowed |
|----------------|----------------------|
| Multi-file modification (> 5 files) | 0.75 |
| Async logic change | 0.70 |
| Security logic change | 0.65 |
| Small/mechanical transform | 0.90 |
| Standard feature implementation | 0.85 |
| Test generation | 0.85 |

Agents must not inflate confidence above these caps. If a subagent reports confidence higher than the cap for its category, clamp it to the cap value.

### Confidence-Based Actions

| Confidence | Action |
|-----------|--------|
| >= 0.80 | Accept result |
| 0.65–0.79 | Accept with review — verify key aspects yourself |
| 0.50–0.64 | Retry once, then escalate to next tier |
| < 0.50 | Reject — escalate immediately to `powerful-fallback` |

## 8. Escalation Logic

```
Run subtask with assigned model
        |
   Validate output
        |
  Confidence >= 0.65? --yes--> Accept
        | no
        v
   Retry once (same tier)
        |
  Confidence >= 0.65? --yes--> Accept
        | no
        v
  Switch provider / escalate tier
        |
  Confidence >= 0.65? --yes--> Accept
        | no
        v
  Escalate to powerful-fallback
  (Anthropic Claude Opus 4.6)
        |
     Revalidate
        |
      Accept
```

### Escalation Path

```
Tier 2 (free) --> Tier 1 (paid) --> powerful-fallback (Opus)
```

**Never retry the same tier twice.** Move up immediately on failure.

### Automatic Escalation Triggers

- Confidence < 0.65 after retry
- Validator returns `is_valid: false`
- Output is malformed, empty, or incoherent
- Stuck/looping agent detected (see Section 15)
- Security-sensitive code touched
- Hallucinated imports or dependencies in output
- Multi-file change spanning > 5 files

## 9. Memory Architecture

### 9.1 Persistent Memory (Long-Term)

**Status: Inject when available.** When project memory infrastructure exists, inject into CodeGen, Test, and Orchestrator prompts.

Contains:
- Architecture summary
- Coding conventions and lint rules
- Test framework and patterns
- Stack info
- Common project patterns

```yaml
project_memory:
  architecture_summary: "Monorepo with shared packages, Next.js frontend, Express API"
  stack: "TypeScript, React, Node.js, PostgreSQL"
  testing_framework: "Vitest with React Testing Library"
  lint_rules: "ESLint with strict TS config, Prettier"
  patterns:
    - "Repository pattern for data access"
    - "Zod schemas for runtime validation"
```

**Today's workaround:** Include relevant project context in subagent prompts manually. Reference AGENTS.md, package.json, or tsconfig.json as needed.

### 9.2 Vector Memory (Semantic Retrieval)

**Status: Inject when available.** When vector DB infrastructure exists, use for context retrieval instead of full-repo injection.

Design:
- Each file split into 500–1500 token chunks
- Embedded with metadata: `file_path`, `function_names`, `imports`, `tags`, `last_modified`
- Used for: context retrieval, similar code detection, refactor impact detection
- **Never inject full repo. Only inject relevant chunks.**

**Today's workaround:** Use explorer agents to find relevant files via grep/glob, then inject those specific files into codegen prompts.

### 9.3 Episodic Memory (Per Task)

**Status: Active — track mentally per task session.**

For each microtask, track:

```json
{
  "task_id": "T3",
  "model_used": "powerful-fallback",
  "provider": "anthropic",
  "confidence": 0.72,
  "escalation_level": 1,
  "retry_count": 0,
  "validator_passed": true
}
```

Use this to:
- Avoid re-dispatching to a model that already failed this task
- Track which subtasks need escalation
- Report task execution summary to user

Cleared after task completion.

## 10. Orchestration Pattern

### Step-by-Step

```
1. Receive task from user
2. Decompose into dependency DAG
   - Each subtask has a clear, independent deliverable
   - Identify dependencies between subtasks
   - Size appropriately (see Task Sizing below)
3. Assess complexity of EACH subtask
   - Simple --> Tier 2 (free)
   - Medium --> Tier 1 (paid)
   - Complex / security / async / auth --> powerful-fallback
4. Calculate complexity score (0-10)
   - file_count_weight + async_logic_weight + security_touch_weight + dependency_depth_weight
   - 0-3: allow cheaper models
   - 4-6: standard routing
   - 7-10: direct to Opus tier
5. Assess risk
   - Security implications?
   - Breaking changes possible?
   - Multi-file coordination needed?
6. Dispatch all independent subtasks in parallel
   a. Categorize: explore (read-only) or general (reasoning/generation)
   b. Pick subagent_type based on complexity
   c. Write precise, self-contained prompt (see Section 14)
   d. Include JSON output format requirement
   e. Include skill hints
7. Evaluate results with confidence system (Section 7)
8. Re-dispatch failures to next tier up (Section 8)
9. Run validator on critical outputs
10. Synthesize into final coherent response
```

### Task Sizing

| Size | Problem | Fix |
|------|---------|-----|
| Too small | Coordination overhead exceeds benefit | Combine related micro-tasks into one agent |
| Too large | Agent works too long, higher failure risk | Break into 2-3 focused subtasks |
| Just right | Clear deliverable, can complete independently | Aim for this |

**Rule of thumb:** 3-6 subtasks per complex user request. Each should produce a clear, verifiable output.

### Dependency DAG

Before dispatching, identify which tasks depend on others:

```
T1 (explore auth) ---+
T2 (explore db)  ----+--> T4 (implement feature) --> T5 (write tests)
T3 (explore API) ---+                                      |
                                                    T6 (security audit)
```

- T1, T2, T3 are **parallel** (no dependencies)
- T4 depends on T1, T2, T3 (must wait)
- T5 depends on T4
- T6 depends on T5

**Dispatch T1, T2, T3 simultaneously. Wait. Then T4. Then T5. Then T6.**

## 11. Swarm Mode

For bulk analysis tasks that require many independent microtasks.

### When to Use Swarm Mode

- Analyzing 10+ files for a pattern
- Large-scale codebase audit
- Finding all usages of a deprecated API
- Bulk refactor analysis across many modules

### How It Works

1. **Generate microtasks** — create 10-100 independent, identically-structured tasks
2. **Dispatch in parallel** — use free-tier agents for each (`explore-fallback`, `general-fallback`)
3. **Aggregate results** — combine all outputs into a unified dataset
4. **Run global validator** — dispatch a `general` or `powerful-fallback` agent to validate the aggregation

### Example

```
Task: "Find all files with SQL injection vulnerabilities"

Microtasks (dispatched in parallel):
  Agent 1 (explore-fallback): Scan src/api/users/ for raw SQL
  Agent 2 (explore-fallback): Scan src/api/orders/ for raw SQL
  Agent 3 (explore-fallback): Scan src/api/products/ for raw SQL
  ... (one per module)

Aggregation: Combine all findings
Validation: powerful-fallback reviews aggregated findings for accuracy
```

### Limits

- Use Kimi K2.5 (`general-fallback`) for large-scale analysis microtasks
- Use GLM-5 (`explore-fallback`) for high-speed file extraction
- Always run a global validator on swarm results — individual agent accuracy is lower at scale

## 12. Temperature & Determinism

### Temperature Policy

| Agent Role | Temperature | Rationale |
|-----------|------------|-----------|
| Deep CodeGen | 0.2 | Precise, consistent code |
| Security Audit | 0.1 | Maximum determinism for safety |
| Test Generation | 0.3 | Slight creativity for edge case discovery |
| Explorer | 0.4 | Flexible search strategies |
| Brainstorm / Design | 0.7 | Creative exploration |

*Note: Temperature is advisory — include it in subagent prompts as guidance. Not all subagent types support explicit temperature control.*

### Determinism Rules

All agents must follow these rules (include in prompts for critical tasks):

1. **No free text outside JSON** — structured output only for machine-parseable results
2. **No file modifications without patch_diff** — all changes must be explicit
3. **No hallucinated dependencies** — only import packages that exist in the project
4. **No cross-file changes without listing files_modified** — every touched file must be declared
5. **No acceptance without validator approval** — critical outputs must be validated

## 13. Dispatch Strategies

### Independent Exploration

When exploring a codebase, dispatch multiple agents to different areas simultaneously:

```
Task: "Understand the authentication flow"

Agent 1 (explore-fallback): Read src/auth/ directory, list all files and purposes
Agent 2 (explore-fallback): Search for "authenticate" and "login" across codebase
Agent 3 (explore-fallback): Read package.json for auth-related dependencies
```

### Competing Hypotheses

For debugging or investigation, dispatch agents with **different theories**:

```
Task: "App crashes on login"

Agent 1 (general): Investigate null pointer in token parsing
Agent 2 (general): Investigate network timeout issue
Agent 3 (general): Investigate threading/coroutine scope issue
```

Sequential investigation suffers from **anchoring bias**. Parallel competing hypotheses find the real cause faster.

### Fan-Out / Fan-In

For large-scale analysis:

```
Task: "Find all deprecated API usages"

Fan-out: 4 explore agents, each scanning a different module
Fan-in: You synthesize all findings into a prioritized list
```

### Critical Path Thinking

Don't measure total work done — measure **time to answer** (the critical path).

```
Sequential (3 file reads):
  Read A (10s) -> Read B (10s) -> Read C (10s) = 30s critical path

Parallel (3 file reads):
  Read A (10s) -+
  Read B (10s) -+- = 10s critical path
  Read C (10s) -+
```

**Your goal:** minimize the critical path. Dispatch independent work in parallel. Only sequence tasks that truly depend on prior results.

## 14. Writing Subagent Prompts

A subagent has NO context about your conversation. Its prompt must be **completely self-contained**.

### Required Elements

1. **State the goal explicitly** — what output do you need?
2. **Provide file paths** — don't make it search for what you already know
3. **Specify JSON output format** — include the expected schema with confidence field
4. **Set boundaries** — "Only look in src/auth/", "Focus on error handling"
5. **Hint relevant skills** — tell the subagent which skills to invoke
6. **Include determinism rules** for critical tasks

### Prompt Template

```
[TASK]: {clear description of what to do}

[SCOPE]: {file paths, directories, or boundaries}

[OUTPUT FORMAT]:
Return your output as JSON with this structure:
{
  "summary": "Brief description of findings",
  "details": [...],
  "confidence": 0.0  // 0.0-1.0, be honest, don't inflate
}

[CONSTRAINTS]:
- {any limits on what the agent should/shouldn't do}
- Be honest about confidence. Consider edge cases you couldn't verify.

[SKILLS]:
- Use the {relevant-skill} skill if {condition}.
- You have access to all skills via the Skill tool — invoke any that are relevant.
```

### Bad vs Good Prompts

```
# Bad prompt
"Look at the auth code and tell me about it"

# Good prompt
"Read the files src/auth/login.ts and src/auth/token.ts.
List all public functions with their parameters and return types.
Note any functions that make network calls.

Return as JSON:
{
  "functions": [{"name": "", "params": [], "returns": "", "makes_network_calls": false}],
  "observations": [],
  "confidence": 0.0
}

Use the systematic-debugging skill if you find issues.
You have access to all skills via the Skill tool — invoke any that are relevant."
```

### Subagent Skill Access

**Critical:** Subagents have full access to the skill system and can invoke any skill.

- **Hint relevant skills** in the prompt to accelerate the right approach
- **Allow discovery** — subagents might find applicable skills you didn't anticipate
- Subagents **cannot** spawn further subagents (no Task tool access)
- Subagents **can** parallelize their own tool calls aggressively

## 15. Failure Recovery

### Escalation Path

```
Tier 2 (free) --> Tier 1 (paid) --> powerful-fallback (Opus)
```

**Never retry the same tier twice. Move to next tier up immediately.**

### When to Re-Dispatch

- Subagent returned empty or "I don't know"
- Response is clearly wrong or contradicts known facts
- Response is too vague to be actionable
- Response misses key files or patterns you expected
- Confidence self-reported below 0.50
- Output is malformed JSON or missing required fields

### When NOT to Re-Dispatch

- Response is slightly imperfect but usable — fill gaps yourself (< 20% missing)
- Minor formatting issues
- Response covers 80%+ of what you need

### Handling Stuck / Looping Agents

Free-tier models sometimes get stuck in repetition loops or produce degenerate output.

**Detection signs:**
- Repeated phrases or sentences in the response
- Abnormally long output that is content-free
- Response doesn't address the task at all
- Model says "I'll execute" repeatedly without doing anything

**Recovery:**
1. **Discard the output entirely** — don't extract bits from garbage
2. **Escalate to next tier immediately** — don't retry the same model
3. **Proceed with other agents' results** — if 2 of 3 agents returned good results, synthesize those and only re-dispatch the failed one
4. **If multiple agents get stuck:** The task prompt is too vague. Rewrite with more specific instructions before re-dispatching.

### Provider Failure Recovery

If a provider is experiencing errors:

1. **Single failure:** Retry once
2. **Repeated failure (2+):** Switch to alternate provider via different subagent type
3. **All providers failing:** Report to user, attempt manual execution for critical subtasks

## 16. Quality Gates

Before presenting results to the user, verify:

1. **Completeness** — Did all dispatched agents return results?
2. **Consistency** — Do results from different agents agree? Flag contradictions explicitly.
3. **Accuracy** — Do results make sense given what you know about the codebase?
4. **Confidence** — Are all confidence scores within acceptable range for the task category?
5. **Determinism** — Are all file modifications declared? Any hallucinated imports?
6. **Synthesis** — Have you combined findings into a coherent answer, not just concatenated outputs?

If agents returned conflicting findings, **explicitly note the conflict** and either resolve it yourself or dispatch a tiebreaker agent.

## 17. Self-Improving Routing Engine (SIRE)

**Status: Future work. Manual heuristics apply today.**

### Full Vision

The SIRE continuously optimizes model selection, provider choice, escalation thresholds, and task routing based on real execution data. It tracks:

- Per (model + task_category): avg confidence, escalation rate, validator failure rate, avg latency, cost
- Dynamic routing weights (0-100) per model-task pair
- Adaptive escalation thresholds per project
- Provider health monitoring (429s, 5xx, latency spikes, timeouts)
- Project-specific routing profiles

### Adaptive Rules (Automated — Future)

| Rule | Trigger | Action |
|------|---------|--------|
| High Escalation | escalation_rate > 25% for model-task pair | Route directly to fallback |
| Low Confidence | avg_confidence < 0.65 for 20+ executions | Skip primary, use stronger model |
| Stable High Confidence | avg_confidence > 0.85, failure < 5%, escalation < 10% | Lower threshold to 0.6, reduce retries |
| Provider Degraded | error_rate > 10% in last 50 calls | Demote provider, re-evaluate after cooldown |
| Cost Optimization | Monthly budget > threshold | Increase confidence threshold +0.05, reduce retries |

### Shadow Evaluation (Future)

For critical tasks: silently run Opus validation alongside primary model. If disagreement score exceeds threshold, accept Opus result and penalize primary model's routing weight.

### Dynamic Routing Weights (Future)

Each model-task pair has a weight (0-100):

```
antigravity-opus-4.6 (deep_codegen): 90
antigravity-sonnet-4.6 (test_generation): 80
minimax-m2.5 (lightweight): 70
```

Weight adjustments:
- Successful execution: +1
- Escalation required: -5
- Validator fail: -8
- Provider error: -3
- Weight below 40: auto-demote model

### Task Complexity Scoring (Future)

Before routing, calculate:

```
complexity_score =
    file_count_weight +
    async_logic_weight +
    security_touch_weight +
    dependency_depth_weight
```

Score range: 0-10. Routing: 0-3 cheaper models, 4-6 standard, 7-10 direct Opus.

### Project-Specific Learning (Future)

Maintain routing profiles per project:

```yaml
project_routing_profile:
  project_id:
    preferred_models:
      deep_codegen: anthropic-opus-4.6
```

### Cold Start Strategy (Future)

If insufficient data (< 20 tasks): use static default routing rules. Enable adaptive mode after minimum data threshold.

### Manual Heuristics (Apply Today)

Since persistent analytics infrastructure doesn't exist yet, follow these rules within each session:

1. **Track model performance mentally** — if a model fails on a task type, don't use it for similar tasks again this session
2. **If a free model fails 2+ times on similar tasks**, stop routing that task type to free tier for the rest of the session
3. **If Gemini 3 Pro struggles with a project's codebase**, prefer Claude Sonnet 4.6 for that project's comprehension tasks
4. **For projects with strict TypeScript**, prefer Opus for codegen (free models hallucinate types more)
5. **Note which subagent types work well** for a given repo and bias toward them

### Determinism Safeguards

Even with adaptive routing, these rules are **never overridden:**

- Final Authority rule (Section 5) cannot be bypassed
- Security audit never drops below Opus tier
- Explicit user model requests are always honored
- High-risk categories never get reduced escalation thresholds

## 18. Anti-Patterns & Red Flags

### Anti-Patterns

| Anti-Pattern | Symptoms | Fix |
|-------------|----------|-----|
| **Serial Collapse** | Reading files one at a time, "Let me check this first...", sequential when parallel is possible | Dispatch independent tasks simultaneously |
| **Spurious Parallelism** | 5 agents for 1 task, overlapping results, coordination overhead exceeds benefit | Each agent needs a clear, independent deliverable |
| **Confidence Inflation** | Agent reports 0.95 on a multi-file security change | Enforce confidence caps (Section 7), independently assess |
| **Skipping Final Authority** | "Opus is expensive, Sonnet is probably fine for this security review" | Security = Opus. Always. (Section 5) |
| **Context-Free Prompts** | "Look at the code and fix it" | Write self-contained prompts with paths, format, constraints (Section 14) |
| **Concatenation Not Synthesis** | Dumping all agent outputs without integration | Combine findings into a coherent response |
| **Same-Tier Retry** | Free model failed, trying free model again | Move to next tier immediately on failure |
| **Ignoring Contradictions** | Two agents disagree, you pick one arbitrarily | Flag conflict, resolve or dispatch tiebreaker |
| **Using Stuck Agent Output** | Extracting bits from garbage output | Discard entirely, escalate |
| **No Skill Hints** | Dispatching agents without mentioning relevant skills | Always include skill hints in prompts (Section 14) |

### Red Flags — You're Wasting Budget

- Reading files directly when an explore subagent could do it
- Running multiple grep/search commands yourself
- Using Claude Sonnet for a simple file read (use free models)
- Using free models for code comprehension requiring reasoning (use paid models)
- Writing boilerplate code yourself instead of delegating
- Doing tasks sequentially that could run in parallel
- NOT using the Task tool for multi-step sub-work
- Not assessing task complexity before choosing which tier to dispatch to
- Dispatching codegen to free tier (use general or powerful-fallback)
- Skipping validation on multi-file changes

### What to NEVER Delegate

- Final architectural decisions
- Security reviews (final judgment — exploration can be delegated)
- Complex multi-file refactoring logic (planning — execution can be delegated)
- User communication and clarification
- Quality review of subagent outputs
- Confidence assessment and escalation decisions

## 19. Production Guarantees

This architecture ensures:

- **Provider redundancy** — Antigravity-first with Anthropic fallback
- **Quota-aware routing** — automatic failover on quota/rate limits
- **Cost optimization** — free models for simple tasks, paid only when needed
- **Deterministic execution** — structured JSON outputs, no free-text drift
- **Hallucination mitigation** — validator agents, confidence caps, import checking
- **Security-first escalation** — security tasks always route to Opus tier
- **Parallel scalability** — DAG-based task decomposition, swarm mode for bulk
- **Enterprise reliability** — Final Authority rule ensures correctness under all conditions
