# Installing OpenCode Config (Superpowers + Antigravity)

This document is designed for an AI agent to follow step-by-step to install this OpenCode configuration on a user's machine. Follow every step in order. Do NOT skip steps.

## What This Installs

- **OpenCode configuration** with multi-model Antigravity provider support (Claude, Gemini)
- **My Skills collection** — 95+ consolidated workflow and domain skills (TDD, debugging, planning, React, etc.)
- **Worker CLI routing** — primary agents use the claude or agent CLI via shell for planning, exploration, implementation, validation, and review (docs/cli-claude-code.md, docs/cli-cursor-agent.md)
- **Custom slash commands** — `/which-skill`, `/brainstorm`, `/write-plan`, `/execute-plan`, `/readme-first`, `/init-readme`, `/remember-this`, `/recall`, `/ultron`, `/antigravity-quota` (plugin)
- **MCP servers (7)** — memory, sequential-thinking, time, ast-grep, context7, grep-app, web-search

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
| Claude Code CLI | For worker CLI path: planning/execution via `claude` (`claude --version`) |
| Cursor CLI (agent) | For worker CLI path: planning/execution via `agent` (`agent --version`) |

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

### Step 4: Verify worker CLI (for planning/execution)

Agents run the **claude** or **agent** CLI via shell for planning and execution. Ensure at least one is available:

```bash
claude --version   # Claude Code CLI (optional)
agent --version   # Cursor CLI (optional)
```

See docs/cli-claude-code.md and docs/cli-cursor-agent.md for syntax.

### Step 5: Verify File Structure

After installation, the directory should look like this. Verify key files exist:

```bash
# Verify core config files
ls ~/.config/opencode/opencode.json
ls ~/.config/opencode/package.json
ls ~/.config/opencode/AGENTS.md

# Verify plugins
ls -l ~/.config/opencode/plugins/my-skills.js
ls -l ~/.config/opencode/plugins/custom-hooks.js

# Verify CLI docs (worker CLI via shell)
ls ~/.config/opencode/docs/cli-claude-code.md
ls ~/.config/opencode/docs/cli-cursor-agent.md
ls ~/.config/opencode/docs/worker-selection-guide.md

# Verify skills
ls ~/.config/opencode/skills/my-skills/

# Verify custom skills
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

1. **Skills loaded**: Check the skill tool to list available skills — should show `my-skills/` and `update-config` skills.
2. **Commands available**: Try `/brainstorm` — should invoke the brainstorming skill.
3. **Agents configured**: Check that `build`, `plan`, `orchestrator`, `sequencer`, `executor`, `explore`, `ultron`, `architect`, and `code-reviewer` are visible in the agent hierarchy; primary agents route work through the worker CLI (claude or agent) via shell; ultron is the planning sub-agent (planner merged: skill-chooser + worker-selection per step); architect and code-reviewer are specialist subagents.
4. **Worker CLI**: Verify at least one of `claude --version` or `agent --version` succeeds if you want planning/execution via CLI. See docs/cli-claude-code.md and docs/cli-cursor-agent.md.
5. **MCP servers (7) connected**: Verify MCP tools like `ast-grep_find_code`, `context7_resolve-library-id`, and `web-search_search_web` are available. Planning/execution use worker CLIs via shell, not an MCP.

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

1. Verify `opencode.json` has the `agent` section with `build`, `plan`, `orchestrator`, `sequencer`, `executor`, `explore`, `ultron`, `architect`, and `code-reviewer` defined
2. Verify worker CLI (optional): run `claude --version` or `agent --version` if using CLI for planning/execution
3. Verify the prompts route planning, execution, verification, and review through the worker CLI (claude or agent) via shell per docs
4. Antigravity models require auth — ensure `antigravity-accounts.json` is configured

### MCP Servers Not Connecting

1. Check `opencode.json` has the `mcp` section configured
2. Verify MCP server packages are installed (some require npm/npx)
3. Check the server entry in `opencode.json` for its exact command and environment
4. Common servers and their requirements:
   - `ast-grep`: Requires ast-grep CLI (`brew install ast-grep`)
   - `context7`: No external dependencies
   - `web-search`: No external dependencies (uses DuckDuckGo/SearXNG)
   - Worker CLI: For planning/execution, agents run `claude` or `agent` via shell; ensure at least one is on PATH and authenticated. See docs/cli-claude-code.md and docs/cli-cursor-agent.md.

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
├── plugins/
│   ├── my-skills.js            # Bootstrap plugin (skill framework)
│   ├── custom-hooks.js         # Combined hooks plugin
│   └── hooks/                  # Individual hook implementations
├── skills/
│   ├── my-skills/              # Consolidated skills directory (95+ skills)
│   └── update-config/          # Update config skill
│       └── SKILL.md
├── .agents/
│   ├── plans/                  # Implementation plans
│   └── drafts/                 # Draft plans and interview notes
└── docs/                       # Guides and CLI references
    ├── cli-claude-code.md      # Claude Code CLI reference (worker CLI via shell)
    ├── cli-cursor-agent.md     # Cursor Agent CLI reference (worker CLI via shell)
    ├── worker-selection-guide.md  # When to use claude vs agent
    ├── ultron-design.md        # Ultron planning sub-agent design
    ├── config-change-checklist.md
    └── guides/                 # User guides (e.g. model management)
```

---

## Getting Help

- **This config**: [github.com/Aditya1942/opencode-config](https://github.com/Aditya1942/opencode-config)
- **OpenCode.ai**: [opencode.ai](https://opencode.ai)
