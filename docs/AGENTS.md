# Agent System Codemap

**Last Updated:** 2026-03-06  
**Scope:** Agent definitions, routing, model allocation  

---

## 🤖 Agent Taxonomy

### Primary Agents (User-Facing)

| Agent | Model | Mode | Purpose | Invocation |
|---|---|---|---|---|
| **build** | user-selected | Primary | Default entry point for complex tasks | Default: `build [task]` |
| **orchestrator** | user-selected | Conductor | PURE dispatcher orchestrating subagents | `/orchestrator [task]` or `@orchestrator` |

---

## 🚀 Execution Tier Agents

### Read-Only (Read & Analyze)

| Agent | Model | Purpose | Key Tools |
|---|---|---|---|
| **explore** | Claude Haiku 4.5 | Blazing-fast codebase mapping, search, architecture | lsp_symbols, ast_grep, ripgrep |
| **explore-fallback** | MiniMax M2.5 | Fallback explorer when primary unavailable | Same as explore |
| **general** | GLM 4.7 | Multi-file code comprehension & analysis | Read, analyze, trace data flow |
| **architect** | Claude Sonnet 4.6 | System design, scalability, ADRs | Read-only design recommendations |
| **librarian** | GLM 4.7 | Research: docs, GitHub, libraries, examples | context7, grep-app, web-search |
| **librarian-fallback** | Claude Haiku 4.5 | Fallback research specialist | Same as librarian |

### Write/Execute Tier

| Agent | Model | Purpose | Constraints |
|---|---|---|---|
| **executor** | GLM 4.7 | Write code, run tests, edit files, commit | Focused microtasks only, no scope expansion |
| **executor-fallback** | Claude Haiku 4.5 | Fallback executor when primary unavailable | Same constraints as executor |
| **transform** | GLM 4.7 | Mechanical refactoring (renames, reformats) | NEVER changes logic or behavior |
| **code-reviewer** | GLM 4.7 | Security & quality QA (React, Node.js patterns) | Reports CRITICAL + HIGH issues only |

### Validation Tier

| Agent | Model | Purpose | Output |
|---|---|---|---|
| **validator** | GPT-5 Nano | Format validation, schema compliance, hallucination detection | pass/fail with specific issues |

---

## 📋 Planning & Governance Agents

| Agent | Model | Mode | Purpose | Execution |
|---|---|---|---|---|
| **prometheus-lite** | user-selected | Planning | Strategic planning via interview → plan → review | Outputs to `.agents/plans/` |
| **metis** | GLM 4.7 | Hidden | Pre-planning gap analysis & intent classification | Called by prometheus-lite |
| **momus** | GLM 4.7 | Hidden | Plan executability verification | Called by prometheus-lite |

---

## 🛠️ Specialized Agents

| Agent | Model | Purpose |
|---|---|---|
| **build-error-resolver** | GLM 4.7 | Minimal diffs to fix build/type errors (no refactoring) |
| **refactor-cleaner** | GLM 4.7 | Dead code detection & cleanup, dependency management |
| **doc-updater** | Claude Haiku 4.5 | Codemap generation, documentation maintenance |
| **tdd-guide** | GLM 4.7 | TDD enforcement: RED → GREEN → REFACTOR cycles |
| **skill-chooser** | Claude Haiku 4.5 | Analyze requests, recommend top 1-3 skills |

---

## 🔄 Agent Dispatch Flow

### Orchestrator PURE DISPATCHER Pattern

**The orchestrator is NEVER allowed to do work. It ONLY dispatches.**

```
Task Received (e.g., "Implement feature X")
    │
    ├─ 1. Call @metis for intent analysis
    │      └─ Returns: Intent type, gaps, risks, directives
    │
    ├─ 2. Call @prometheus-lite for planning
    │      └─ Returns: Detailed plan in .agents/plans/{name}.md
    │
    ├─ 3. Present plan to user, ask for GO
    │      └─ If user confirms → proceed to execution
    │
    ├─ 4. Execution Waves (parallel dispatch)
    │      ├─ Wave 1:
    │      │   ├─ @explore [search for patterns]
    │      │   ├─ @librarian [research best practices]
    │      │   ├─ @general [analyze code]
    │      │   └─ @executor [microtask 1-3]
    │      │
    │      ├─ Wave 2 (after Wave 1 complete):
    │      │   ├─ @validator [validate outputs]
    │      │   ├─ @code-reviewer [QA]
    │      │   └─ @executor [microtask 4-6]
    │      │
    │      └─ Wave 3+: Repeat pattern
    │
    └─ 5. Final verification + commit
           ├─ Call @code-reviewer for final pass
           └─ Call @executor to commit
```

### Forbidden Actions (Orchestrator Anti-Patterns)

❌ Read files directly  
❌ Search codebase  
❌ Research documentation  
❌ Write code  
❌ Run commands  
❌ Analyze code  
❌ Make architecture decisions  

**ONLY:**
✅ Dispatch to subagents  
✅ Synthesize results  
✅ Track todos in `.agents/`  
✅ Update user with clear next actions  

---

## 🎯 Model Routing Strategy

### Primary Model Selection

| Task Type | Primary | Fallback | Rationale |
|---|---|---|---|
| **Codebase Search** | Haiku 4.5 | MiniMax M2.5 | Speed-critical, deterministic |
| **Code Comprehension** | GLM 4.7 | Haiku 4.5 | Balanced quality/speed |
| **Implementation** | GLM 4.7 | Haiku 4.5 | Quality critical, native code skills |
| **Planning** | GLM 4.7 | Haiku 4.5 | Complex reasoning, multi-step |
| **Research** | GLM 4.7 | Haiku 4.5 | Multi-repo analysis, external sources |
| **Code Review** | GLM 4.7 | Sonnet 4.6 | Security & quality are CRITICAL |
| **Validation** | GPT-5 Nano | Haiku 4.5 | Lightweight format checking |
| **Architecture** | Sonnet 4.6 | - | Premium reasoning, no fallback |

### Cost Optimization

- **Haiku 4.5:** Lightweight read-only, exploration, validation
- **GLM 4.7:** Default heavy lifting (coding, planning, analysis)
- **Sonnet 4.6:** Architecture & design decisions (premium)
- **GPT-5 Nano:** Validation & format checks (ultra-light)

---

## 🚨 Fallback Behavior

### Fallback Triggers
1. **Network timeout** (API unavailable)
2. **Model rate limit** (quota exceeded)
3. **Agent fails** (error in execution)
4. **Cost threshold** (automatic cost optimization)

### Fallback Chain
```
explore (Haiku)
    ↓ fails
explore-fallback (MiniMax M2.5)
    ↓ fails
Error: No fallback available

executor (GLM 4.7)
    ↓ fails
executor-fallback (Haiku 4.5)
    ↓ fails
Error: No fallback available
```

---

## 🔀 Agent Conversation Flow

### Single-Agent Task
```
User Input
    → Agent reads opencode.json for rules
    → Agent loads relevant skills
    → Agent executes task
    → Produces summary + confidence
```

### Multi-Agent Task (Orchestrator)
```
User: "Implement X"
    → [orchestrator] Classify intent
    → [metis] Analyze gaps
    → [prometheus-lite] Plan (interview → plan → review)
    → [momus] Validate plan
    → [executor] Implement wave 1
    → [validator] QA wave 1
    → [code-reviewer] Review wave 1
    → [executor] Implement wave 2
    → ... repeat
    → [executor] git commit
```

---

## 📊 Agent Capabilities Matrix

| Agent | Read | Write | Search | Analyze | Design | Review | Validate | Plan |
|---|---|---|---|---|---|---|---|---|
| explore | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| general | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| librarian | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| executor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| architect | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| code-reviewer | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| validator | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| prometheus-lite | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| orchestrator | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎓 Agent Prompts & Personas

### Key Directive Patterns

**Read-Only Agents:**
```
You are READ-ONLY. You cannot modify, write, or patch files.
Do not attempt to use bash tools to execute code.
```

**Executor Safety:**
```
Focus ONLY on the assigned task — do not expand scope.
Follow existing code patterns (check AGENTS.md, package.json).
Use defensive programming — null checks, early returns.
After changes, verify they work (run tests, lint, build).
No hallucinated imports — only use existing packages.
Declare all files you modify.
```

**Code Reviewer Confidence:**
```
Only report issues you are >80% confident about.
Skip stylistic preferences unless violating project conventions.
Skip issues in unchanged code unless CRITICAL security.
Consolidate similar issues into one finding.
```

**Orchestrator Hierarchy:**
```
NEVER use Read, Write, Edit, Bash, grep, glob tools directly.
ALWAYS dispatch to the appropriate subagent.
If you catch yourself about to do work → STOP and dispatch instead.
```

---

## 🔗 Agent Integration Points

### Shared Context
- **opencode.json:** All agents read configuration
- **AGENTS.md:** Architectural guidelines and standards
- **Skills:** All agents can invoke via skill tool
- **MCPs:** Shared tool providers (memory, ast-grep, context7, etc.)

### State Management
- **.agents/plans/:** Output from prometheus-lite (readable by orchestrator)
- **.agents/drafts/:** Interview notes and decision records
- **Memory MCP:** Persistent context across agent calls
- **Sequential Thinking MCP:** Chain-of-thought reasoning

---

## ⚡ Performance Characteristics

| Agent | Latency | Token Efficiency | Use For |
|---|---|---|---|
| **Haiku 4.5** | ⚡⚡⚡ (fastest) | ⭐⭐⭐⭐⭐ (best) | Read, search, validate |
| **GLM 4.7** | ⚡⚡ (medium) | ⭐⭐⭐⭐ (good) | Code, planning, analysis |
| **Sonnet 4.6** | ⚡ (slowest) | ⭐⭐⭐ (acceptable) | Architecture, complex design |
| **MiniMax M2.5** | ⚡⚡⚡ (fastest) | ⭐⭐⭐⭐⭐ (best) | Fallback, constrained |
| **GPT-5 Nano** | ⚡⚡⚡ (fastest) | ⭐⭐⭐⭐⭐ (best) | Validation only |

---

## 🏗️ Hidden Agent Management

### Why Hidden?
- Internal use only (not dispatched by users)
- Auto-fallbacks if primary fails
- Part of larger workflows (orchestrator, prometheus)

### Hidden Agents
- **explore-fallback**, **librarian-fallback**, **executor-fallback**
- **metis**, **momus** (planning governance)
- **transform**, **validator** (internal QA)
- **build-error-resolver**, **refactor-cleaner** (cleanup)
- **tdd-guide** (testing enforcement)

---

## 🔍 Debugging Agent Issues

### Common Failures

| Error | Cause | Recovery |
|---|---|---|
| "Agent timeout" | Long-running task | Dispatch to orchestrator with wave planning |
| "Model unavailable" | API down or quota exceeded | Automatic fallback to secondary model |
| "Hallucinated import" | Agent invented dependency | Validator catches; executor must fix |
| "Scope creep" | Task expanded beyond assigned | Code reviewer flags; executor recommits |

### Diagnostics
1. Check **opencode.json** for agent configuration
2. Review **AGENTS.md** for directive compliance
3. Load agent-specific skill (e.g., systematic-debugging, test-fixing)
4. Check **Memory MCP** for context persistence
5. Review `.agents/plans/` for current task breakdown

---

## 📈 Agent Load Distribution

### Typical Task Wave (Orchestrator Pattern)
```
Wave 1 (Parallel, ~2 min):
  ├─ @explore: Find similar patterns in codebase (1-2 min)
  ├─ @librarian: Research docs/best practices (1-2 min)
  ├─ @general: Analyze dependent modules (1-2 min)
  └─ @executor: Write implementation for task 1 (1-3 min)
  
Wave 2 (After Wave 1, Parallel, ~2 min):
  ├─ @validator: Check executor outputs (1 min)
  ├─ @code-reviewer: QA the code (1-2 min)
  └─ @executor: Write implementation for task 2 (1-3 min)

Wave 3+: Repeat pattern until complete

Final Wave (Serial, ~1 min):
  ├─ @code-reviewer: Final security review (1 min)
  └─ @executor: git commit & push (0.5 min)
```

**Total estimated time:** 5-15 minutes for medium-sized features  
**Parallelism factor:** 3-4x speedup vs serial execution

---

## 🎯 Agent Selection Guide

### User asks: "How should I...?"
→ Use **skill-chooser** to find appropriate skill  
→ Load skill via skill tool  
→ Agent executes skill instructions

### User asks: "What does X do?"
→ Dispatch **explore** (fast read-only search)  
→ Or **general** (deeper analysis)

### User asks: "Show me examples"
→ Dispatch **librarian** (GitHub + docs research)

### User asks: "Implement X"
→ Invoke **orchestrator** + **prometheus-lite** (planning)  
→ Wait for user GO  
→ Execute plan via orchestrator waves

### User asks: "Fix build error"
→ Dispatch **build-error-resolver** (minimal diffs)

### User asks: "Review code"
→ Dispatch **code-reviewer** (security + quality)

---

**Confidence Score:** 0.98  
**Last Verified:** 2026-03-06 against opencode.json  
**Freshness:** Agent definitions current, all prompts included

