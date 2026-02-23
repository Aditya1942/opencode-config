# OpenCode Config — Superpowers + Antigravity

A production-ready [OpenCode.ai](https://opencode.ai) configuration with the [Superpowers](https://github.com/obra/superpowers) skill framework, multi-tier subagent orchestration, and Antigravity model providers.

---

## One-Liner Install (for LLMs)

Paste this into any OpenCode, Claude Code, or LLM-powered coding agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Aditya1942/opencode-config/refs/heads/main/.opencode/INSTALL.md
```

The agent will fetch the installation document and execute every step to set up this config on your machine.

---

## What's Included

### Configuration

| File | Purpose |
|------|---------|
| `opencode.json` | Models, agents, commands, custom providers |
| `AGENTS.md` | Agent instructions, coding standards, skill system docs |
| `package.json` | Dependencies (`@opencode-ai/plugin`) |

### Agent Architecture

A multi-agent system with a token-efficient orchestrator conductor:

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| `build` (primary) | User-selected | build/plan | Default agent, routes complex tasks to orchestrator |
| `orchestrator` | User-selected | build/plan | Token-efficient conductor — PURE DISPATCHER (never does work directly) |
| `code-reviewer` | GLM 4.7 | subagent | Post-implementation review |

The `orchestrator` runs a mandatory 6-step workflow: (1) dispatch @metis for intent gate, (2) dispatch @prometheus-lite for planning, (3) dispatch @momus for plan review + user confirmation, (4) dispatch parallel execution via @executor/@explore/@librarian/@transform, (5) dispatch @validator + @code-reviewer for verification, (6) dispatch commit. **Orchestrator is a PURE DISPATCHER — it never does work directly.** See the `team-agents` skill for the full architecture spec.

### 24 Skills

**Core Superpowers** (from [obra/superpowers](https://github.com/obra/superpowers)):
brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, commit-and-push, using-git-worktrees, dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, writing-skills, using-superpowers

**Custom Skills** (claudepowers):
code-review, explanatory-output, feature-dev, frontend-design, hookify, plugin-dev, security-guidance

**Orchestration**:
team-agents (multi-agent coding architecture with provider-aware routing, confidence system, and escalation logic)

### Custom Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create detailed implementation plan |
| `/execute-plan` | Execute plan in batches with review checkpoints |
| `/update-superpowers` | Pull latest superpowers from git |
| `/antigravity-quota` | Check Antigravity API quota for all accounts |

---

## Agents, tools & MCPs (full list)

### Agents

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| **build** | User-selected | primary | Default agent; delegates complex tasks to orchestrator |
| **orchestrator** | User-selected | primary | Token-efficient conductor — PURE DISPATCHER (never does work directly) |
| **explore** | Claude Haiku 4.5 | subagent | Codebase mapping, contextual search, LSP/ast_grep/ripgrep (read-only) |
| **explore-fallback** | GLM 5 Free | subagent (hidden) | Fallback when explore fails |
| **general** | GLM 4.7 | subagent | Code comprehension, multi-file analysis, dependency maps |
| **librarian** | Claude Haiku 4.5 | subagent | Research: docs, multi-repo, GitHub examples, library best practices |
| **librarian-fallback** | GLM 5 Free | subagent (hidden) | Fallback when librarian fails |
| **transform** | MiniMax M2.5 Free | subagent (hidden) | Renames, formatting, simple refactors (no logic changes) |
| **validator** | GPT-5 Nano | subagent (hidden) | Output validation, format checks, hallucination detection |
| **executor** | Claude Haiku 4.5 | subagent | Implements microtasks from orchestrator; full tool access |
| **executor-fallback** | MiniMax M2.5 Free | subagent (hidden) | Fallback when executor fails |
| **code-reviewer** | GLM 4.7 | subagent | Post-implementation review vs plan and standards |
| **prometheus-lite** | Claude Haiku 4.5 | subagent | Strategic planner; interview → Metis → plan in `.sisyphus/plans/` (no code) |
| **metis** | Claude Haiku 4.5 | subagent (hidden) | Pre-planning consultant; intent classification, gap analysis (read-only) |
| **momus** | Claude Haiku 4.5 | subagent (hidden) | Plan reviewer; executable plans, valid references (read-only) |

Routing details: load the **team-agents** skill.

### Commands (slash)

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create implementation plan with tasks |
| `/execute-plan` | Execute plan in batches with checkpoints |
| `/antigravity-quota` | Check Antigravity API quota (plugin) |

### Skills

| Collection | Skills |
|------------|--------|
| **superpowers** (symlinked) | brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, commit-and-push, using-git-worktrees, dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, writing-skills, using-superpowers |
| **claudepowers** | code-review, explanatory-output, feature-dev, frontend-design, hookify, plugin-dev, security-guidance |
| **Orchestration** | team-agents |
| **Config** | update-config |

Use the `skill` tool to load skills; never read `SKILL.md` directly.

### MCP servers

| Server | Category | Description | Key tools / features |
|--------|----------|-------------|----------------------|
| **everything** | Reference / Testing | Demo of MCP capabilities | echo, add numbers, progress, resources, prompts |
| **filesystem** | File System | Secure file operations | read/write files, list dirs, search; allowed: `/Users/aditya` |
| **memory** | Memory / Context | Persistent knowledge graph | entities, observations, cross-session memory |
| **sequential-thinking** | Reasoning | Step-by-step reasoning | thought steps, revision, branching; optional logging |
| **fetch** | Web / Search | Web content retrieval | fetch URL, HTML→markdown, pagination |
| **git** | Version Control | Git operations | clone, status, commits, branches, PRs |
| **time** | Utilities | Time data | current time, timezone, date arithmetic |
| **ast-grep** | Code Search | Structural code search (AST) | find_code, find_code_by_rule, dump_syntax_tree; used by Explore |
| **context7** | Web / Search | Library documentation | resolve-library-id, get-library-docs; used by Librarian |
| **grep-app** | Web / Search | GitHub code search | searchCode, grep_query; used by Librarian |
| **web-search** | Web / Search | Free web search (multi-provider) | search_web, fetch_url; no API key; used by Librarian |

MCP config: `opencode.json` (connections), `mcp-servers.json` (catalog). See [MCP-README.md](MCP-README.md) for install and usage.

---

## Manual Installation

If you prefer to install manually instead of using the one-liner:

```bash
# 1. Clone this repo
git clone https://github.com/Aditya1942/opencode-config.git ~/.config/opencode

# 2. Install dependencies
cd ~/.config/opencode && bun install

# 3. Clone superpowers
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers

# 4. Symlink plugin
mkdir -p ~/.config/opencode/plugins
ln -sf ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/superpowers.js

# 5. Symlink skills
mkdir -p ~/.config/opencode/skills
ln -sfn ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers

# 6. Restart OpenCode
```

See [.opencode/INSTALL.md](.opencode/INSTALL.md) for the full detailed guide with verification steps and troubleshooting.

---

## Updating

```bash
# Update this config
cd ~/.config/opencode && git pull

# Update superpowers
cd ~/.config/opencode/superpowers && git pull
```

Or inside OpenCode, run `/update-superpowers`.

---

## Requirements

- [OpenCode.ai](https://opencode.ai)
- Git
- Bun (or Node.js)
- Antigravity auth (optional — for Antigravity model providers)

---

## License

Personal configuration. Superpowers framework is maintained at [github.com/obra/superpowers](https://github.com/obra/superpowers).
