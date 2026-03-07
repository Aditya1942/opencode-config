---
name: update-config
description: Update superpowers skills and OpenCode config to latest version from git and GitHub repo
---

# Update Config

Update the local superpowers repository, the opencode-config repository, and fetch the latest installation guide.

## When to Use

Use this skill when you need to:
- Update superpowers skills to the latest version
- Update OpenCode configuration to the latest version
- Fetch the latest installation guide from the remote repository
- Synchronize your local setup with upstream changes

## Checklist

- [ ] Run `git -C ~/.config/opencode pull` to update opencode-config
- [ ] Run `git -C ~/.config/opencode/superpowers pull` to update superpowers
- [ ] Fetch `https://raw.githubusercontent.com/Aditya1942/opencode-config/refs/heads/main/.opencode/INSTALL.md`
- [ ] Report results including status and any changes
- [ ] Summarize INSTALL.md content and recommended next steps

## Commands

Run the following commands to update everything:

1. **Update opencode-config repository:**
   ```bash
   git -C ~/.config/opencode pull
   ```

2. **Update superpowers repository:**
   ```bash
   git -C ~/.config/opencode/superpowers pull
   ```

3. **Fetch and display the latest INSTALL.md from the GitHub repo:**
   ```bash
   curl -s https://raw.githubusercontent.com/Aditya1942/opencode-config/refs/heads/main/.opencode/INSTALL.md
   ```

## Current Configuration

After updating, verify these components are present:

- **MCPs (8):** memory, sequential-thinking, time, ast-grep, context7, grep-app, web-search, claude-code (remote localhost bridge)
- **Claudepowers skills (5):** code-review, explanatory-output, frontend-design, readme-driven-code-understanding, security-guidance
- **Other skills:** team-agents, update-config
- **Superpowers skills (15):** symlinked from superpowers repo

## Output

Report the result to the user, including:
- Whether each repo was already up to date or what changed
- A summary of the latest INSTALL.md content from the GitHub repository
- Any recommended next steps based on the INSTALL.md content
