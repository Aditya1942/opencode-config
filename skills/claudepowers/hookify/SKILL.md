---
name: hookify
description: Use when needing to create custom hooks to prevent unwanted behaviors, enforce coding rules, or add guardrails - analyzes conversation patterns or explicit instructions to generate hook rule files with regex matching
---

# Hookify - Create Hooks from Behaviors

## Overview

Create hook rules to prevent unwanted behaviors. Analyze conversation patterns or follow explicit instructions to generate rule files that trigger warnings or blocks when dangerous patterns are detected.

**Core principle:** Turn frustration into automation. If you've corrected an AI behavior twice, hookify it.

## Rule File Format

Rules are markdown files with YAML frontmatter stored in `.claude/hookify.{rule-name}.local.md`:

### Basic Rule

```markdown
---
name: rule-identifier
enabled: true
event: bash|file|stop|prompt|all
pattern: regex-pattern-here
action: warn|block
---

Message shown when rule triggers.
Supports **markdown** formatting.
```

### Advanced Rule (Multiple Conditions)

```markdown
---
name: warn-env-api-keys
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$
  - field: new_text
    operator: contains
    pattern: API_KEY
---

You're adding an API key to a .env file. Ensure this file is in .gitignore!
```

## Frontmatter Fields

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `name` | Yes | kebab-case | Unique identifier, start with verb (warn, block, prevent, require) |
| `enabled` | Yes | true/false | Toggle without deleting |
| `event` | Yes | bash, file, stop, prompt, all | Which hook event to trigger on |
| `pattern` | For simple rules | regex | Python regex to match |
| `action` | No | warn (default), block | Warn allows operation; block prevents it |
| `conditions` | For complex rules | array | Multiple field/operator/pattern checks (all must match) |

## Event Types

| Event | Triggers On | Match Fields |
|-------|-------------|-------------|
| `bash` | Bash tool commands | `command` |
| `file` | Edit, Write, MultiEdit | `file_path`, `new_text`, `old_text`, `content` |
| `stop` | Agent wants to stop | (matches all) |
| `prompt` | User submits prompt | `user_prompt` |
| `all` | All events | Varies by event |

## Condition Operators

| Operator | Description |
|----------|-------------|
| `regex_match` | Regex pattern matching |
| `contains` | Substring check |
| `equals` | Exact match |
| `not_contains` | Substring must NOT be present |
| `starts_with` | Prefix check |
| `ends_with` | Suffix check |

All conditions must match for a rule to trigger.

## Creating Rules Workflow

### From Explicit Instructions

1. User describes unwanted behavior
2. Identify which tool is involved (Bash, Edit, etc.)
3. Choose event type
4. Write regex pattern
5. Ask user: warn or block?
6. Create `.claude/hookify.{name}.local.md` file

### From Conversation Analysis

1. Scan recent conversation (last 10-15 messages) for:
   - Explicit "don't do X" instructions
   - User corrections/reversions
   - Frustrated reactions
   - Repeated issues
2. Present findings to user for confirmation
3. Create rules for confirmed behaviors

## Common Patterns

| Pattern | Matches | Purpose |
|---------|---------|---------|
| `rm\s+-rf` | `rm -rf` | Dangerous recursive delete |
| `sudo\s+` | `sudo ` | Privilege escalation |
| `chmod\s+777` | `chmod 777` | Over-permissive files |
| `dd\s+if=` | `dd if=` | Disk write operations |
| `npm\s+install\s+-g` | `npm install -g` | Global package installs |
| `console\.log\(` | `console.log(` | Debug logging |
| `eval\(` | `eval(` | Code injection risk |
| `innerHTML\s*=` | `innerHTML=` | XSS risk |
| `\.env$` | `.env` files | Environment files |
| `debugger` | `debugger` | Debug statements |

Test patterns: `python3 -c "import re; print(re.search(r'pattern', 'test'))"`

## Writing Good Messages

Good messages:
- Explain what was detected
- Explain why it's problematic
- Suggest alternatives

## File Organization

- **Location:** `.claude/` directory in project root
- **Naming:** `.claude/hookify.{descriptive-name}.local.md`
- **Gitignore:** Add `.claude/*.local.md` to `.gitignore`
- **Active immediately:** Rules read dynamically on next tool use, no restart needed

## Quick Reference

**Minimum viable rule:**
```markdown
---
name: my-rule
enabled: true
event: bash
pattern: dangerous_command
---
Warning message here
```

**Disable:** Set `enabled: false`
**Delete:** Remove the `.local.md` file

## Integration

- **Related:** `claudepowers:security-guidance` for built-in security patterns
- **For plugins:** `claudepowers:plugin-dev` for building full hook systems
