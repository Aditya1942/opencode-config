# OpenCode Config — Superpowers + Antigravity

A production-ready [OpenCode.ai](https://opencode.ai) configuration with the [Superpowers](https://github.com/obra/superpowers) skill framework, Claude Code MCP specialization, and Antigravity model providers.

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

Primary agents route work through the **claude** or **agent** worker CLI via shell (see docs). Subagents sequencer, executor, explorer, architect, and code-reviewer use the chosen CLI or run locally as needed.

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| `build` (primary) | User-selected | primary | Default agent; worker-selection then chosen CLI via shell; for big/multi-step spawns @sequencer then @executor |
| `plan` | User-selected | primary | Planning only; must spawn @ultron for plan (per-step skills + worker), then optional validation via CLI |
| `orchestrator` | User-selected | primary | PURE dispatcher: routes to @explorer, @sequencer then @executor, or worker CLI via shell; never does task work directly |
| `sequencer` | Claude Sonnet | subagent | Big task → worker-selection → chosen CLI via shell to produce ordered plan; spawn first for multi-step work |
| `executor` | Claude Haiku | subagent | Takes plan → chosen CLI via shell to execute steps sequentially (validate + review per step); spawn after sequencer |
| `explorer` | Claude Haiku | subagent | Read-only codebase summary via chosen CLI (explore/ask mode); use for mapping or onboarding |
| `ultron` | Claude Sonnet | subagent | Planning sub-agent (planner merged): skill-chooser + worker-selection per step; phases, testing, risks; no execution |
| `architect` | Claude Sonnet | subagent | Architecture specialist: system design, scalability, trade-offs, ADRs; for features or large refactors |
| `code-reviewer` | Claude Sonnet | subagent | Code review: quality, security, maintainability; use after code changes before claiming done |

See docs/worker-selection-guide.md for CLI routing and when to use claude vs agent.

### 97 Skills

**My Skills** (`my-skills/`):
A consolidated collection of 95+ skills for AI agents covering frontend, backend, code review, documentation, planning, and more (e.g. `brainstorming`, `plan-writing`, `ultron-planning`, `clean-code`, `frontend-design`, `react-best-practices`).

**Config:**
update-config

### Custom Commands

| Command | Purpose |
|---------|---------|
| `/which-skill` | Auto-detect best skill(s) for current task |
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create detailed implementation plan |
| `/execute-plan` | Execute plan in batches with review checkpoints |
| `/readme-first` | README-first workflow; keep README in sync after code changes |
| `/init-readme` | Initialize or refresh README.md for a package/module |
| `/remember-this` | Save compact memory (decisions, gotchas) for current module |
| `/recall` | Retrieve stored memory for a module or topic |
| `/ultron` | Get plan with per-step skills and worker assignment (spawns @ultron) |
| `/antigravity-quota` | Check Antigravity API quota (plugin-provided) |

---

## Agents, Tools & MCPs (full list)

### Agents

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| **build** | User-selected | primary | Default agent; worker-selection then chosen CLI via shell; for big tasks spawn @sequencer then @executor |
| **plan** | User-selected | primary | Planning only; must spawn @ultron for plan (per-step skills + worker), then optional validation via CLI |
| **orchestrator** | User-selected | primary | PURE dispatcher: @explorer, @sequencer then @executor, or worker CLI via shell |
| **sequencer** | Claude Sonnet | subagent | Big task → chosen CLI via shell to produce ordered plan |
| **executor** | Claude Haiku | subagent | Executes plan steps via chosen CLI (validate + review per step) |
| **explorer** | Claude Haiku | subagent | Read-only codebase summary via chosen CLI (explore/ask) |
| **ultron** | Claude Sonnet | subagent | Planning sub-agent (planner merged): skill-chooser + worker-selection per step; structured plan, no execution |
| **architect** | Claude Sonnet | subagent | Architecture specialist: system design, scalability, ADRs |
| **code-reviewer** | Claude Sonnet | subagent | Code review: quality, security, maintainability; use after code changes |

Worker choice: docs/worker-selection-guide.md.

### Commands (slash)

| Command | Purpose |
|---------|---------|
| `/which-skill` | Auto-detect best skill(s) for current task |
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create implementation plan with tasks |
| `/execute-plan` | Execute plan in batches with checkpoints |
| `/readme-first` | README-first workflow; keep README in sync after changes |
| `/init-readme` | Initialize or refresh README.md for package/module |
| `/remember-this` | Save compact memory for current module |
| `/recall` | Retrieve stored memory for module or topic |
| `/ultron` | Plan with per-step skills and worker assignment (spawns @ultron) |
| `/antigravity-quota` | Check Antigravity API quota (plugin-provided) |

### Skills

| Collection | Skills |
|------------|--------|
| **my-skills** | Consolidated directory with 95+ skills (e.g. `brainstorming`, `plan-writing`, `ultron-planning`, `react-best-practices`) |
| **Config** | update-config |

Use the `skill` tool to load skills; never read `SKILL.md` directly.

### MCP Servers (7)

| Server | Category | Description | Key tools / features |
|--------|----------|-------------|----------------------|
| **memory** | Memory / Context | Persistent knowledge graph | entities, observations, cross-session memory |
| **sequential-thinking** | Reasoning | Step-by-step reasoning | thought steps, revision, branching; optional logging |
| **time** | Utilities | Time data | current time, timezone conversion |
| **ast-grep** | Code Search | Structural code search (AST) | find_code, find_code_by_rule, dump_syntax_tree |
| **context7** | Web / Search | Library documentation | resolve-library-id, get-library-docs |
| **grep-app** | Web / Search | GitHub code search | searchCode, grep_query |
| **web-search** | Web / Search | Free web search + URL fetching | search_web, fetch_url; no API key |

Planning/execution use the **claude** or **agent** worker CLI via shell (see docs/cli-claude-code.md, docs/cli-cursor-agent.md), not an MCP. MCP config: `opencode.json`.

### Plugins

| Plugin | Purpose |
|--------|---------|
| `my-skills.js` | Bootstrap: injects skill framework via system prompt |
| `custom-hooks.js` | Context window monitor, tool output truncator, model fallback, preemptive compaction, rules injector |

---

## Manual Installation

If you prefer to install manually instead of using the one-liner:

```bash
# 1. Clone this repo
git clone https://github.com/Aditya1942/opencode-config.git ~/.config/opencode

# 2. Install dependencies
cd ~/.config/opencode && bun install

# 3. Install the MCP bridge globally and load the launch agent
npm install -g --prefix ~/.local mcp-proxy
mkdir -p ~/Library/LaunchAgents ~/.config/opencode/logs
ln -sf ~/.config/opencode/mcp/claude-code-mcp.plist ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist
launchctl kickstart -k "gui/$(id -u)/io.aditya.opencode.claude-code-mcp"

# 4. Restart OpenCode
```

See [.opencode/INSTALL.md](.opencode/INSTALL.md) for the full detailed guide with verification steps and troubleshooting.

---

## Updating

```bash
# Update this config
cd ~/.config/opencode && git pull
```

Or inside OpenCode, run `/update-config`.

---

## Directory Structure

```
~/.config/opencode/
├── opencode.json               # Main config (models, agents, commands, providers, MCP)
├── AGENTS.md                   # Agent instructions and coding standards
├── package.json                # Dependencies (@opencode-ai/plugin)
├── plugins/
│   ├── my-skills.js            # Bootstrap plugin (skill framework)
│   ├── custom-hooks.js         # Combined hooks plugin
│   └── hooks/                  # Individual hook implementations
├── skills/
│   ├── my-skills/              # Consolidated skills directory (95+ skills)
│   └── update-config/          # Update config skill
├── .agents/
│   ├── plans/                  # Implementation plans
│   └── drafts/                 # Draft plans and interview notes
├── docs/                       # Guides (worker-selection, CLI refs, ultron-design, etc.)
└── .opencode/
    └── INSTALL.md              # Agent-executable installation guide
```

---

## Requirements

- [OpenCode.ai](https://opencode.ai)
- Git
- Bun (or Node.js)
- Antigravity auth (optional — for Antigravity model providers)
- At least one worker CLI on PATH for planning/execution: **claude** (Claude Code) or **agent** (Cursor); see docs/cli-claude-code.md, docs/cli-cursor-agent.md

---

## License

Personal configuration.
