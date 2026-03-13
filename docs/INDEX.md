# OpenCode Configuration Repository — Architecture

**Last Updated:** 2026-03-08  
**Type:** Config-only; agent skills, plugins, orchestration.

---

## System Overview

OpenCode is a **configuration-only** repo: agents, skills, plugins, MCP servers, and slash commands. No application code. Runtime: Bun/Node.js; single dependency: `@opencode-ai/plugin`.

**Core purpose:** Primary agents and subagents (sequencer, executor, explore, ultron) do planning, execution, and exploration using tools. See [AGENTS.md](../AGENTS.md).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode CLI / Build Agent                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  opencode.json   │
                    └────────┬─────────┘
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼────────┐ ┌─────▼──────┐ ┌──────▼──────┐
    │  Agents (7)   │ │  MCPs (7)  │ │  Plugins     │
    │  build, plan, │ │  memory,   │ │  my-skills,  │
    │  orchestrator,│ │  sequential│ │  custom-hooks│
    │  sequencer,   │ │  time,     │ │  antigravity │
    │  executor,    │ │  ast-grep, │ └──────────────┘
    │  explore,     │ │  context7, │
    │  ultron       │ │  grep-app, │
    └──────┬────────┘ │  web-search│
           │          └─────┬──────┘
           └────────────┬────┘
                        │
                 ┌──────▼──────────┐
                 │  Skills (96+)  │
                 │  my-skills,     │
                 │  update-config  │
                 └─────────────────┘
```

---

## Entry Points

| Entry Point | Purpose |
|-------------|---------|
| **opencode.json** | Source of truth: agents, commands, MCP, plugins (keys: `agent`, `command`) |
| **AGENTS.md** (root) | Agent hierarchy, slash commands, skills table, coding standards |
| **build** | Default agent; exploration → @explore; big/multi-step → @sequencer then @executor; small → do work directly |
| **orchestrator** | PURE dispatcher; routes to @explore, @sequencer then @executor, or delegate |
| **plan** | Planning only; must spawn @ultron; optional validation via executor or directly |
| **plugins/my-skills.js** | Bootstrap: skill tool (loads SKILL.md from skills) |
| **.agents/plans/** | Implementation plans (output) |

---

## Agents (7)

| Agent | Model | Mode | Role |
|-------|--------|------|------|
| **build** | user-selected | primary | Big/multi-step → @sequencer then @executor; else do work directly using tools |
| **plan** | user-selected | primary | Must spawn @ultron for plan; optional validation via executor or directly; no implementation |
| **orchestrator** | user-selected | primary | PURE dispatcher: @explore, @sequencer then @executor, or delegate |
| **sequencer** | Claude Sonnet | subagent | Big task → tools → ordered plan; spawn first |
| **executor** | Claude Haiku | subagent | Plan → tools → execute steps (validate + review per step); spawn after sequencer |
| **explore** | Claude Haiku | subagent | Read-only codebase summary using tools |
| **ultron** | Claude Sonnet | subagent | Planning: skill-chooser per step; structured plan only; no execution |

Subagents do planning and execution using tools (Read, Write, Edit, Bash).

---

## MCP Servers (7)

| MCP | Purpose |
|-----|---------|
| **memory** | Persistent knowledge graph (entities, observations) |
| **sequential-thinking** | Chain-of-thought reasoning |
| **time** | Timezone-aware time utilities |
| **ast-grep** | Structural code search (AST) |
| **context7** | Library documentation lookup |
| **grep-app** | GitHub code search |
| **web-search** | Web search + URL fetch (no API key) |

---

## Skills (97)

- **my-skills/** — 95+ domain and workflow skills (frontend, backend, testing, planning, etc.)
- **update-config** — Config update from upstream

Use the **skill** tool; never read SKILL.md directly. See [SKILLS.md](SKILLS.md) for categories.

---

## Related Docs

- [AGENTS.md](AGENTS.md) (this folder) — Agent deep dive (7 agents)
- [../AGENTS.md](../AGENTS.md) — Full agent hierarchy, slash commands, skills table, code style
- [ultron-design.md](ultron-design.md) — Ultron planning sub-agent
- [config-change-checklist.md](config-change-checklist.md) — Files to update on config changes
