---
name: worker-selection
description: "Decide which worker CLI to use — agent for all tasks (default, no permission); claude (Opus/Sonnet) only when very complex and with user permission. Use at task start. Then invoke the chosen CLI via shell per docs."
---

# Worker CLI Selection

**Policy:** Use the **agent** CLI for all kinds of tasks; utilize it as much as possible without asking for permission. Use the **claude** CLI (Opus/Sonnet) only when the task is **very complex** and the **user has granted permission** to use claude. Both CLIs provide planning, exploration, implementation, verification, and review; use this skill to pick one, then **invoke the chosen CLI via shell** using docs/cli-claude-code.md or docs/cli-cursor-agent.md.

## When to Use This Skill

- At the **start of any substantive task**
- When the user does not specify which worker CLI to use
- After a claude quota/rate-limit failure (switch to agent)
- When switching context (prefer agent unless very complex + permission)

## Checklist

1. **Quota gate**: If Claude Code quota is full or exhausted (run `opencode auth status`), **use agent for all tasks**. Stop here.
2. **Permission for claude**: If the user has not granted permission to use claude, **use agent**. Utilize agent as much as possible without permission.
3. **Classify the task**: Only if permission for claude exists, check if the task is very complex (see below).
4. **Output your decision** in this form:

   ```
   Worker CLI: [claude | agent]
   Reason: [one line]
   (If claude: task is very complex and user granted permission; prefer Opus/Sonnet.)
   ```

5. **Invoke the CLI via shell** using the chosen doc. No MCP tools; use shell to run `claude` or `agent` with the appropriate prompt and flags.

## Task Classification

### Use **claude** (Opus/Sonnet) only when **both** apply:

- User has **granted permission** to use claude (e.g. explicitly asked for claude or approved its use)
- Task is **very complex**: token-heavy work, multi-step planning, architecture, deep implementation, mandatory verification, or specialist profile needed (planner, architect, code-reviewer, validator, tdd-guide, build-error-resolver, refactor-cleaner, doc-updater, skill-chooser)

### Use **agent** (default):

- For **all tasks** when permission for claude was not granted — utilize agent as much as possible without permission
- When quota is full
- For simple or moderate tasks even if permission exists (prefer agent to conserve claude quota)

## After Deciding

- **claude**: Run the `claude` CLI via shell. Use docs/cli-claude-code.md for syntax (plan_task = `claude -p "..." --permission-mode plan`, execute_task = `--permission-mode acceptEdits`, profile = `--append-system-prompt` with profile text; see doc for details). See docs/worker-selection-guide.md and docs/cli-claude-code.md for task-type routing.
- **agent**: Run the `agent` CLI via shell. Use docs/cli-cursor-agent.md for syntax (plan_task = `agent -p "..." --trust --approve-mcps --mode plan`, execute_task = `--mode agent --force`).

## Reference

Full rules: docs/worker-selection-guide.md.
