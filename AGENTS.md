# AGENTS.md — OpenCode Configuration Repository

## Project Overview

This is an OpenCode.ai configuration repository containing AI agent skills, plugins, and
orchestration config. Runtime: Bun/Node.js. Single dependency: `@opencode-ai/plugin`.

## Repository Structure

```
opencode.json          # Primary agent/model/command configuration
package.json           # Dependencies (minimal — only @opencode-ai/plugin)
plugins/
  superpowers.js       # Bootstrap plugin — injects skill framework into system prompt
skills/
  superpowers/         # 17 core workflow skills (TDD, debugging, planning, etc.)
  claudepowers/        # 8 domain-specific skills (code review, frontend, security, etc.)
  team-agents/         # Subagent orchestration and delegation skill
commands/
  update-superpowers.md  # Command to pull latest superpowers
  antigravity-quota.md   # Command to check Antigravity API quota
```

## Build / Lint / Test Commands

This is a configuration-only repository — no build step, test suite, or linter is configured.

```bash
# Install dependencies
bun install

# Pull latest superpowers skills (separate git repo)
git -C ~/.config/opencode/superpowers pull

# Validate JSON configs (manual check)
node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8'))"
```

There are no test commands. If you add tests, use Bun's built-in test runner (`bun test`).

## Custom Commands (defined in opencode.json)

| Command                | Purpose                                              |
|------------------------|------------------------------------------------------|
| `/brainstorm`          | Invoke brainstorming skill before any creative work  |
| `/write-plan`          | Create detailed implementation plan with tasks       |
| `/execute-plan`        | Execute plan in batches with review checkpoints      |
| `/antigravity-quota`   | Check Antigravity API quota for all accounts         |

## Agent Architecture

### Agent Hierarchy

| Agent              | Model                         | Role                                    | Mode      |
|--------------------|-------------------------------|-----------------------------------------|-----------|
| `build` (primary)  | (user-selected)               | Default primary agent, delegates complex tasks to orchestrator | primary |
| `orchestrator`     | (user-selected)               | Planning orchestrator — decomposes, plans, dispatches | primary (plan only) |
| `explore`          | GLM 5 Free (OpenCode Zen)     | File reads, grep, directory listing      | subagent  |
| `general`          | Kimi K2.5 Free (OpenCode Zen) | Code comprehension, multi-file analysis  | subagent  |
| `transform`        | MiniMax M2.5 Free (OpenCode Zen) | Renames, formatting, simple refactors | subagent (hidden) |
| `validator`        | GPT-5 Nano (OpenCode Zen)     | Output validation, format checks         | subagent (hidden) |
| `executor-sonnet`  | Claude Sonnet 4.6 (Anthropic) | Primary code generation, implementation  | subagent  |
| `executor`         | GLM 4.7 (`zai-coding-plan/glm-4.7`) | Fallback code executor              | subagent  |
| `code-reviewer`    | GLM 4.7 (`zai-coding-plan/glm-4.7`) | Post-implementation review          | subagent  |

### Orchestrator Architecture (Plan → Confirm → Execute)

The `orchestrator` agent is the central intelligence of the multi-agent system. It:
- Decomposes user tasks into a dependency DAG of microtasks
- Routes each microtask to the optimal model across a 3-tier cost hierarchy
- **Presents the plan to the user and waits for explicit confirmation**
- After confirmation, dispatches `executor-sonnet` (primary) or `executor` (fallback) subagents in build mode
- Validates outputs with dual-mode confidence scoring (self-report + independent assessment)
- Routes security and complex tasks to Claude Opus 4.6 via the Final Authority Rule (see team-agents skill)
- Operates in **plan mode only** — never writes code or edits files directly

### 3-Tier Model Routing

| Tier | Provider | Models | Purpose |
|------|----------|--------|---------|
| **Tier 0** (Free) | OpenCode Zen | GLM 5 Free, Kimi K2.5 Free, MiniMax M2.5 Free, Big Pickle, GPT-5 Nano | Exploration, reads, lightweight tasks |
| **Tier 1** (Anthropic + Z.AI) | Anthropic / Z.AI Coding Plan | Claude Sonnet 4.6 (primary), GLM 4.7 (fallback), GLM 4.7 Flash, GLM 4.7 FlashX | Code generation, execution, testing |
| **Tier 2** (Anthropic) | Anthropic | Claude Opus 4.6 | Complex reasoning, security, final authority |

The full architecture spec is in the `team-agents` skill (20 sections covering model routing,
plan-then-execute workflow, confidence system, escalation logic, memory architecture, swarm mode, and more).

## Skills System

Skills live in `skills/` with this structure:
```
skills/<collection>/<skill-name>/SKILL.md
```

### Skill File Format

```markdown
---
name: skill-name
description: "Brief description of when to use this skill"
---

# Skill Title
[Content with phases, checklists, anti-patterns, examples]
```

### Key Skills to Know

| Skill                        | When to Use                                        |
|------------------------------|----------------------------------------------------|
| `brainstorming`              | Before ANY creative/feature work (mandatory)       |
| `test-driven-development`    | Before writing implementation code                 |
| `systematic-debugging`       | When encountering bugs, before proposing fixes     |
| `writing-plans`              | When you have specs, before touching code           |
| `executing-plans`            | When you have a written plan to execute             |
| `verification-before-completion` | Before claiming work is done or passing         |
| `commit-and-push`            | When ready to commit (safety checks, splitting)    |
| `using-git-worktrees`        | For feature isolation before implementation         |
| `code-review`                | When reviewing PRs for bugs and quality             |
| `security-guidance`          | When editing files with security implications       |

### Iron Law

If a skill might apply (even 1% chance), **invoke it before doing anything else**.
Skills are loaded via the `skill` tool — never read SKILL.md files directly.

## Code Style Guidelines

### JavaScript / Plugin Code

**Module system**: ES Modules only (`import`/`export`). No CommonJS.

```javascript
// Correct
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
export const MyPlugin = async ({ client, directory }) => { ... };

// Wrong
const path = require('path');
module.exports = ...;
```

**Naming conventions**:
- Functions and variables: `camelCase` (`extractAndStripFrontmatter`, `normalizePath`)
- Constants: `camelCase` (no UPPER_SNAKE for module-level vars, except `__dirname`)
- Plugin exports: `PascalCase` (`SuperpowersPlugin`)

**Functions**: Prefer `const` arrow functions for module-level declarations.

```javascript
const myHelper = (input) => { ... };
export const MyPlugin = async ({ client, directory }) => { ... };
```

**Error handling**: Defensive programming — null checks, early returns, file existence
checks before reads. No try/catch unless handling a specific known error.

```javascript
// Good
if (!p || typeof p !== 'string') return null;
if (!fs.existsSync(skillPath)) return null;

// Avoid: broad try/catch swallowing errors
```

**Comments**:
- JSDoc block at file top describing the module's purpose.
- Inline comments for non-obvious logic only.
- No redundant comments restating the code.

```javascript
/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via system prompt transform.
 */

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => { ... };
```

**String handling**: Template literals for interpolation and multi-line strings.

### Skill / Markdown Files

**Frontmatter**: Required YAML frontmatter with `name` and `description` fields.

**Naming**: kebab-case for directories (`test-driven-development`). File is always `SKILL.md`.

**Tone**: Imperative, prescriptive ("Use", "Create", "Launch"). Not suggestive.

**Structure**:
1. Title (H1)
2. Overview / core principle
3. When to Use / When NOT to Use
4. Checklist (actionable steps)
5. Detailed phases with examples
6. Anti-patterns / common mistakes

**Formatting**: Bold for emphasis, code blocks for commands/code, tables for comparisons,
dot diagrams for complex workflows. Use emoji/symbols sparingly.

### Configuration Files (JSON)

- Always include `$schema` when available.
- Use descriptive string values for `description` fields.
- Agent names: lowercase kebab-case (`code-reviewer`, `explore-fallback`).
- Command names: lowercase kebab-case (`write-plan`, `execute-plan`).

## Git Conventions

- **Commits**: Small, frequent, logically atomic. Footer attribution enabled.
- **Branching**: Use worktrees for feature isolation when appropriate.
- **Ignored**: `node_modules/`, `bun.lock`, `superpowers/` (separate repo),
  `antigravity-accounts.json` (sensitive), `antigravity-logs/`.

## Key Anti-Patterns to Avoid

1. **Serial collapse** — doing sequential work when tasks are independent and parallelizable.
2. **Spurious parallelism** — spawning subagents without meaningful task decomposition.
3. **Skipping skills** — rationalizing that a task is "too simple" for the relevant skill.
4. **Broad try/catch** — swallowing errors instead of defensive null checks.
5. **CommonJS imports** — always use ES Modules.
6. **Reading skill files directly** — use the `skill` tool to load them.
