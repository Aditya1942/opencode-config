# Installing OpenCode Config (Superpowers + Antigravity)

This document is designed for an AI agent to follow step-by-step to install this OpenCode configuration on a user's machine. Follow every step in order. Do NOT skip steps.

## What This Installs

- **OpenCode configuration** with multi-model Antigravity provider support (Claude, Gemini)
- **My Skills collection** — 91+ consolidated workflow and domain skills (TDD, debugging, React, etc.)
- **Claude Code MCP profiles** — all three primary agents maximize `claude-code` usage for planning, exploration, implementation, validation, review, docs, cleanup, and architecture work
- **Custom slash commands** (`/brainstorm`, `/write-plan`, `/execute-plan`, `/antigravity-quota`)
- **MCP servers** — memory, sequential-thinking, time, ast-grep, context7, grep-app, web-search, claude-code

---

## Prerequisites

Before starting, verify these are installed. If any are missing, inform the user and help them install.

### Required

| Tool | Check Command | Install |
|------|--------------|---------|
| [OpenCode.ai](https://opencode.ai) | `opencode --version` | See [opencode.ai](https://opencode.ai) |
| Git | `git --version` | `brew install git` (macOS) or system package manager |
| Bun (preferred) or Node.js | `bun --version` or `node --version` | `curl -fsSL https://bun.sh/install \| bash` |

### Optional (for full functionality)

| Tool | Purpose |
|------|---------|
| Antigravity Auth | Required for Antigravity model providers (Claude/Gemini via Google proxy) |
| Playwright | Browser automation (`npx playwright install`) |
| Claude Code CLI | Required behind the `claude-code` MCP bridge (`claude --version`) |

---

## Installation Steps

### Step 1: Back Up Existing Configuration

If the user has an existing OpenCode config, back it up first.

```bash
if [ -d ~/.config/opencode ]; then
  cp -r ~/.config/opencode ~/.config/opencode.backup.$(date +%Y%m%d%H%M%S)
  echo "Backed up existing config to ~/.config/opencode.backup.*"
fi
```

### Step 2: Clone This Repository

```bash
git clone https://github.com/Aditya1942/opencode-config.git ~/.config/opencode
```

If the directory already exists (from backup step), clone to a temp location and merge:

```bash
# If ~/.config/opencode already exists as a git repo, just pull latest
if [ -d ~/.config/opencode/.git ]; then
  cd ~/.config/opencode && git pull origin main
else
  # Clone fresh
  git clone https://github.com/Aditya1942/opencode-config.git ~/.config/opencode
fi
```

### Step 3: Install Dependencies

```bash
cd ~/.config/opencode && bun install
```

If bun is not available, fall back to npm:

```bash
cd ~/.config/opencode && npm install
```

This installs the `@opencode-ai/plugin` package required by the superpowers plugin.

### Step 4: Install the Global Claude Code MCP Bridge

```bash
npm install -g --prefix ~/.local mcp-proxy
mkdir -p ~/Library/LaunchAgents ~/.config/opencode/logs
ln -sf ~/.config/opencode/mcp/claude-code-mcp.plist ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/io.aditya.opencode.claude-code-mcp.plist
launchctl kickstart -k "gui/$(id -u)/io.aditya.opencode.claude-code-mcp"
curl -fsS http://127.0.0.1:4318/mcp >/dev/null || true
```

This exposes the custom `claude-code` MCP at `http://127.0.0.1:4318/mcp` for OpenCode and other MCP-aware IDEs.

### Step 5: Verify File Structure

After installation, the directory should look like this. Verify key files exist:

```bash
# Verify core config files
ls ~/.config/opencode/opencode.json
ls ~/.config/opencode/package.json
ls ~/.config/opencode/AGENTS.md

# Verify plugin
ls -l ~/.config/opencode/plugins/custom-hooks.js
ls -l ~/.config/opencode/mcp/claude-code-server.mjs
ls -l ~/.config/opencode/mcp/claude-code-bridge.sh
ls -l ~/.config/opencode/mcp/claude-code-mcp.plist

# Verify skills
ls ~/.config/opencode/skills/my-skills/

# Verify custom skills
ls ~/.config/opencode/skills/team-agents/SKILL.md
ls ~/.config/opencode/skills/update-config/SKILL.md
```

If any of these checks fail, report the specific failure to the user.

### Step 6: Restart OpenCode

Tell the user to restart OpenCode for changes to take effect:

```text
Please restart OpenCode to load the new configuration.
```

---

## Verification

After restart, verify the installation by asking the user to confirm these work:

1. **Skills loaded**: Check the skill tool to list available skills — should show `my-skills/`, `update-config`, and `team-agents` skills.
2. **Commands available**: Try `/brainstorm` — should invoke the brainstorming skill.
3. **Primary agents configured**: Check that `build`, `plan`, and `orchestrator` are visible in the agent hierarchy and that each is described as routing work through `claude-code`.
4. **Claude profiles available**: Verify `claude-code_list_profiles` is available and returns profiles like `planner`, `explore`, `executor`, `validator`, and `code-reviewer`.
5. **MCP servers connected**: Verify MCP tools like `ast-grep_find_code`, `context7_resolve-library-id`, `web-search_search_web`, `claude-code_plan_task`, and `claude-code_list_profiles` are available.
6. **Bridge reachable**: `curl -i http://127.0.0.1:4318/mcp` should return an HTTP response from the local bridge.

---

## Post-Installation: Model Provider Setup

### Antigravity Models (Default)

This config uses Google Antigravity as the default provider for Claude and Gemini models. The user needs:

1. An Antigravity account (configured via `antigravity-accounts.json` — this file is gitignored for security)
2. The `opencode-antigravity-auth@latest` plugin handles authentication

Ask the user if they have Antigravity access. If not, they can change the models in `opencode.json` to use standard providers (Anthropic, Google AI Studio, etc.).

### Switching to Standard Providers

If the user doesn't have Antigravity, guide them to update `opencode.json`:

- Change `google/antigravity-claude-*` models to `anthropic/claude-*` equivalents
- Change `google/antigravity-gemini-*` to `google/gemini-*` equivalents
- Remove the `opencode-antigravity-auth@latest` plugin entry

---

## Updating

### Update This Config

```bash
cd ~/.config/opencode && git pull origin main
```

Or invoke the update-config skill inside OpenCode:

```
Use the update-config skill to update config.
```

---

## Troubleshooting

### Plugin Not Loading

1. Ensure `@opencode-ai/plugin` is installed: `ls ~/.config/opencode/node_modules/@opencode-ai/`
2. Check OpenCode logs for errors

### Skills Not Found

1. Check skills exist: `ls ~/.config/opencode/skills/my-skills/`
2. Use the `skill` tool to list what's discovered

### Agents Not Working

1. Verify `opencode.json` has the `agent` section with `build`, `plan`, and `orchestrator` defined
2. Verify the `claude-code` MCP is connected and `claude-code_list_profiles` is available
3. Verify the prompts for `build`, `plan`, and `orchestrator` explicitly route planning, execution, verification, and review through Claude Code profiles
4. Antigravity models require auth — ensure `antigravity-accounts.json` is configured

### MCP Servers Not Connecting

1. Check `opencode.json` has the `mcp` section configured
2. Verify MCP server packages are installed (some require npm/npx)
3. Check the server entry in `opencode.json` for its exact command and environment
4. Common servers and their requirements:
   - `ast-grep`: Requires ast-grep CLI (`brew install ast-grep`)
   - `context7`: No external dependencies
   - `web-search`: No external dependencies (uses DuckDuckGo/SearXNG)
   - `claude-code`: Requires the `claude` CLI on `PATH`, an authenticated Claude Code setup, and the localhost bridge service at `http://127.0.0.1:4318/mcp`

### Tool Mapping (for Skills Written for Claude Code)

When skills reference Claude Code tools, OpenCode uses these equivalents:

| Claude Code Tool | OpenCode Equivalent |
|-----------------|---------------------|
| `TodoWrite` | `update_plan` |
| `Task` (subagents) | `@mention` syntax |
| `Skill` tool | OpenCode's native `skill` tool |
| `Read`, `Write`, `Edit`, `Bash` | Your native tools |

---

## Directory Structure (After Installation)

```
~/.config/opencode/
├── .opencode/
│   └── INSTALL.md              # This file
├── opencode.json               # Main config (models, agents, commands, providers, MCP)
├── AGENTS.md                   # Agent instructions and coding standards
├── README.md                   # Repository overview
├── package.json                # Dependencies (@opencode-ai/plugin)
├── node_modules/               # Installed packages
├── mcp/
│   ├── claude-code-server.mjs  # Custom Claude Code CLI MCP server
│   ├── claude-code-bridge.sh   # Localhost HTTP bridge launcher
│   └── claude-code-mcp.plist   # launchd service definition for the bridge
├── .agents/
│   ├── plans/                  # Implementation plans (generated by prometheus-lite)
│   └── drafts/                 # Draft plans and interview notes
├── docs/
│   ├── guides/                 # User guides (model management, etc.)
│   └── prometheus-metis-momus-paste.md  # Paste-able planning agents
├── plugins/
│   └── custom-hooks.js         # Combined hooks plugin
└── skills/
    ├── my-skills/              # Consolidated skills directory (91+ skills)
    ├── team-agents/            # Multi-agent coding architecture skill
    │   └── SKILL.md
    └── update-config/          # Update config skill
        └── SKILL.md
```

---

## Getting Help

- **This config**: [github.com/Aditya1942/opencode-config](https://github.com/Aditya1942/opencode-config)
- **OpenCode.ai**: [opencode.ai](https://opencode.ai)
