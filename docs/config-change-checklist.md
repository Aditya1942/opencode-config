# Config Change Checklist

Reference checklist for updating project files after any configuration change.
Pick the section matching your change type and follow every checkbox.

---

## Adding / Removing / Updating an MCP Server

- [ ] `opencode.json` — Add/remove/edit entry in `"mcp"` section
- [ ] `README.md` — Update **MCP Servers** table + count in heading `(N)`
- [ ] `.opencode/INSTALL.md` — Update MCP list in **What This Installs** section
- [ ] `.opencode/INSTALL.md` — Update **Troubleshooting > MCP Servers Not Connecting** requirements list
- [ ] `skills/update-config/SKILL.md` — Update **Current Configuration > MCPs** count and list
- [ ] `AGENTS.md` — Update if MCP is referenced in agent instructions or anti-patterns

---

## Adding / Removing / Updating a Skill

- [ ] Add/remove the skill directory under `skills/<collection>/<skill-name>/SKILL.md`
- [ ] `README.md` — Update skill list in **What's Included > Skills** (summary section)
- [ ] `README.md` — Update skill list in **Skills** table (full list section)
- [ ] `README.md` — Update skill count in `### N Skills` heading
- [ ] `README.md` — Update **Directory Structure** tree if claudepowers skill added/removed
- [ ] `.opencode/INSTALL.md` — Update custom skills count in **What This Installs**
- [ ] `.opencode/INSTALL.md` — Update **Directory Structure** tree
- [ ] `skills/update-config/SKILL.md` — Update **Current Configuration** skill count and list
- [ ] `AGENTS.md` — Update **Skills** table if it lists available skills
- [ ] Check other skills' `## Integration` sections for cross-references to removed/renamed skill

---

## Adding / Removing / Updating a Command

- [ ] `opencode.json` — Add/remove/edit entry in `"command"` section
- [ ] `README.md` — Update **Custom Commands** table (summary section)
- [ ] `README.md` — Update **Commands (slash)** table (full list section)
- [ ] `AGENTS.md` — Update **Slash Commands** table
- [ ] `.opencode/INSTALL.md` — Update commands list in **What This Installs** if listed there

---

## Adding / Removing / Updating an Agent

- [ ] `opencode.json` — Add/remove/edit entry in `"agent"` section
- [ ] `README.md` — Update **Agent Architecture** summary table
- [ ] `README.md` — Update **Agents** full table
- [ ] `AGENTS.md` — Update **Agent Hierarchy** table
- [ ] `.opencode/INSTALL.md` — Update **Verification** step if agent should be visible
- [ ] `.opencode/INSTALL.md` — Update **Troubleshooting > Agents Not Working** if relevant

---

## Adding / Removing / Updating a Plugin

- [ ] Add/remove the plugin file in `plugins/`
- [ ] `opencode.json` — Add/remove entry in `"plugins"` section
- [ ] `README.md` — Update **Plugins** table
- [ ] `README.md` — Update **Directory Structure** tree
- [ ] `.opencode/INSTALL.md` — Update if plugin requires special setup

---

## Adding / Removing / Updating a Model or Provider

- [ ] `opencode.json` — Add/remove/edit entry in `"models"` or `"providers"` section
- [ ] `AGENTS.md` — Update **Agent Hierarchy** table if agent models changed
- [ ] `README.md` — Update agent tables if model names shown
- [ ] `.opencode/INSTALL.md` — Update **Post-Installation: Model Provider Setup** if new provider

---

## Quick Reference: Files That Track Config State

| File | What it tracks |
|------|---------------|
| `opencode.json` | **Source of truth** — models, agents, commands, MCP, plugins, providers (keys: `agent`, `command`) |
| `README.md` | Public-facing docs — all tables, counts, directory tree |
| `.opencode/INSTALL.md` | Installation guide — counts, MCP list, directory tree, troubleshooting |
| `AGENTS.md` | AI instructions — agent table, skills table, commands table |
| `skills/update-config/SKILL.md` | Update reference — current MCP/skill counts and lists |
