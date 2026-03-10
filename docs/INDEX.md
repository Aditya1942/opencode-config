# OpenCode Configuration Repository — Architecture

**Last Updated:** 2026-03-08  
**Type:** Config-only; agent skills, plugins, orchestration.

---

## System Overview

OpenCode is a **configuration-only** repo: agents, skills, plugins, MCP servers, and slash commands. No application code. Runtime: Bun/Node.js; single dependency: `@opencode-ai/plugin`.

**Core purpose:** Route tasks through the **claude** or **agent** worker CLI (via shell). Primary agents and subagents (sequencer, executor, explore, ultron) use the chosen CLI for planning, execution, and read-only exploration. See [worker-selection-guide.md](worker-selection-guide.md) and [AGENTS.md](../AGENTS.md).

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
| **build** | Default agent; worker-selection then CLI via shell or @sequencer then @executor |
| **orchestrator** | PURE dispatcher; routes to @explore, @sequencer then @executor, or worker CLI |
| **plan** | Planning only; must spawn @ultron; optional validation via CLI |
| **plugins/my-skills.js** | Bootstrap: injects skill framework |
| **.agents/plans/** | Implementation plans (output) |

---

## Agents (7)

| Agent | Model | Mode | Role |
|-------|--------|------|------|
| **build** | user-selected | primary | Worker-selection; big/multi-step → @sequencer then @executor; else worker CLI via shell |
| **plan** | user-selected | primary | Must spawn @ultron for plan; optional validation via CLI; no implementation |
| **orchestrator** | user-selected | primary | PURE dispatcher: @explore, @sequencer then @executor, or worker CLI via shell |
| **sequencer** | Claude Sonnet | subagent | Big task → chosen CLI via shell → ordered plan; spawn first |
| **executor** | Claude Haiku | subagent | Plan → chosen CLI via shell → execute steps (validate + review per step); spawn after sequencer |
| **explore** | Claude Haiku | subagent | Read-only codebase summary via chosen CLI (explore/ask) |
| **ultron** | Claude Sonnet | subagent | Planning: skill-chooser + worker-selection per step; structured plan only; no execution |

Worker CLI: [worker-selection-guide.md](worker-selection-guide.md), [cli-claude-code.md](cli-claude-code.md), [cli-cursor-agent.md](cli-cursor-agent.md).

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

Planning/execution use the **claude** or **agent** worker CLI via shell, not an MCP.

---

## Skills (97)

- **my-skills/** — 95+ domain and workflow skills (frontend, backend, testing, planning, etc.)
- **update-config** — Config update from upstream

Use the **skill** tool; never read SKILL.md directly. See [SKILLS.md](SKILLS.md) for categories.

---

## Related Docs

- [AGENTS.md](AGENTS.md) (this folder) — Agent deep dive (7 agents, worker CLI)
- [../AGENTS.md](../AGENTS.md) — Full agent hierarchy, slash commands, skills table, code style
- [ultron-design.md](ultron-design.md) — Ultron planning sub-agent
- [worker-selection-guide.md](worker-selection-guide.md) — claude vs agent
- [config-change-checklist.md](config-change-checklist.md) — Files to update on config changes
