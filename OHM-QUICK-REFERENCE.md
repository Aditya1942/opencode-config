# Quick Reference: Oh My OpenCode Integration

## Pre-Integration ✅
```bash
# Backups created:
# - opencode.json.backup-20260221-013931
# - AGENTS.md.backup-20260221-013931
# - Uninstall script: ./uninstall-oh-my-opencode.sh
```

## Install Oh My OpenCode

```bash
# 1. Install the package
npm install -g oh-my-opencode@latest

# 2. Add to opencode.json plugins
jq '.plugin += ["oh-my-opencode"]' opencode.json > /tmp/oc.json && mv /tmp/oc.json opencode.json

# 3. Verify installation
opencode --version
```

## What You Get

### No Changes to Current Workflow
- Your agents (orchestrator, executor, explore, etc.) work exactly as before
- Your MCP servers (zai-vision, filesystem, etc.) remain active
- Your commands (/brainstorm, /write-plan, etc.) continue working

### New Opt-In Capabilities
Add `ulw` or `ultrawork` to your prompt:
```
ulw: Refactor the authentication system to use JWT tokens
```
This activates:
- Sisyphus - Orchestration agent
- Hephaestus - Autonomous deep worker
- Oracle - Architecture & debugging
- Librarian - Docs + codebase search
- Explore - Fast codebase grep
- Frontend UI/UX Engineer - Frontend specialist

### Automatic Enhancements
- Hash-anchored edits (prevents stale-line failures)
- Todo continuation enforcer (forces completion)
- Comment checker (reduces AI comment bloat)
- LSP integration (better refactoring)

## Uninstall (Easy Rollback)

```bash
# Option 1: Automated
./uninstall-oh-my-opencode.sh

# Option 2: Manual
# Remove plugin from config
jq '.plugin = [.plugin[] | select(. != "oh-my-opencode")]' opencode.json > /tmp/oc.json && mv /tmp/oc.json opencode.json
npm uninstall -g oh-my-opencode

# Option 3: Restore from backup
cp opencode.json.backup-20260221-013931 opencode.json
cp AGENTS.md.backup-20260221-013931 AGENTS.md
```

## Usage Examples

### Normal Usage (No Change)
```
/brainstorm
/write-plan
/execute-plan
```

### Ultra Work Mode
```
ulw: Build a REST API for user management with authentication
```

### Ultra Think Mode
```
ultrathink: Analyze the current architecture and suggest improvements
```

## Troubleshooting

### Plugin not loading?
```bash
npm list -g oh-my-opencode
cat opencode.json | jq .
```

### Disable specific features?
Create `.opencode/oh-my-opencode.jsonc`:
```jsonc
{
  "disabled_hooks": ["comment_checker"]
}
```

## Documentation
- Full Guide: `OHM-INTEGRATION-GUIDE.md`
- Original: https://github.com/code-yeongyu/oh-my-opencode
- Discord: https://discord.gg/PUwSMR9XNk
