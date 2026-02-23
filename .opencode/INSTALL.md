# Installing OpenCode Config (Superpowers + Antigravity)

This document is designed for an AI agent to follow step-by-step to install this OpenCode configuration on a user's machine. Follow every step in order. Do NOT skip steps.

## What This Installs

- **OpenCode configuration** with multi-model Antigravity provider support (Claude, Gemini)
- **Superpowers skill framework** — 15 core workflow skills (TDD, debugging, planning, etc.)
- **Custom skills** — 5 domain-specific skills (code review, frontend design, security, etc.)
- **Orchestrator agent** — token-efficient conductor following mandatory 6-step workflow: Intent Gate → Plan → Review → Parallel Execute → Verify → Ship
- **Planning agents** — prometheus-lite (strategic planner), metis (pre-planning consultant), momus (plan reviewer)
- **Custom slash commands** (`/brainstorm`, `/write-plan`, `/execute-plan`, `/antigravity-quota`)
- **MCP servers** — memory, sequential-thinking, time, ast-grep, context7, grep-app, web-search, cloudflare

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

### Step 4: Clone Superpowers (Separate Repository)

The superpowers skill framework lives in a separate repository and is gitignored from this config.

```bash
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
```

### Step 5: Create Symlinks

The plugin and skills need symlinks to connect superpowers into OpenCode's discovery paths.

#### 5a. Symlink the Superpowers Plugin

```bash
mkdir -p ~/.config/opencode/plugins
rm -f ~/.config/opencode/plugins/superpowers.js
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/superpowers.js
```

#### 5b. Symlink Superpowers Skills

```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/superpowers
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers
```

### Step 6: Verify File Structure

After installation, the directory should look like this. Verify key files exist:

```bash
# Verify core config files
ls ~/.config/opencode/opencode.json
ls ~/.config/opencode/package.json
ls ~/.config/opencode/AGENTS.md

# Verify plugin
ls -l ~/.config/opencode/plugins/superpowers.js

# Verify skills symlink
ls -l ~/.config/opencode/skills/superpowers

# Verify superpowers repo
ls ~/.config/opencode/superpowers/README.md

# Verify custom skills
ls ~/.config/opencode/skills/claudepowers/
ls ~/.config/opencode/skills/team-agents/SKILL.md
ls ~/.config/opencode/skills/update-config/SKILL.md
```

If any of these checks fail, report the specific failure to the user.

### Step 7: Restart OpenCode

Tell the user to restart OpenCode for changes to take effect:

```text
Please restart OpenCode to load the new configuration.
```

---

## Verification

After restart, verify the installation by asking the user to confirm these work:

1. **Skills loaded**: Ask OpenCode: *"Do you have superpowers?"* — it should confirm the skill framework is active.
2. **Skill tool works**: Use the `skill` tool to list available skills — should show `superpowers/`, `claudepowers/`, `update-config`, and `team-agents` skills.
3. **Commands available**: Try `/brainstorm` — should invoke the brainstorming skill.
4. **Agents configured**: Check that `orchestrator`, `prometheus-lite`, `metis`, `momus`, and `code-reviewer` agents are visible in the agent hierarchy.
5. **MCP servers connected**: Verify MCP tools like `ast-grep_find_code`, `context7_resolve-library-id`, `web-search_search_web` are available.

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
Use the update-config skill to update superpowers and configuration.
```

### Update Superpowers

```bash
cd ~/.config/opencode/superpowers && git pull
```

---

## Troubleshooting

### Plugin Not Loading

1. Check plugin symlink: `ls -l ~/.config/opencode/plugins/superpowers.js`
2. Check source exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
3. Ensure `@opencode-ai/plugin` is installed: `ls ~/.config/opencode/node_modules/@opencode-ai/`
4. Check OpenCode logs for errors

### Skills Not Found

1. Check skills symlink: `ls -l ~/.config/opencode/skills/superpowers`
2. Verify it points to: `~/.config/opencode/superpowers/skills`
3. Check custom skills exist: `ls ~/.config/opencode/skills/claudepowers/`
4. Use the `skill` tool to list what's discovered

### Agents Not Working

1. Verify `opencode.json` has the `agent` section with `build`, `orchestrator`, and `code-reviewer` defined
2. Check that the orchestrator model (uses currently selected session model) is accessible
3. Antigravity models require auth — ensure `antigravity-accounts.json` is configured
4. For planning agents (prometheus-lite, metis, momus), verify they're defined in the agent section

### MCP Servers Not Connecting

1. Check `opencode.json` has the `mcpServers` section configured
2. Verify MCP server packages are installed (some require npm/npx)
3. Check `MCP-README.md` for server-specific installation instructions
4. Common servers and their requirements:
   - `ast-grep`: Requires ast-grep CLI (`brew install ast-grep`)
   - `context7`: No external dependencies
   - `web-search`: No external dependencies (uses DuckDuckGo/SearXNG)
   - `cloudflare`: Requires Cloudflare account and API token

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
├── MCP-README.md               # MCP server configuration guide
├── package.json                # Dependencies (@opencode-ai/plugin)
├── node_modules/               # Installed packages
├── .sisyphus/
│   ├── plans/                  # Implementation plans (generated by prometheus-lite)
│   └── drafts/                 # Draft plans and interview notes
├── docs/
│   ├── guides/                 # User guides (model management, etc.)
│   └── prometheus-metis-momus-paste.md  # Paste-able planning agents
├── plugins/
│   └── superpowers.js          # Symlink → superpowers/.opencode/plugins/superpowers.js
├── skills/
│   ├── superpowers/            # Symlink → superpowers/skills/ (15 core skills)
│   ├── claudepowers/           # 5 custom domain-specific skills
│   │   ├── code-review/
│   │   ├── explanatory-output/
│   │   ├── frontend-design/
│   │   ├── readme-driven-code-understanding/
│   │   └── security-guidance/
│   ├── team-agents/            # Multi-agent coding architecture skill
│   │   └── SKILL.md
│   └── update-config/          # Update superpowers and config skill
│       └── SKILL.md
└── superpowers/                # Cloned from github.com/obra/superpowers (gitignored)
    ├── skills/                 # 15 core workflow skills
    ├── .opencode/
    │   └── plugins/
    │       └── superpowers.js  # Source plugin file
    └── ...
```

---

## Getting Help

- **This config**: [github.com/Aditya1942/opencode-config](https://github.com/Aditya1942/opencode-config)
- **Superpowers**: [github.com/obra/superpowers](https://github.com/obra/superpowers)
- **OpenCode.ai**: [opencode.ai](https://opencode.ai)
