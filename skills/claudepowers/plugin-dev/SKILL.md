---
name: plugin-dev
description: Use when creating Claude Code plugins, scaffolding plugin structure, writing commands/agents/skills/hooks, configuring MCP servers, or developing any Claude Code extension - consolidates 7 specialized development skills into one reference
---

# Plugin Development Toolkit

## Overview

Comprehensive guide for developing Claude Code plugins. Consolidates guidance on plugin structure, commands, agents, skills, hooks, MCP integration, and settings into a single reference.

**Core principle:** Follow conventions for auto-discovery. Use progressive disclosure for skills. Keep SKILL.md lean, details in references.

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

**Location:** `skills/skill-name/SKILL.md` with optional subdirectories.

```markdown
---
name: Skill Name
description: This skill should be used when the user asks to "specific phrase 1", "specific phrase 2"...
---

Core instructions (1500-2000 words ideal, <3000 max)
```

**Progressive disclosure:**
1. **Metadata** (always loaded) - name + description (~100 words)
2. **SKILL.md body** (when triggered) - core instructions (<5k words)
3. **Bundled resources** (as needed) - scripts/, references/, examples/, assets/

**Description rules:**
- Third person: "This skill should be used when..."
- Include specific trigger phrases users would say
- NEVER summarize the workflow (causes Claude to skip reading the skill body)

## Hooks

**Location:** `hooks/hooks.json`

**Plugin format** (with wrapper):
```json
{
  "description": "Optional description",
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
        "timeout": 30
      }]
    }]
  }
}
```

**Hook types:**
- `prompt` (recommended): LLM-driven, context-aware decisions
- `command`: Bash scripts for deterministic checks

**Events:** PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit, PreCompact, Notification

**Matchers:** Exact (`Write`), multiple (`Read|Write|Edit`), wildcard (`*`), regex (`mcp__.*`)

**Exit codes:** 0 = success, 2 = blocking error

**Important:** Hooks load at session start. Changes require restarting Claude Code.

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

## Auto-Discovery

Claude Code automatically discovers:
1. `.claude-plugin/plugin.json` -> Plugin registration
2. `commands/*.md` -> Slash commands
3. `agents/*.md` -> Subagent definitions
4. `skills/*/SKILL.md` -> Skills
5. `hooks/hooks.json` -> Event handlers
6. `.mcp.json` -> MCP servers

## Best Practices

- **Naming:** Consistent kebab-case across all components
- **Paths:** Always `${CLAUDE_PLUGIN_ROOT}`, never absolute
- **Skills:** Keep SKILL.md lean, move details to `references/`
- **Hooks:** Prefer prompt-based for complex logic, command for deterministic
- **Testing:** Use `claude --debug` for hook debugging
- **Validation:** Check structure, frontmatter syntax, file existence

## Integration

- **Creating skills:** Also see `superpowers:writing-skills` for TDD-based skill creation methodology
- **Before building:** Use `superpowers:brainstorming` to design the plugin
