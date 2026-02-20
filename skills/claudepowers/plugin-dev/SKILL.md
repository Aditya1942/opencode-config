---
name: plugin-dev
description: Use when creating Claude Code plugins, scaffolding plugin structure, writing commands/agents/skills/hooks, configuring MCP servers, or developing any Claude Code extension - consolidates 7 specialized development skills into one reference
---

# Plugin Development Toolkit

## Overview

Comprehensive guide for developing Claude Code plugins. Consolidates guidance on plugin structure, commands, agents, skills, hooks, MCP integration, and settings into a single reference.

## Plugin Directory Structure

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── commands/                 # Slash commands (.md files)
├── agents/                   # Subagent definitions (.md files)
├── skills/                   # Agent skills (subdirectories)
│   └── skill-name/
│       └── SKILL.md         # Required for each skill
├── hooks/
│   └── hooks.json           # Event handler configuration
├── .mcp.json                # MCP server definitions
└── scripts/                 # Helper scripts and utilities
```

**Rules:**
- Manifest MUST be in `.claude-plugin/` directory
- Components MUST be at plugin root, NOT inside `.claude-plugin/`
- Use kebab-case for all names
- Use `${CLAUDE_PLUGIN_ROOT}` for portable paths - NEVER hardcode

## Plugin Manifest (plugin.json)

Minimal:
```json
{ "name": "plugin-name" }
```

Recommended:
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Brief explanation",
  "author": { "name": "Name", "email": "email@example.com" },
  "license": "MIT",
  "keywords": ["testing", "automation"]
}
```

## Commands

**Location:** `commands/` directory, `.md` files with YAML frontmatter.

```markdown
---
description: What the command does
argument-hint: Optional argument description
allowed-tools: ["Bash", "Read", "Write"]
---

Command implementation instructions...
Use $ARGUMENTS for user-provided arguments.
```

**Naming:** `review.md` -> `/review`, `run-tests.md` -> `/run-tests`

**Key features:**
- Dynamic context with `!backtick` expressions: `!git status`
- Tool restrictions via `allowed-tools`
- Arguments via `$ARGUMENTS`
- Plugin-scoped: `/plugin-name:command`

## Agents

**Location:** `agents/` directory, `.md` files with YAML frontmatter.

```markdown
---
name: agent-name
description: When and how to use this agent (include examples)
model: sonnet|opus|haiku|inherit
color: green|red|yellow|cyan|pink
tools: Glob, Grep, Read, Write, Edit, Bash, TodoWrite
---

Agent system prompt and instructions...
```

**Frontmatter fields:**
- `name`: kebab-case identifier
- `description`: Include trigger examples showing when to launch
- `model`: LLM to use (sonnet for exploration, opus for complex reasoning)
- `tools`: Comma-separated list of allowed tools

## Skills

See `superpowers:writing-skills` for skill creation methodology. Key difference: plugin skills use `skills/skill-name/SKILL.md` under plugin root.

## Hooks

See `claudepowers:hookify` for hook creation. Plugin hooks go in `hooks/hooks.json` with the wrapper format shown in Directory Structure.

## MCP Integration

**Location:** `.mcp.json` at plugin root.

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/server.js"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

**Server types:** stdio (local), SSE (remote HTTP), streamable HTTP
**Auth:** API keys via env vars, OAuth for remote servers

## Settings Pattern

Use `.local.md` files with YAML frontmatter for per-user configuration:

```markdown
---
setting_name: value
another_setting: true
---
Optional description or notes
```

Parse in hooks with:
```bash
sed -n '/^---$/,/^---$/p' "$file" | grep "^$key:" | sed "s/^$key: *//"
```

## Integration

- **Creating skills:** Also see `superpowers:writing-skills` for TDD-based skill creation methodology
- **Before building:** Use `superpowers:brainstorming` to design the plugin
