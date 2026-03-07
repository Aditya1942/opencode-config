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

OpenCode now uses a single primary agent layer and pushes as much work as possible into the `claude-code` MCP, with token-heavy work explicitly routed there.

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| `build` (primary) | User-selected | build/plan | Default agent; maximizes Claude Code usage for planning, execution, validation, and review |
| `plan` | User-selected | build/plan | Planning-focused entry point using Claude Code for planning plus plan validation/review |
| `orchestrator` | User-selected | build/plan | Coordination-focused entry point using Claude Code end-to-end, with mandatory review/verification on change-producing flows |

Instead of OpenCode subagents, the repo uses Claude Code profiles such as `planner`, `explore`, `general`, `librarian`, `executor`, `validator`, `code-reviewer`, `architect`, `build-error-resolver`, `refactor-cleaner`, `doc-updater`, and `tdd-guide`. Token-heavy work like exploration, broad code comprehension, and research should be routed through Claude Code rather than handled locally. For any task that produces changes, Claude-backed validation and review are expected before completion. See the `team-agents` skill for routing guidance.

### 91+ Skills

**My Skills** (`my-skills/`):
A consolidated collection of 91 skills for AI agents covering frontend, backend, code review, documentation updates, testing, and more (e.g. `brainstorming`, `plan-writing`, `clean-code`, `frontend-design`, `react-best-practices`, etc.).

**Orchestration & Config:**
team-agents, update-config

### Custom Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create detailed implementation plan |
| `/execute-plan` | Execute plan in batches with review checkpoints |
| `/claude-code-usage` | Show Claude Code MCP usage and API quota |
| `/antigravity-quota` | Check Antigravity API quota for all accounts |

---

## Agents, Tools & MCPs (full list)

### Agents

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| **build** | User-selected | primary | Default agent; maximizes `claude-code` MCP usage for planning, execution, validation, and review |
| **plan** | User-selected | primary | Planning-focused entry point using Claude Code for planning plus plan validation/review |
| **orchestrator** | User-selected | primary | Coordination-focused entry point using Claude Code end-to-end, with mandatory review/verification on change-producing flows |

Routing details: load the **team-agents** skill.

### Commands (slash)

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create implementation plan with tasks |
| `/execute-plan` | Execute plan in batches with checkpoints |
| `/claude-code-usage` | Show Claude Code MCP usage (from .opencode/claude-code-usage.json) and API quota |
| `/antigravity-quota` | Check Antigravity API quota (plugin) |

### Skills

| Collection | Skills |
|------------|--------|
| **my-skills** | Consolidated directory with 91 varied skills (e.g. `brainstorming`, `plan-writing`, `react-best-practices`) |
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
| **claude-code** | Automation | Local MCP (started/stopped with OpenCode); custom Claude Code CLI wrapper | `list_profiles`, `list_agents`, `list_bridge_prompts`, `plan_task`, `execute_task`, `run_skill`, `run_prompt`; optional HTTP bridge at `http://127.0.0.1:4318/mcp` for other IDEs |

MCP config: `opencode.json`.

### Plugins

| Plugin | Purpose |
|--------|---------|
| `custom-hooks.js` | Context window monitor, tool output truncator, model fallback, preemptive compaction, rules injector, **claude-code MCP usage tracker** (writes `.opencode/claude-code-usage.json`) |

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
├── mcp/
│   ├── claude-code-server.mjs  # Custom Claude Code CLI MCP server
│   ├── claude-code-bridge.sh   # Localhost HTTP bridge launcher
│   └── claude-code-mcp.plist   # launchd service definition for the bridge
├── plugins/
│   ├── custom-hooks.js         # Combined hooks plugin
│   └── hooks/                  # Individual hook implementations
├── skills/
│   ├── my-skills/              # Consolidated skills directory (91+ skills)
│   ├── team-agents/            # Multi-agent routing skill
│   └── update-config/          # Update config skill
├── .agents/
│   ├── plans/                  # Implementation plans (generated by prometheus-lite)
│   └── drafts/                 # Draft plans and interview notes
├── docs/                       # Guides and design docs
└── .opencode/
    └── INSTALL.md              # Agent-executable installation guide
```

---

## Requirements

- [OpenCode.ai](https://opencode.ai)
- Git
- Bun (or Node.js)
- Antigravity auth (optional — for Antigravity model providers)
- Claude Code CLI (required for the `claude-code` local MCP)

---

## License

Personal configuration.
