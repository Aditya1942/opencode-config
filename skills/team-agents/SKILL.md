---
name: team-agents
description: "Use when delegating work to subagents: routing by task type (explore, librarian, general, executor, prometheus-lite), fallback chains, and orchestrator's 6-step mandatory workflow"
---

# Multi-Agent Routing

## Overview

This skill defines how to route tasks to the right subagent, the orchestrator's mandatory 6-step workflow, and the planning agents (prometheus-lite, metis, momus). Load it whenever a task involves decomposition, research, exploration, or execution by specialized agents.

## Agents & Roles

| Agent | Model | Role | Fallback |
|-------|-------|------|----------|
| **build** | User-selected | Primary agent; routes complex work to orchestrator | — |
| **orchestrator** | User-selected | Token-efficient conductor — Intent Gate → Plan → Review → Parallel Execute → Verify → Ship | — |
| **explore** | Claude Haiku 4.5 | Codebase mapping, search, LSP/ast_grep (read-only) | explore-fallback |
| **explore-fallback** | MiniMax M2.5 Free | Fallback explorer | — |
| **general** | GLM 4.7 | Code comprehension, multi-file analysis, dependency maps | — |
| **librarian** | GLM 4.7 Flash | Research: docs, multi-repo, GitHub, library best practices | librarian-fallback |
| **librarian-fallback** | Claude Haiku 4.5 | Fallback librarian | — |
| **transform** | GLM 4.7 Flash | Renames, formatting, simple refactors (no logic change) | — |
| **validator** | GPT-5 Nano | Output validation, format checks, hallucination detection | — |
| **executor** | GLM 4.7 Flash | Implements microtasks; full tool access | executor-fallback |
| **executor-fallback** | Claude Haiku 4.5 | Fallback executor | — |
| **code-reviewer** | GLM 4.7 | Post-implementation review vs plan and standards | — |
| **prometheus-lite** | Claude Haiku 4.5 | Strategic planner; plans only in `.sisyphus/plans/` (no code) | — |
| **metis** | GLM 4.7 Flash | Pre-planning consultant; intent + gap analysis (read-only) | — |
| **momus** | GLM 4.7 Flash | Plan reviewer; executable plans, valid refs (read-only) | — |

## When to Use Orchestrator

Use the **orchestrator** for any multi-step implementation task. The orchestrator internally calls prometheus-lite, metis, and momus as steps in its mandatory workflow — they are not alternatives.

| Scenario | Route to |
|----------|----------|
| Multi-step implementation | **orchestrator** — runs full 6-step workflow |
| User explicitly wants a written plan only | **prometheus-lite** directly — interview → @metis → plan file → optional @momus |
| Research / docs / GitHub examples | **librarian** (fallback: librarian-fallback) |
| Codebase search, symbol refs, structure | **explore** (fallback: explore-fallback) |
| Understand code, data flow, dependencies | **general** |
| Mechanical renames, format, boilerplate | **transform** |
| Validate another agent's output | **validator** |
| Implement a single microtask from a plan | **executor** (fallback: executor-fallback) |
| Review completed work vs plan | **code-reviewer** |

## Task Routing

| Task Type | Primary Agent | Fallback |
|-----------|---------------|----------|
| file_read, search, pattern_scan | explore | explore-fallback |
| comprehend, dependency_map | general | — |
| research, docs, GitHub examples | librarian | librarian-fallback |
| transform, rename, format | transform | — |
| validate_output | validator | — |
| generate_code, write_tests, refactor | executor | executor-fallback |
| code_review (post-implementation) | code-reviewer | — |
| create_work_plan (plan only) | prometheus-lite | — (calls metis then optional momus) |
| gap_analysis_before_plan | metis | — |
| review_plan_file | momus | — |
| multi_step_implementation | orchestrator | — (runs full 6-step workflow) |

## Orchestrator Mandatory Workflow (6 Steps — Never Skip)

The orchestrator is a **PURE DISPATCHER** — it NEVER does work directly.

### IRON LAW: ALL WORK GOES TO SUBAGENTS

| Task Type | Orchestrator Does This? | Dispatch To |
|-----------|------------------------|-------------|
| Read files | ❌ NEVER | @explore |
| Search codebase | ❌ NEVER | @explore |
| Research docs/GitHub | ❌ NEVER | @librarian |
| Write/edit code | ❌ NEVER | @executor |
| Analyze code | ❌ NEVER | @general |
| Transform/rename | ❌ NEVER | @transform |
| Validate output | ❌ NEVER | @validator |
| Review code | ❌ NEVER | @code-reviewer |
| Analyze intent/gaps | ❌ NEVER | @metis |
| Create plans | ❌ NEVER | @prometheus-lite |
| Review plans | ❌ NEVER | @momus |
| Run tests/lint/build | ❌ NEVER | @executor |
| Git operations | ❌ NEVER | @executor |

**Orchestrator's ONLY actions:**
1. Dispatch subagents via Task tool
2. Synthesize their results
3. Update todo list
4. Present summaries to user
5. Ask clarifying questions (research for clarification → @librarian/@explore)

### Step 1: Intent Gate
- Call **@metis** immediately for hidden intents, gaps, risks, and clarifying directives.

### Step 2: Planning
- Call **@prometheus-lite** to generate a full executable plan in `.sisyphus/plans/`.

### Step 3: Plan Review
- Call **@momus** to validate executability and references.
- Present concise summary (4-6 bullets) to user.
- Ask: "Plan ready. Reply **GO** or give changes."
- **Do NOT proceed until user says GO / APPROVE.**

### Step 4: Execution (only after user GO)
- Load skills first: `team-agents`, `dispatching-parallel-agents`, `executing-plans`, `verification-before-completion`.
- Decompose plan into microtasks.
- Dispatch in parallel waves to: `@executor`, `@explore`, `@librarian`, `@transform`, `@general`.
- Use MCPs freely: ast-grep, web-search, context7, grep-app, memory.

### Step 5: Verification Gates
- After each wave: dispatch **@validator** + **@code-reviewer**.
- Dispatch **@executor** to run tests/lint/build.
- Re-dispatch fixes if needed.

### Step 6: Completion
- Dispatch **@code-reviewer** for final pass.
- Dispatch **@executor** for git commit (or use `commit-and-push` skill).
- Summarize results and mark done.

## Planning Workflow (Prometheus-Lite — standalone)

Use this only when the user explicitly wants a written plan without immediate execution.

1. Interview mode: classify intent, ask clarifying questions, optionally launch explore/librarian.
2. Call **metis** for gap analysis (mandatory before generating the plan).
3. Generate one plan at `.sisyphus/plans/{kebab-case-name}.md`.
4. Optionally ask user if they want **momus** to review the plan.
5. Tell user: "Plan ready. Run `/start-work {name}` to execute."

## Confidence & Escalation

| Confidence | Action |
|------------|--------|
| ≥ 0.80 | Accept result |
| 0.65–0.79 | Accept with review; verify key aspects |
| 0.50–0.64 | Retry once with fallback agent in chain |
| < 0.50 | Reject; escalate to build / user-selected model or ask user |

When in doubt, move to the next agent in the fallback chain (explore → explore-fallback; librarian → librarian-fallback; executor → executor-fallback). Do not retry the same agent twice.

## Direct Escalation (Bypass Routing)

Route to **build** (or user) for:
- Security-sensitive changes (auth, permissions, secrets)
- Architectural or system-design decisions
- Multi-file changes with high blast radius
- Validator returns invalid twice
- Confidence < 0.50 after fallback

## Key Rules

- **IRON LAW: Orchestrator is a PURE DISPATCHER. ALL work goes to subagents.**
- Orchestrator NEVER uses Read, Write, Edit, Bash, grep, glob, or any tool that does work.
- Maximize parallelism (use `dispatching-parallel-agents` skill).
- Skills-first evaluation before any dispatch.
- Track todos and checkpoints in `.sisyphus/`.
- Keep every response concise (bullets + clear next actions).
- Orchestrator starts every response with **[ORCHESTRATOR]**.

## Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| **Orchestrator using Read/Write/Edit/Bash directly** | VIOLATION — Orchestrator is a pure dispatcher. ALL work goes to subagents. |
| **Orchestrator reading files** | Dispatch to @explore for file reads |
| **Orchestrator searching codebase** | Dispatch to @explore for search |
| **Orchestrator running tests/lint** | Dispatch to @executor for test execution |
| **Orchestrator doing git operations** | Dispatch to @executor for git |
| Skipping metis intent gate | Orchestrator must dispatch @metis as step 1 — always |
| Skipping prometheus-lite planning | Orchestrator must dispatch @prometheus-lite as step 2 — always |
| Skipping momus plan review | Orchestrator must dispatch @momus as step 3 — always |
| Executing without user GO | Orchestrator must wait for explicit user confirmation before step 4 |
| Executing without loading skills | Load team-agents, dispatching-parallel-agents, executing-plans, verification-before-completion first |
| Orchestrator writing code | Orchestrator is a conductor — dispatch to @executor for code |
| Prometheus writing code | Prometheus-lite only creates/edits markdown in `.sisyphus/plans/` and `.sisyphus/drafts/` |
| Skipping verification gates | After each execution wave, dispatch @validator + @code-reviewer |
| Serial collapse | Dispatch independent tasks in parallel |
| Ignoring fallbacks | On failure or low confidence, use explore-fallback, librarian-fallback, or executor-fallback |
| Using executor for research | Use librarian for docs and examples |
| Vague prompts to subagents | Include explicit paths and scope when dispatching |

## Quality Checklist

- **Did orchestrator ONLY dispatch subagents? No direct tool use?**
- Did orchestrator run all 6 mandatory steps?
- Was @metis dispatched before planning?
- Was @prometheus-lite plan generated in `.sisyphus/plans/`?
- Was @momus dispatched to review the plan?
- Did user confirm with GO before execution started?
- Were skills loaded before dispatching?
- Did all dispatched agents return results?
- Do results agree where multiple agents touched the same concern?
- Are confidence scores ≥ 0.65 or escalated?
- Are file modifications declared? No hallucinated imports?
- Were verification gates (@validator + @code-reviewer) dispatched after each wave?

## Failure Recovery

**Trigger fallback when:** agent returns empty/wrong/vague output, confidence < 0.50, malformed response, or provider error. Move to the next agent in the chain; do not retry the same agent twice.
