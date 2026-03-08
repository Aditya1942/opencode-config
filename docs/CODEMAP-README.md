# OpenCode Docs — Start Here

**Last Updated:** 2026-03-08

This folder holds architecture and reference docs for the OpenCode config repo. **Source of truth** for agents, commands, and MCPs is **opencode.json** and root **AGENTS.md**.

---

## Quick reference

| What | Count | Where |
|------|-------|--------|
| **Agents** | 7 | build, plan, orchestrator, sequencer, executor, explorer, ultron |
| **MCPs** | 7 | memory, sequential-thinking, time, ast-grep, context7, grep-app, web-search |
| **Skills** | 96+ | my-skills (95+), update-config |
| **Worker CLI** | claude or agent | Via shell; see worker-selection-guide.md |

---

## Documentation index

| Doc | Purpose |
|-----|---------|
| **[../AGENTS.md](../AGENTS.md)** | **Primary.** Agent hierarchy, slash commands, skills table, code style, anti-patterns |
| **[INDEX.md](INDEX.md)** | Architecture overview: 7 agents, 7 MCPs, entry points, diagram |
| **[AGENTS.md](AGENTS.md)** | Agent deep dive: 7 agents, worker CLI usage, orchestrator rules |
| **[SKILLS.md](SKILLS.md)** | Skills system: 97 skills, categories, skill-chooser |
| **[ultron-design.md](ultron-design.md)** | Ultron planning sub-agent: when to spawn, output format |
| **[worker-selection-guide.md](worker-selection-guide.md)** | When to use claude vs agent CLI |
| **[cli-claude-code.md](cli-claude-code.md)** | Claude Code CLI syntax (worker via shell) |
| **[cli-cursor-agent.md](cli-cursor-agent.md)** | Cursor Agent CLI syntax (worker via shell) |
| **[config-change-checklist.md](config-change-checklist.md)** | Files to update when changing agents, commands, MCPs, skills, plugins |

---

## I want to...

- **Understand the system** → [INDEX.md](INDEX.md) then [../AGENTS.md](../AGENTS.md)
- **See all agents and commands** → [../AGENTS.md](../AGENTS.md) § Agent Hierarchy, § Slash Commands
- **Choose claude vs agent** → [worker-selection-guide.md](worker-selection-guide.md)
- **Use Ultron for planning** → [ultron-design.md](ultron-design.md)
- **Find a skill** → Use the skill tool or [SKILLS.md](SKILLS.md)
- **Change config** → [config-change-checklist.md](config-change-checklist.md)
