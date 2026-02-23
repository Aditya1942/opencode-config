# Interview Draft: Install All Hooks

## Original Request
User wants to "install all hooks" for the OpenCode.ai configuration repository.

## Exploration Findings

### Current Hook Infrastructure

1. **OpenCode Virtual Hooks** (Already Configured)
   - Location: `superpowers/hooks/hooks.json`
   - Hook Type: `SessionStart` - injects superpowers bootstrap context
   - Script: `superpowers/hooks/session-start.sh`
   - Status: **ACTIVE** - These hooks are already loaded by OpenCode

2. **Git Hooks** (Current State: Sample Files Only)
   - Location: `.git/hooks/`
   - Current Content: Only sample files (`.sample` extensions)
   - Status: **NOT INSTALLED** - No active git hooks

3. **Hookify Skill** (For Custom Hook Creation)
   - Location: `skills/claudepowers/hookify/`
   - Purpose: Creates custom hook rule files with regex matching
   - Status: **Available tool**, not a hook itself

4. **Plugin Hooks**
   - Location: `plugins/superpowers.js`
   - Hook Type: `experimental.chat.system.transform`
   - Purpose: Injects bootstrap content
   - Status: **ACTIVE** - Already configured

## Classification
**Intent**: Build / Setup task

## Clarifying Questions

### Question 1: Which Type of Hooks?
The term "hooks" is ambiguous. Which of the following do you want to install?

**Options:**
1. **Git hooks** (pre-commit, commit-msg, pre-push, etc.) - These would enforce coding standards for commits
2. **Additional OpenCode virtual hooks** (beyond SessionStart) - Are there specific hook events you want?
3. **Both git hooks AND additional virtual hooks**

### Question 2: Git Hook Requirements (If Applicable)
If you want git hooks installed, which ones do you need?

**Common git hooks for this config:**
- `pre-commit`: Run lint checks, validate JSON configs, verify symlinks
- `commit-msg`: Enforce conventional commit format
- `pre-push`: Run tests (if any), verify remote is correct

**Options:**
1. All three (pre-commit, commit-msg, pre-push)
2. Only specific ones (which?)
3. Custom hooks (describe requirements)

### Question 3: Hook Behavior
What should happen when hooks fail?

**Options:**
1. **Strict**: Block commit/push and force fix (recommended for this config repo)
2. **Warning**: Show message but allow proceed (lenient)
3. **Interactive**: Ask user each time (annoying)

### Question 4: Additional OpenCode Hooks
Do you want additional virtual hook events configured beyond SessionStart?

**Potential hook events:**
- `PreCommand`: Inject context before slash commands
- `PostCommand`: Validate after command execution
- `SessionEnd`: Cleanup or logging

**Options:**
1. Yes, specify which events
2. No, SessionStart is sufficient

## Technical Context

### Repository Characteristics
- **Type**: Config-only repository (no build/test/lint commands)
- **Files to validate**:
  - `opencode.json` (JSON schema validation)
  - `package.json` (dependencies)
  - `plugins/superpowers.js` (symlink integrity)
  - `skills/superpowers` (symlink integrity)
  - `superpowers/` (gitignored, no validation needed)

### Current Hook Stack
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
            "async": false
          }
        ]
      }
    ]
  }
}
```

## Decisions Pending

- [ ] Hook type (git / virtual / both)
- [ ] Specific git hooks needed
- [ ] Hook failure behavior (strict / warning / interactive)
- [ ] Additional virtual hook events
- [ ] Verification strategy
