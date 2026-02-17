---
name: team-agents
description: Use when receiving any task that involves sub-tasks like file reading, code comprehension, searching, or simple code generation - delegates micro-work to free models to save API costs
---

# Team Agents

## Overview

You are an **orchestrator**. Your job is to decompose, delegate, and synthesize — never to do leaf work yourself. Subagents execute; you decide.

**Core principle:** Orchestrate, don't implement. Parallelize aggressively. Escalate only on failure.

## When to Use

- Any task involving file reading or codebase exploration
- Code comprehension or summarization sub-tasks
- Search/grep operations across the codebase
- Simple code generation (boilerplate, stubs, repetitive patterns)
- Multi-step tasks where sub-steps are independent
- Research requiring multiple perspectives or competing hypotheses

**When NOT to use:**
- Direct conversational questions (no sub-tasks needed)
- Tasks requiring a single complex reasoning step
- Security-sensitive operations where quality is critical

## The Orchestrator Role

You are the **team lead in delegate mode**. This means:

**DO:**
- Decompose tasks into parallelizable subtasks
- Dispatch subagents and evaluate their results
- Synthesize findings into a coherent response
- Make final architectural and quality decisions
- Fill small gaps (< 20% of work) yourself

**DO NOT:**
- Read files yourself when a subagent can do it
- Run search/grep yourself for exploration
- Write boilerplate code yourself
- Summarize large codebases yourself
- Do sequential work that could be parallel

### Serial Collapse (Anti-Pattern)

**Serial collapse** is when you default to doing tasks one-by-one yourself despite having parallel capacity. This is the #1 failure mode.

**Symptoms:**
- Reading files one at a time instead of dispatching explore agents
- Running grep, then reading results, then grepping again sequentially
- "Let me check this file first..." when 3 files could be checked simultaneously
- Doing work yourself because "it's faster than dispatching"

**Fix:** Before ANY file read, search, or comprehension task — ask: "Can a subagent do this?" If yes, delegate.

### Spurious Parallelism (Anti-Pattern)

**Spurious parallelism** is spawning many subagents without meaningful task decomposition — activity without productivity.

**Symptoms:**
- Dispatching 5 agents for what's really 1 task
- Agents returning overlapping or redundant results
- Breaking a task so small that coordination overhead exceeds benefit
- Dispatching agents that depend on each other's output

**Fix:** Each subagent should have a **clear, independent deliverable**. If subtasks can't run simultaneously without each other's output, they're not parallel — sequence them.

## Delegation Rules

### Agent Types

| Task Type | Subagent | Model |
|-----------|----------|-------|
| File search, codebase exploration | `explore` | antigravity-claude-sonnet-4-5-thinking |
| Code comprehension, multi-step work | `general` | antigravity-claude-opus-4-6-thinking |

### What to NEVER delegate

- Final architectural decisions
- Security reviews
- Complex multi-file refactoring logic
- User communication and clarification
- Quality review of subagent outputs

## Orchestration Pattern

```
1. Receive task from user
2. Decompose into independent subtasks
   - Each subtask has a clear deliverable
   - Subtasks must NOT depend on each other
   - Size appropriately: not too small (overhead), not too large (risk)
3. Dispatch all independent subtasks in parallel
   a. Categorize: explore (read-only) or general (reasoning/generation)
   b. Write a precise, self-contained prompt for each subagent
   c. Include relevant skill hints and inform subagent of Skill tool access
   d. Dispatch to Tier 1 free model
4. Evaluate results using Critical Path thinking
5. Escalate failures (see Escalation Ladder)
6. Synthesize into final response
```

### Task Sizing

| Size | Problem | Fix |
|------|---------|-----|
| Too small | Coordination overhead exceeds benefit | Combine related micro-tasks into one agent |
| Too large | Agent works too long, higher failure risk | Break into 2-3 focused subtasks |
| Just right | Clear deliverable, can complete independently | Aim for this |

**Rule of thumb:** 3-6 subtasks per complex user request. Each should produce a clear, verifiable output.

### Writing Good Subagent Prompts

A subagent has NO context about your conversation. Its prompt must be **self-contained**:

- **State the goal explicitly** — what output do you need?
- **Provide file paths** — don't make it search for what you already know
- **Specify format** — "Return a list of...", "Summarize in 2-3 sentences..."
- **Set boundaries** — "Only look in src/auth/", "Focus on error handling"
- **Hint relevant skills** — tell the subagent which skills to invoke, and that it can discover more via the Skill tool

```
# Bad prompt
"Look at the auth code and tell me about it"

# Good prompt
"Read the files src/auth/login.kt and src/auth/token.kt. 
List all public functions with their parameters and return types. 
Note any functions that make network calls.

If you encounter form-related architecture, use the defn-form skill.
You have access to all skills via the Skill tool - invoke any that are relevant."
```

## Subagent Skill Access

**Critical:** Subagents have full access to the skill system and can invoke any skill (brainstorming, defn-form, systematic-debugging, etc.).

### Skills in Subagent Prompts

When dispatching a subagent, **hint relevant skills** in the prompt:

```
# Skill-aware prompt (GOOD)
"Analyze the authentication flow in src/auth/.

Use the systematic-debugging skill if you encounter bugs or unexpected behavior.
Use the brainstorming skill before proposing any new features.
You have access to all skills via the Skill tool - invoke any others that are relevant.

Return a summary of the flow with any issues found."
```

**Why hint skills?** Subagents have no conversation context. They don't know which skills exist or when to use them unless you tell them. Hinting accelerates the right approach.

**Why allow discovery?** Domain-specific skills (like defn-form) or specialized techniques might apply that you didn't anticipate. Give subagents permission to explore.

### Subagent Parallelism (Not Recursive — But Still Powerful)

Subagents do **NOT** have the Task tool — they cannot spawn further subagents. Only the top-level orchestrator (you) can dispatch via the Task tool. This is an environment limitation.

**However**, subagents CAN aggressively parallelize their own tool calls:

```
Orchestrator (you) dispatches:
  ├─ Subagent 1 (explore): "Analyze authentication module"
  │   Internally runs 5+ parallel searches/reads across auth files
  ├─ Subagent 2 (general): "Analyze payment module"
  │   Internally runs parallel reads + skill invocations
```

**What this means for the orchestrator:**
- **YOU own all decomposition** — break complex tasks into the right number of subagents upfront
- Don't rely on subagents to further decompose — they'll parallelize their tools but can't delegate
- If a task needs 6 parallel explorations, dispatch 6 subagents yourself — don't dispatch 2 and expect them to split into 3 each
- Tell subagents to use **parallel tool calls** for independent operations within their scope

**How to enable in prompts:**

```
"Analyze the authentication and authorization systems.

Run parallel searches and file reads for independent modules.
Load the systematic-debugging skill if you find issues.
You have access to all skills via the Skill tool.

Return a comprehensive security analysis."
```

### Skill Access Examples

**Domain-specific knowledge:**
```
"Review the form implementation in src/ui/forms/.

Use the defn-form skill for architecture guidance on MVI+UDF form patterns.
Verify field validation, property resolution, and dependency tracking follow the spec.

Return a compliance report with any deviations."
```

**Process enforcement:**
```
"Implement the user registration feature.

IMPORTANT: Use the brainstorming skill BEFORE writing any code.
Use the test-driven-development skill during implementation.
Use verification-before-completion before claiming the work is done.

Return the implementation with test coverage report."
```

**Investigation work:**
```
"Debug why the login flow is failing intermittently.

Use the systematic-debugging skill to trace the root cause.
Run parallel searches across different modules to explore multiple hypotheses simultaneously.

Return the root cause analysis and fix."
```

## Parallel Dispatch Strategies

### Independent Exploration

When exploring a codebase or researching a problem, dispatch multiple agents to different areas simultaneously:

```
Task: "Understand the authentication flow"

Agent 1 (explore): Read src/auth/ directory, list all files and their purposes
Agent 2 (explore): Search for "authenticate" and "login" across the codebase
Agent 3 (explore): Read build.gradle for auth-related dependencies
```

### Competing Hypotheses

For debugging or investigation, dispatch agents with **different theories** to challenge each other's findings:

```
Task: "App crashes on login"

Agent 1 (general): Investigate if it's a null pointer in token parsing
Agent 2 (general): Investigate if it's a network timeout issue
Agent 3 (general): Investigate if it's a threading/coroutine scope issue
```

Use this when the root cause is unclear. Sequential investigation suffers from **anchoring bias** — once one theory is explored, you're biased toward it. Parallel competing hypotheses find the real cause faster.

### Fan-Out / Fan-In

For large-scale analysis, fan out across the codebase, then synthesize:

```
Task: "Find all deprecated API usages"

Fan-out: 4 explore agents, each scanning a different module
Fan-in: You synthesize all findings into a prioritized list
```

## Critical Path Thinking

Don't measure total work done — measure **time to answer** (the critical path).

```
Sequential (3 file reads):
  Read A (10s) → Read B (10s) → Read C (10s) = 30s critical path

Parallel (3 file reads):
  Read A (10s) ─┐
  Read B (10s) ──┼─ = 10s critical path
  Read C (10s) ─┘
```

**Your goal:** minimize the critical path. Dispatch independent work in parallel. Only sequence tasks that truly depend on prior results.

When dispatching, ask: "What is the **longest chain** of dependent tasks?" That's your critical path. Everything else should run in parallel alongside it.

## Escalation Ladder

When a subagent returns incomplete, wrong, or low-quality results:

```
Tier 1: Free model (explore / general)
  → Result acceptable? → Use it
  → Result bad? ↓

Tier 2: Alternative free model (explore-fallback / general-fallback)
  → Result acceptable? → Use it
  → Result bad? ↓

Tier 3: Powerful model (powerful-fallback)
  → Accept result (last resort)
```

### Tier Details

| Tier | Explore Tasks | General Tasks |
|------|--------------|---------------|
| 1 (Free) | `explore` → antigravity-claude-sonnet-4-5-thinking | `general` → antigravity-claude-opus-4-6-thinking |
| 2 (Alt Free) | `explore-fallback` → minimax-m2.5-free | `general-fallback` → kimi-k2.5-free |
| 3 (Powerful) | `powerful-fallback` → antigravity-claude-opus-4-6-thinking | `powerful-fallback` |

### When to escalate

- Subagent returned empty or "I don't know" response
- Response is clearly wrong or contradicts known facts
- Response is too vague to be actionable
- Response misses key files or code patterns you expected
- Subagent got stuck in a loop (see below)

### Handling Stuck / Looping Subagents

Free-tier models sometimes get stuck in repetition loops ("I'll execute. I'll execute. I'll execute...") or produce degenerate output. This is a model quality issue, not a task issue.

**Detection signs:**
- Repeated phrases or sentences in the response
- Agent output is abnormally long but content-free
- Agent returned but the response doesn't address the task at all

**Recovery:**
1. **Discard the stuck agent's output entirely** — don't try to extract useful bits from garbage
2. **Escalate to next tier immediately** — re-dispatch the same task to the fallback model
3. **Don't retry the same model** — if it looped once, it will loop again on the same prompt
4. **Proceed with other agents' results** — if 2 of 3 agents returned good results, synthesize those and only re-dispatch the failed one

**If multiple agents get stuck:** The task prompt may be too vague. Rewrite with more specific instructions before re-dispatching.

### When NOT to escalate

- Response is slightly imperfect but usable — fill gaps yourself
- Minor formatting issues
- Response covers 80%+ of what you need

**Never retry the same tier twice. Move to next tier immediately.**

## Quality Gates

Before presenting results to the user, verify:

1. **Completeness** — Did all dispatched agents return results?
2. **Consistency** — Do results from different agents agree? Flag contradictions.
3. **Accuracy** — Do results make sense given what you know about the codebase?
4. **Synthesis** — Have you combined findings into a coherent answer, not just concatenated outputs?

If agents returned conflicting findings, **explicitly note the conflict** and either resolve it yourself or dispatch a tiebreaker agent.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Doing file reads yourself | ALWAYS delegate to explore subagent |
| Serial collapse — sequential when parallel is possible | Dispatch independent tasks simultaneously |
| Spurious parallelism — too many agents for simple work | Each agent needs a clear, independent deliverable |
| No context in subagent prompt | Write self-contained prompts with file paths and goals |
| Not telling subagents about available skills | Include skill hints in prompts and mention Skill tool access |
| Expecting subagents to further decompose | Subagents lack the Task tool — only YOU can dispatch. Break tasks into enough subagents upfront |
| Escalating too quickly | Accept 80%+ correct responses, fill gaps yourself |
| Escalating too slowly | Don't retry same tier; move to next tier |
| Concatenating instead of synthesizing | Combine agent outputs into a coherent response |
| Ignoring contradictions between agents | Flag conflicts, resolve or dispatch tiebreaker |
| Using output from a stuck/looping agent | Discard entirely, escalate to next tier |

## Red Flags — You're Wasting Budget

- Reading files directly when an explore subagent could do it
- Running multiple grep/search commands yourself
- Writing boilerplate code yourself instead of delegating
- Summarizing large codebases yourself
- Doing tasks sequentially that could run in parallel
- NOT using the Task tool for multi-step sub-work
- Dispatching subagents for domain-specific tasks without hinting relevant skills (defn-form, brainstorming, etc.)
