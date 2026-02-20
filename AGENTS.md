# AGENTS.md — OpenCode Configuration Repository

## Project Overview

OpenCode.ai configuration repository: AI agent skills, plugins, orchestration config.
Runtime: Bun/Node.js. Single dependency: `@opencode-ai/plugin`.

## Repository Structure

```
opencode.json          # Agent/model/command configuration
plugins/superpowers.js # Bootstrap plugin — injects skill framework
skills/
  superpowers/         # Core workflow skills (TDD, debugging, planning, etc.)
  claudepowers/        # Domain skills (code review, frontend, security, etc.)
  team-agents/         # Subagent routing and delegation
commands/              # Slash command definitions
```

## Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Invoke brainstorming skill before creative work |
| `/write-plan` | Create implementation plan with tasks |
| `/execute-plan` | Execute plan in batches with checkpoints |
| `/antigravity-quota` | Check Antigravity API quota |

No build/test/lint commands — config-only repo. Use `bun test` if adding tests.

## Agent Hierarchy

| Agent | Model | Role | Mode |
|-------|-------|------|------|
| `build` | (user-selected) | Primary agent, delegates complex tasks | primary |
| `orchestrator` | (user-selected) | Plan → Confirm → Execute workflow | primary |
| `explore` | GLM 4.7 Flash | File reads, grep, directory listing | subagent |
| `explore-fallback` | GLM 5 Free | Fallback file explorer | subagent (hidden) |
| `general` | GLM 4.7 | Code comprehension, multi-file analysis | subagent |
| `transform` | MiniMax M2.5 Free | Renames, formatting, simple refactors | subagent (hidden) |
| `validator` | GPT-5 Nano | Output validation, format checks | subagent (hidden) |
| `executor` | GLM 4.7 | Primary code executor | subagent |
| `executor-sonnet` | Claude Sonnet 4.6 | Fallback executor (when executor fails) | subagent |
| `code-reviewer` | GLM 4.7 | Post-implementation review | subagent |

Full routing details: load `team-agents` skill.

## Skills

Skills live in `skills/<collection>/<skill-name>/SKILL.md` with YAML frontmatter.

**Iron Law:** If a skill might apply (even 1% chance), invoke it before doing anything else. Use the `skill` tool — never read SKILL.md files directly.

| Skill | When to Use |
|-------|-------------|
| `brainstorming` | Before ANY creative/feature work (mandatory) |
| `test-driven-development` | Before writing implementation code |
| `systematic-debugging` | When encountering bugs, before proposing fixes |
| `writing-plans` | When you have specs, before touching code |
| `executing-plans` | When you have a written plan to execute |
| `verification-before-completion` | Before claiming work is done |
| `commit-and-push` | When ready to commit |
| `using-git-worktrees` | For feature isolation before implementation |
| `code-review` | When reviewing PRs for bugs and quality |
| `security-guidance` | When editing files with security implications |

## Code Style

**JavaScript/Plugins:** ES Modules only (`import`/`export`, no CommonJS). `camelCase` for functions/variables, `PascalCase` for plugin exports. Prefer `const` arrow functions. Defensive programming (null checks, early returns) over broad try/catch.

**Skills/Markdown:** YAML frontmatter required (`name`, `description`). kebab-case directories. Imperative tone. Structure: Overview → When to Use → Checklist → Details → Anti-patterns.

**JSON configs:** Include `$schema`. kebab-case for agent/command names.

## Git Conventions

Small, frequent, atomic commits. Use worktrees for feature isolation.
Ignored: `node_modules/`, `bun.lock`, `superpowers/`, `antigravity-accounts.json`, `antigravity-logs/`.

## Anti-Patterns

1. **Serial collapse** — sequential work when tasks are parallelizable
2. **Spurious parallelism** — subagents without meaningful decomposition
3. **Skipping skills** — rationalizing a task is "too simple"
4. **Broad try/catch** — use defensive null checks instead
5. **CommonJS imports** — always ES Modules
6. **Reading skill files directly** — use the `skill` tool
