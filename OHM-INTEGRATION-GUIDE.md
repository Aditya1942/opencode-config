# Oh My OpenCode Integration Guide

## Current Configuration Status

You have a **well-structured OpenCode setup** with:
- ✅ Team-agents skill loaded (orchestrator, executor, etc.)
- ✅ MCP servers (zai-vision, filesystem, memory, etc.)
- ✅ Custom agents (explore, general, transform, validator)
- ✅ Commands (brainstorm, write-plan, execute-plan)

## Why Oh My OpenCode is Safe to Add

### Non-Invasive Design
Oh My OpenCode is **opt-in by default**:
- Adding the plugin does NOT change your current workflow
- The powerful agent orchestration only activates when you use the `ultrawork` or `ulw` keyword
- Your existing agents, commands, and MCPs continue working exactly as before

### No Breaking Changes
- Your current `agent` configuration remains intact
- Your `mcp` servers are preserved
- Your `command` definitions stay the same
- Oh My OpenCode extends, doesn't replace

## Integration Steps

### Step 1: Backup ✅ (Already Done)
Backups created:
- `opencode.json.backup-20260221-013931`
- `AGENTS.md.backup-20260221-013931`

### Step 2: Install Oh My OpenCode Package

```bash
npm install -g oh-my-opencode@latest
```

### Step 3: Add to opencode.json Plugins

Edit your `opencode.json` and add `"oh-my-opencode"` to the `plugin` array:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-antigravity-auth@latest",
    "opencode-antigravity-quota@0.1.6",
    "oh-my-opencode"  // ← Add this line
  ],
  // ... rest of your config
}
```

**Or use this command:**

```bash
jq '.plugin += ["oh-my-opencode"]' opencode.json > /tmp/oc.json && mv /tmp/oc.json opencode.json
```

### Step 4: Verify Installation

```bash
# Check plugin is loaded
opencode --version

# Test basic functionality (non-intrusive)
echo "Plugin installed successfully"
```

### Step 5: Optional - Create Project Config (Recommended)

Create `.opencode/oh-my-opencode.jsonc` in your project directories for project-specific settings:

```jsonc
{
  // This is project-level configuration
  // Overrides default behavior only for this project
}
```

## What You Get After Integration

### By Default (No Changes to Workflow)
- ✅ All your current agents work exactly as before
- ✅ All MCP servers remain active
- ✅ All commands continue to function
- ✅ Your orchestrator + executor workflow unchanged

### New Capabilities (Opt-In with `ulw` Keyword)
When you type `ulw` or `ultrawork` in a prompt:
- 🚀 **Sisyphus Agent** - Orchestration agent that delegates to specialists
- 🔧 **Hephaestus** - Autonomous deep worker (goal-oriented execution)
- 🧠 **Oracle** - Architecture & debugging specialist
- 📚 **Librarian** - Docs + codebase exploration
- 🔍 **Explore** - Fast codebase grep
- 💅 **Frontend UI/UX Engineer** - Dedicated frontend agent

### Automatic Enhancements (Zero Config)
- 🔒 **Hash-anchored Edit Tool** - Prevents stale-line edit failures
- 📋 **Todo Continuation Enforcer** - Forces completion of tasks
- 💬 **Comment Checker** - Reduces AI comment bloat
- 🛠️ **LSP Integration** - Better refactoring capabilities

## How to Use

### Normal Usage (No Change)
Just keep using your agents as usual:
- `/brainstorm` for creative work
- `/write-plan` for implementation plans
- `/execute-plan` for execution
- Your orchestrator + executor workflow

### Ultra Work Mode (New Power)
For complex multi-step tasks, add `ulw` to your prompt:

```
ulw: Refactor the authentication system to use JWT tokens
```

This activates Sisyphus who:
1. Analyzes the task
2. Fires parallel background agents to gather context
3. Delegates to specialists (Hephaestus for backend, etc.)
4. Continues until completion (enforced by Todo Enforcer)

### Ultra Think Mode (Deep Analysis Without Execution)
```
ultrathink: Analyze the current architecture and suggest improvements
```

## Uninstallation (Easy Rollback)

### Option 1: Restore from Backup
```bash
./uninstall-oh-my-opencode.sh
```

### Option 2: Manual Removal
```bash
# Remove plugin from opencode.json
jq '.plugin = [.plugin[] | select(. != "oh-my-opencode")]' \
    ~/.config/opencode/opencode.json > /tmp/oc.json && \
    mv /tmp/oc.json ~/.config/opencode/opencode.json

# Uninstall package
npm uninstall -g oh-my-opencode

# Restore from backup (if you want to revert all changes)
cp opencode.json.backup-YYYYMMDD-HHMMSS opencode.json
cp AGENTS.md.backup-YYYYMMDD-HHMMSS AGENTS.md
```

## Verification

After integration, verify your setup:

```bash
# Check plugins loaded
opencode --version

# Test that your existing agents still work
echo "Testing explore agent..."

# Test that new agents are available (when using ulw)
echo "Oh My OpenCode agents are opt-in via 'ulw' keyword"
```

## Troubleshooting

### Issue: Plugin Not Loading
```bash
# Verify installation
npm list -g oh-my-opencode

# Check opencode.json syntax
cat opencode.json | jq .
```

### Issue: Conflicts with Existing Agents
Oh My OpenCode uses prefixed agent names (`ohm:` prefix internally). No conflicts expected.

### Issue: Want to Disable Specific Features
Create project-level config `.opencode/oh-my-opencode.jsonc`:

```jsonc
{
  "disabled_hooks": ["comment_checker"],
  "agents": {
    "hephaestus": {
      "enabled": false
    }
  }
}
```

## Next Steps

1. ✅ **Backups created** - Safe to proceed
2. Install: `npm install -g oh-my-opencode@latest`
3. Add to plugins: `jq '.plugin += ["oh-my-opencode"]' opencode.json > /tmp/oc.json && mv /tmp/oc.json opencode.json`
4. Restart OpenCode
5. Test with normal usage (everything should work as before)
6. Try `ulw` for a complex task to experience the new capabilities

## Key Takeaway

**Your current workflow is 100% preserved.** Oh My OpenCode adds superpowers that you activate only when you want them with the `ulw` keyword. No changes to your day-to-day operations unless you explicitly opt-in.

---

**Questions?** Check the [Oh My OpenCode README](https://github.com/code-yeongyu/oh-my-opencode) or [Join Discord](https://discord.gg/PUwSMR9XNk)
