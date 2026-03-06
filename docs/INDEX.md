# OpenCode Configuration Repository - Architecture Codemap

**Last Updated:** 2026-03-06  
**Repository:** OpenCode.ai Configuration  
**Type:** Config-only, multi-agent orchestration system  

---

## 🏗️ System Overview

OpenCode is a **multi-agent AI orchestration platform** that manages autonomous agents, skills, plugins, and model routing. It's a configuration-only repository (no application code) that bootstraps a sophisticated AI workflow system.

**Core Purpose:** Route complex tasks to specialized subagents, manage skill discovery, enforce architectural patterns (TDD, planning, code review), and coordinate multi-step development workflows.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode CLI / Build Agent                  │
│                    (User entry point)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  opencode.json   │
                    │  Configuration   │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼────────┐ ┌─────▼──────┐ ┌──────▼──────┐
    │  Agents (17)  │ │  MCPs (7)  │ │ Plugins (3) │
    │  Subagent     │ │  Tool       │ │ Bootstrap   │
    │  Dispatch     │ │  Integration│ │ System      │
    └──────┬────────┘ └─────┬──────┘ └──────┬──────┘
           │                │               │
           │      ┌─────────┴───────────────┤
           │      │                       │
    ┌──────▼──────────────┐     ┌────────▼──────────┐
    │  Agent Types:       │     │  MCP Servers:     │
    │  - Primary          │     │  - memory         │
    │  - Subagent         │     │  - sequential     │
    │  - Fallback         │     │  - time           │
    │                     │     │  - ast-grep       │
    │  Orchestration:     │     │  - context7       │
    │  - Orchestrator     │     │  - grep-app       │
    │  - Prometheus-lite  │     │  - web-search     │
    │  - Metis/Momus      │     └────────┬──────────┘
    └──────┬──────────────┘              │
           │                             │
           └─────────────┬───────────────┘
                         │
                  ┌──────▼──────────┐
                  │  Skills (93)    │
                  │  - my-skills    │
                  │  - team-agents  │
                  │  - update-config│
                  └────────────────┘
```

---

## 🎯 Entry Points

| Entry Point | Type | Purpose |
|---|---|---|
| **opencode.json** | Config file | Central configuration hub for agents, MCPs, plugins, commands |
| **build agent** | Primary | Default user-facing agent; delegates to orchestrator |
| **orchestrator agent** | Conductor | PURE dispatcher; coordinates multi-step tasks |
| **skill-chooser** | Router | Analyzes requests, recommends best skills |
| **plugins/my-skills.js** | Bootstrap | Injects skill framework into system prompt |
| **.agents/plans/** | Output | Generated execution plans from prometheus-lite |

---

## 🔧 Key Modules

### Core Configuration Files

| File | Type | Purpose | Scope |
|---|---|---|---|
| **opencode.json** | JSON config | Agent definitions, MCP registration, command templates | Root |
| **AGENTS.md** | Documentation | Architecture guidelines, coding standards, agent hierarchy | Root |
| **plugins/my-skills.js** | Bootstrap plugin | Injects skill framework via system prompt | Runtime |
| **plugins/custom-hooks.js** | Custom plugin | User-specific plugin extensions | Runtime |
| **package.json** | Package mgmt | Single dependency: @opencode-ai/plugin | Root |
| **.gitignore** | VCS config | Excludes node_modules, .env, secrets, superpowers/ | VCS |

### Agent Ecosystem (17 total)

| Agent | Model | Mode | Role | Dispatch Rule |
|---|---|---|---|---|
| **build** | User-selected | Primary | Default entry; routes complex tasks | `/orchestrate [task]` |
| **orchestrator** | User-selected | Conductor | PURE dispatcher, never does work | Central coordinator |
| **explore** | Claude Haiku 4.5 | Subagent | Read-only codebase search & mapping | `@explore [query]` |
| **explore-fallback** | MiniMax M2.5 | Subagent | Fallback explorer | Auto-fallback |
| **general** | GLM 4.7 | Subagent | Code comprehension, multi-file analysis | `@general [analyze]` |
| **librarian** | GLM 4.7 | Subagent | Research docs, GitHub examples, best practices | `@librarian [research]` |
| **librarian-fallback** | Claude Haiku 4.5 | Subagent | Fallback librarian | Auto-fallback |
| **executor** | GLM 4.7 | Subagent | Write/edit files, run commands, implement microtasks | `@executor [task]` |
| **executor-fallback** | Claude Haiku 4.5 | Subagent | Fallback executor | Auto-fallback |
| **transform** | GLM 4.7 | Subagent (hidden) | Mechanical refactoring (no logic changes) | Internal only |
| **validator** | GPT-5 Nano | Subagent (hidden) | Output validation & format checking | Internal only |
| **code-reviewer** | GLM 4.7 | Subagent | Security & quality review (React/Node.js) | `@code-reviewer [review]` |
| **architect** | Claude Sonnet 4.6 | Subagent | System design, ADRs, trade-off analysis | `@architect [design]` |
| **build-error-resolver** | GLM 4.7 | Subagent (hidden) | Minimal diffs for build/type errors | Internal only |
| **refactor-cleaner** | GLM 4.7 | Subagent (hidden) | Dead code cleanup, duplicates | Internal only |
| **doc-updater** | Claude Haiku 4.5 | Subagent | Codemap generation, documentation maintenance | Internal only |
| **tdd-guide** | GLM 4.7 | Subagent (hidden) | TDD enforcement, test-first methodology | Internal only |
| **prometheus-lite** | User-selected | Planning | Strategic planning, never writes code | Interview → Plan → Execute |
| **metis** | GLM 4.7 | Subagent (hidden) | Pre-planning gap analysis & intent classification | Internal to prometheus |
| **momus** | GLM 4.7 | Subagent (hidden) | Plan executability verification | Internal to prometheus |

**Primary Models:** GLM 4.7 (zai-coding-plan) dominates execution  
**Cost Optimization:** Haiku for lightweight tasks (explore, doc-updater), Nano for validation

---

## 📡 MCP Servers (Model Context Protocol)

| MCP Server | Command | Purpose | Use Cases |
|---|---|---|---|
| **memory** | npx @modelcontextprotocol/server-memory | Persistent knowledge graph | Agent memory, context persistence |
| **sequential-thinking** | npx @modelcontextprotocol/server-sequential-thinking | Chain-of-thought reasoning | Complex problem decomposition |
| **time** | uvx mcp-server-time | Timezone-aware time utilities | Scheduling, timestamp handling |
| **ast-grep** | uvx git+https://github.com/ast-grep/ast-grep-mcp | AST pattern matching | Structural code search & refactoring |
| **context7** | npx @upstash/context7-mcp | Official documentation lookup | Library research, API specs |
| **grep-app** | uvx grep-mcp | GitHub code search | Open-source examples, patterns |
| **web-search** | npx @zhafron/mcp-web-search | Web search integration | General research, docs discovery |

---

## 🧠 Skill Collections (93 total skills)

### my-skills/ Directory (85 skills)
Primary collection of domain-specific and architectural skills organized into:

- **Frontend Development** (11): react-patterns, react-ui-patterns, react-best-practices, frontend-design, tailwind-patterns, etc.
- **Backend & Architecture** (12): fastapi-pro, api-patterns, api-design-principles, langchain-architecture, etc.
- **AI/ML Systems** (10): ai-engineer, llm-evaluation, rag-engineer, langgraph, crewai, multi-agent-patterns, etc.
- **Testing & Quality** (8): javascript-testing-patterns, python-testing-patterns, test-fixing, debugging-strategies, systematic-debugging, etc.
- **Mobile Development** (6): react-native-architecture, mobile-design, android-jetpack-compose-expert, etc.
- **Advanced Patterns** (15): typescript-advanced-types, prompt-engineering, clean-code, error-handling-patterns, etc.
- **Documentation & Tools** (10): wiki-architect, documentation-templates, mermaid-expert, automation tools, etc.
- **Language Mastery** (13): javascript-mastery, python-pro, typescript-expert, java-pro, kotlin-coroutines-expert, etc.

### team-agents/ Directory
- Subagent routing & delegation patterns
- Multi-agent orchestration workflows
- Fallback chain management

### update-config/ Directory
- Config updates from upstream
- Model management utilities
- Dependency synchronization

---

## 🔄 Data Flow & Execution Model

### Request → Response Flow

```
User Input
    │
    ▼
┌──────────────────────┐
│  Build Agent         │  Entry point checks for slash commands
│  (+ skill-chooser)   │  → /brainstorm, /write-plan, /execute-plan, @orchestrator
└──────────┬───────────┘
           │
    ┌──────▼──────────┐
    │ Orchestrator    │  PURE DISPATCHER PATTERN:
    │ (if requested)  │  1. Dispatch @metis for intent analysis
    │                 │  2. Dispatch @prometheus-lite for planning
    │ + Planning Team │  3. Dispatch @momus for plan review
    │ (Metis/Momus)   │  4. Execute plan in parallel waves
    └──────┬──────────┘  5. Dispatch @validator/@code-reviewer
           │              6. Commit via @executor
    ┌──────▼──────────────────────────────────────┐
    │  Parallel Task Waves                        │
    │  (Orchestrator dispatches multiple agents)  │
    │                                              │
    │  - @explore: Search & map codebase          │
    │  - @librarian: Research docs & examples     │
    │  - @general: Analyze & comprehend code      │
    │  - @executor: Write/edit code               │
    │  - @transform: Mechanical refactoring       │
    │  - @code-reviewer: QA & security review     │
    │  - @validator: Output validation            │
    └──────┬───────────────────────────────────────┘
           │
    ┌──────▼──────────┐
    │  Result         │  Agent synthesizes & presents to user
    │  Synthesis      │  Includes: changes made, files modified,
    │                 │  verification results, confidence score
    └──────────────────┘
```

### Skill Invocation Pattern

```
Task Identified
    │
    ▼
[skill-chooser agent analyzes task]
    │
    ├─ Extracts intent signals
    ├─ Scores 93 skills by keyword match
    ├─ Returns top 1-3 recommendations
    │
    ▼
[Skill tool loads SKILL.md]
    │
    ├─ Reads YAML frontmatter
    ├─ Executes workflow checklist
    ├─ Returns domain-specific instructions
    │
    ▼
[Agent follows skill instructions]
```

### Planning Workflow (Orchestrator + Prometheus Lite)

```
User: "Implement feature X"
    │
    ▼
@orchestrator dispatches @metis
    │
    ├─ Classify intent (Refactoring | Build | Mid-sized | etc.)
    ├─ Pre-analysis: launch @explore/@librarian for context
    ├─ Ask clarifying questions
    │
    ▼
@orchestrator dispatches @prometheus-lite
    │
    ├─ INTERVIEW PHASE:
    │  ├─ Record decisions in .agents/drafts/
    │  └─ Verify clearance (scope, objectives, approach, tests)
    │
    ├─ PLAN GENERATION PHASE:
    │  ├─ Call @metis for final gap analysis
    │  ├─ Generate .agents/plans/{name}.md
    │  ├─ Define parallel waves (5-8 tasks each)
    │  └─ Include QA scenarios
    │
    ├─ PLAN REVIEW (optional):
    │  └─ @momus verifies references, executability
    │
    ▼
Plan ready for execution
    │
    └─ User reviews: "Plan is ready. Run `/start-work {name}` to execute."
        │
        ▼
    @orchestrator dispatches execution waves
        │
        ├─ Wave 1: Parallel @executor tasks
        ├─ @validator & @code-reviewer verify outputs
        ├─ Wave 2: More parallel tasks
        ├─ ... repeat until complete
        │
        ▼
    @executor commits via git
```

---

## 🔌 Plugin Architecture

| Plugin | Type | Purpose | Location |
|---|---|---|---|
| **my-skills.js** | Bootstrap | Injects skill framework, loads skill-chooser | `plugins/my-skills.js` |
| **custom-hooks.js** | Custom | User-defined hooks and extensions | `plugins/custom-hooks.js` |
| **opencode-antigravity-auth** | External | Authentication for Antigravity API quota | `opencode.json` reference |

**Plugin Behavior:**
- Bootstrap at runtime via `opencode.json::plugin` array
- Executed before agent prompts to inject system context
- Can define custom tools, modify agent behavior, register MCPs

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| **@opencode-ai/plugin** | Latest | Official plugin system (ONLY declared dependency) |
| **@modelcontextprotocol/** | Via npx | MCP servers (npm tools) |
| **@upstash/context7-mcp** | Latest | Context7 library research |
| **@zhafron/mcp-web-search** | Latest | Web search integration |
| **ast-grep** | Latest | Code pattern matching |

**Note:** This is a config-only repo. Actual dependencies are managed dynamically via `npx -y` for tools and MCPs.

---

## 📋 Command System

| Command | Template | Purpose |
|---|---|---|
| **/brainstorm** | Invoke brainstorming skill | Before ANY creative work (mandatory) |
| **/write-plan** | Create implementation plan with tasks | Before implementation (mandatory) |
| **/execute-plan** | Execute plan in batches with checkpoints | Implement confirmed plans |
| **/antigravity-quota** | Check API quota | Monitor usage limits |
| **@explore** | Dispatch explore agent | Codebase search & mapping |
| **@orchestrator** | Dispatch orchestrator | Complex multi-step tasks |
| **@librarian** | Dispatch librarian | Research & documentation lookup |

---

## 🏛️ Configuration Standards

### Code Style
- **JavaScript/Plugins:** ES Modules only, `const` arrow functions, `camelCase`, 2-space indents, defensive null checks
- **Skills:** YAML frontmatter (name + description), kebab-case dirs, imperative tone
- **JSON:** `$schema` included, kebab-case naming, focused inline prompts

### Architectural Principles (AGENTS.md §4)
1. **Iron Law of Skills:** If a skill might apply (1% chance), invoke it first
2. **Single Source of Truth:** Generate docs from code; don't manually write
3. **Serial Collapse Prevention:** Maximize parallelism in task execution
4. **Defensive Programming:** Null checks + early returns over broad try/catch
5. **No Hallucinated Imports:** Only use declared packages

### Git Conventions
- Small, atomic, frequent commits
- Use worktrees for feature isolation
- **Gitignored:** `node_modules/`, `bun.lock`, `superpowers/`, `.env`, `.opencode/opencode.json` (secrets)
- `superpowers/` is upstream; don't commit into it from here

---

## 🔐 Security & Safeguards

| Safeguard | Location | Purpose |
|---|---|---|
| **Executor Microtasks** | @executor prompt | Never expand scope beyond assigned task |
| **Code-Reviewer QA** | Agent + pre-commit | Security, React/Node.js patterns, performance |
| **Validator Output Check** | @validator prompt | Detect hallucinated imports, schema errors |
| **Secrets Management** | .gitignore | Exclude .env, API keys, antigravity-accounts.json |
| **Read-Only Agents** | @explore, @architect prompts | Prevent unintended file modifications |

---

## 📊 Agent Fallback Chain

**Primary → Fallback routing:**
- `explore` (Haiku 4.5) → `explore-fallback` (MiniMax M2.5 Free)
- `general` (GLM 4.7) → fallback if unavailable
- `librarian` (GLM 4.7) → `librarian-fallback` (Haiku 4.5)
- `executor` (GLM 4.7) → `executor-fallback` (Haiku 4.5)
- Hidden agents (metis, momus, transform, etc.) auto-fallback if primary fails

**Fallback Criteria:** Network timeout, model unavailability, API rate limits, cost constraints.

---

## 📈 System Capacity

| Metric | Value | Note |
|---|---|---|
| **Total Agents** | 17 visible + 6 hidden | 23 agent definitions |
| **Total Skills** | 93 | Organized into 8 categories |
| **MCP Servers** | 7 | Tool integration endpoints |
| **Parallel Wave Capacity** | 5-8 tasks | Typical orchestrator execution |
| **Skill Keyword Coverage** | ~500 keywords | For skill-chooser matching |
| **Config Size** | ~48 KB | opencode.json |

---

## 🚀 Workflow Patterns

### Pattern 1: TDD-First Development
```
User requests feature
    → skill-chooser recommends tdd-guide + brainstorming
    → orchestrator + prometheus-lite create plan
    → Plan specifies RED-GREEN-REFACTOR cycles
    → @executor runs tests first, then implementation
    → @code-reviewer verifies coverage >80%
```

### Pattern 2: Multi-Repo Research
```
User asks for best practices
    → @librarian dispatches @context7 + @grep-app + @web-search
    → Returns quoted code snippets + source links
    → Distinguishes official vs community patterns
```

### Pattern 3: Code Review Merge
```
Code written by @executor
    → @code-reviewer checks CRITICAL + HIGH issues
    → Runs git diff to see staged + unstaged changes
    → Returns verdict: APPROVE / WARNING / BLOCK
    → @executor commits only if APPROVE
```

### Pattern 4: Codebase Exploration
```
User asks "How does auth work?"
    → @explore uses lsp_find_references + ast_grep
    → Maps all usages, data flow, dependencies
    → @general synthesizes multi-file analysis
```

---

## ⚡ Quick Reference

### Invoke Skills
```bash
# Via skill tool (recommended)
/skill brainstorming
/skill test-driven-development
/skill systematic-debugging
```

### Common Commands
```bash
# Planning
/brainstorm
/write-plan
/execute-plan

# Dispatch agents
@orchestrator Implement X
@explore Find pattern Y
@librarian Research Z
@code-reviewer Review changes
```

### Model Selection
```
Fast reads:    Claude Haiku 4.5
Mid-range:     GLM 4.7 (primary choice)
Complex:       Claude Sonnet 4.6
Lightweight:   GPT-5 Nano
```

---

## 🔍 How to Navigate This System

1. **For developers:** Read AGENTS.md for coding standards, git workflows, anti-patterns
2. **For orchestration:** Load team-agents skill to understand subagent routing
3. **For skills:** Use skill-chooser agent; never read SKILL.md files directly
4. **For architecture:** Load architecture skill or dispatch @architect agent
5. **For plans:** Check `.agents/plans/` for current work streams and generated execution plans

---

## 📝 Related Documentation

- **AGENTS.md** — Full architecture guide, agent hierarchy, code style, anti-patterns
- **.agents/plans/** — Generated execution plans from prometheus-lite
- **.agents/drafts/** — Interview notes and decision records
- **skills/** — 93 domain-specific skill packs organized by category

---

**Confidence Score:** 0.95  
**Last Generated:** 2026-03-06 by doc-updater agent  
**Freshness:** All config verified against opencode.json as of 15:40 UTC

