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

A multi-agent system with an intelligent orchestrator that routes tasks to optimal models:

| Agent | Model | Mode | Role |
|-------|-------|------|------|
| `build` (primary) | User-selected | build/plan | Default agent, delegates complex tasks to orchestrator |
| `orchestrator` | Claude Opus 4.6 (Anthropic) | build/plan | Multi-agent coding orchestrator — decomposes tasks into microtasks, routes to optimal models, executes parallel agents, confidence-based escalation |
| `code-reviewer` | Gemini 3 Pro (Antigravity) | subagent | Post-implementation review |

The `orchestrator` agent owns all model routing decisions. It decomposes tasks into a dependency DAG, assesses complexity, dispatches to the right model tier (free → paid → Opus), validates with dual-mode confidence scoring, and enforces final correctness via Anthropic Claude Opus 4.6. See the `team-agents` skill for the full 19-section architecture spec.

### 24 Skills

**Core Superpowers** (from [obra/superpowers](https://github.com/obra/superpowers)):
brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, commit-and-push, using-git-worktrees, dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, writing-skills, using-superpowers

**Custom Skills** (claudepowers):
code-review, explanatory-output, feature-dev, frontend-design, hookify, plugin-dev, pr-review-toolkit, security-guidance

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
