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
| `opencode.json` | Models, agents, commands, custom providers, MCP servers |
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

### 21 Skills

**Core Superpowers** (from [obra/superpowers](https://github.com/obra/superpowers)):
brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, using-git-worktrees, dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, writing-skills, using-superpowers

**Custom Skills** (claudepowers):
code-review, explanatory-output, frontend-design, readme-driven-code-understanding, security-guidance

**Orchestration & Config:**
team-agents, update-config

### Custom Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create detailed implementation plan |
| `/execute-plan` | Execute plan in batches with review checkpoints |
| `/update-superpowers` | Pull latest superpowers and config from git |
| `/antigravity-quota` | Check Antigravity API quota for all accounts |

---

## Agents, Tools & MCPs (full list)

### Agents

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| **build** | User-selected | primary | Default agent; delegates complex tasks to orchestrator |
| **orchestrator** | User-selected | primary | Token-efficient conductor — PURE DISPATCHER (never does work directly) |
| **explore** | Claude Haiku 4.5 | subagent | Codebase mapping, contextual search, LSP/ast_grep/ripgrep (read-only) |
| **explore-fallback** | MiniMax M2.5 Free | subagent (hidden) | Fallback when explore fails |
| **general** | GLM 4.7 | subagent | Code comprehension, multi-file analysis, dependency maps |
| **librarian** | GLM 4.7 Flash | subagent | Research: docs, multi-repo, GitHub examples, library best practices |
| **librarian-fallback** | Claude Haiku 4.5 | subagent (hidden) | Fallback when librarian fails |
| **transform** | GLM 4.7 Flash | subagent (hidden) | Renames, formatting, simple refactors (no logic changes) |
| **validator** | GPT-5 Nano | subagent (hidden) | Output validation, format checks, hallucination detection |
| **executor** | GLM 4.7 Flash | subagent | Implements microtasks from orchestrator; full tool access |
| **executor-fallback** | Claude Haiku 4.5 | subagent (hidden) | Fallback when executor fails |
| **code-reviewer** | GLM 4.7 | subagent | Post-implementation review vs plan and standards |
| **prometheus-lite** | Claude Haiku 4.5 | subagent | Strategic planner; interview → Metis → plan in `.sisyphus/plans/` (no code) |
| **metis** | GLM 4.7 Flash | subagent (hidden) | Pre-planning consultant; intent classification, gap analysis (read-only) |
| **momus** | GLM 4.7 Flash | subagent (hidden) | Plan reviewer; executable plans, valid references (read-only) |

Routing details: load the **team-agents** skill.

### Commands (slash)

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create implementation plan with tasks |
| `/execute-plan` | Execute plan in batches with checkpoints |
| `/update-superpowers` | Pull latest superpowers and config from git |
| `/antigravity-quota` | Check Antigravity API quota (plugin) |

### Skills

| Collection | Skills |
|------------|--------|
| **superpowers** (symlinked) | brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, using-git-worktrees, dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, writing-skills, using-superpowers |
| **claudepowers** | code-review, explanatory-output, frontend-design, readme-driven-code-understanding, security-guidance |
| **Orchestration** | team-agents |
| **Config** | update-config |

Use the `skill` tool to load skills; never read `SKILL.md` directly.

### MCP Servers (8)

| Server | Category | Description | Key tools / features |
|--------|----------|-------------|----------------------|
| **memory** | Memory / Context | Persistent knowledge graph | entities, observations, cross-session memory |
| **sequential-thinking** | Reasoning | Step-by-step reasoning | thought steps, revision, branching; optional logging |
| **time** | Utilities | Time data | current time, timezone conversion |
| **ast-grep** | Code Search | Structural code search (AST) | find_code, find_code_by_rule, dump_syntax_tree; used by Explore |
| **context7** | Web / Search | Library documentation | resolve-library-id, get-library-docs; used by Librarian |
| **grep-app** | Web / Search | GitHub code search | searchCode, grep_query; used by Librarian |
| **web-search** | Web / Search | Free web search + URL fetching | search_web, fetch_url; no API key; used by Librarian |
| **cloudflare** | Infrastructure | Cloudflare management | Workers, KV, R2, D1, Durable Objects, Queues, AI, DNS |

MCP config: `opencode.json`.

### Plugins

| Plugin | Purpose |
|--------|---------|
| `superpowers.js` | Injects superpowers skill framework via system prompt transform |
| `custom-hooks.js` | Context window monitor, tool output truncator, model fallback, preemptive compaction, rules injector |

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

## Directory Structure

```
~/.config/opencode/
├── opencode.json               # Main config (models, agents, commands, providers, MCP)
├── AGENTS.md                   # Agent instructions and coding standards
├── package.json                # Dependencies (@opencode-ai/plugin)
├── plugins/
│   ├── superpowers.js          # Symlink → superpowers/.opencode/plugins/superpowers.js
│   ├── custom-hooks.js         # Combined hooks plugin
│   └── hooks/                  # Individual hook implementations
├── skills/
│   ├── superpowers/            # Symlink → superpowers/skills/ (15 core skills)
│   ├── claudepowers/           # 5 custom domain-specific skills
│   │   ├── code-review/
│   │   ├── explanatory-output/
│   │   ├── frontend-design/
│   │   ├── readme-driven-code-understanding/
│   │   └── security-guidance/
│   ├── team-agents/            # Multi-agent routing skill
│   └── update-config/          # Update superpowers and config skill
├── .sisyphus/
│   ├── plans/                  # Implementation plans (generated by prometheus-lite)
│   └── drafts/                 # Draft plans and interview notes
├── docs/                       # Guides and design docs
├── .opencode/
│   └── INSTALL.md              # Agent-executable installation guide
└── superpowers/                # Cloned from github.com/obra/superpowers (gitignored)
```

---

## Requirements

- [OpenCode.ai](https://opencode.ai)
- Git
- Bun (or Node.js)
- Antigravity auth (optional — for Antigravity model providers)

---

## License

Personal configuration. Superpowers framework is maintained at [github.com/obra/superpowers](https://github.com/obra/superpowers).
