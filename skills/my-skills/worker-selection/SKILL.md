---
name: worker-selection
description: "Decide which worker CLI to use — agent for all tasks (small to big); claude only when complex and explicitly requires brainstorming. Use at task start. Then invoke via worker_plan_task / worker_execute_task tool or CLI via shell."
---

# Worker CLI Selection

**Policy:** Use the **agent** CLI for **all** tasks — small, medium, and big. Use the **claude** CLI only when the task is **complex and explicitly requires brainstorming** (or equivalent deep creative/exploratory reasoning), e.g. greenfield design, ambiguous requirements, or architecture exploration where the brainstorming skill is invoked. Both CLIs provide planning, exploration, implementation, verification, and review; use this skill to pick one, then **invoke the worker via the worker_plan_task or worker_execute_task tool** (or run the chosen CLI via shell if the tool is unavailable). See docs/cli-claude-code.md and docs/cli-cursor-agent.md.

## When to Use This Skill

- At the **start of any substantive task**
- When the user does not specify which worker CLI to use
- After a claude quota/rate-limit failure (switch to agent)
- When switching context (prefer agent unless complex + brainstorming required)

## Checklist

1. **Quota gate**: If Claude Code quota is full or exhausted (run `opencode auth status`), **use agent for all tasks**. Stop here.
2. **Classify the task**: Use **agent** for all task sizes (small to big). Use **claude** only when the task is complex and explicitly requires **brainstorming** (see below).
3. **Output your decision** in this form:

   ```
   Worker CLI: [claude | agent]
   Reason: [one line]
   (If claude: task is complex and requires brainstorming; prefer Opus/Sonnet.)
   ```

4. **Invoke the worker**: Prefer the **worker_plan_task** or **worker_execute_task** tool with the chosen worker, task, and workspace. If the tool is unavailable, run the `claude` or `agent` CLI via shell with the appropriate prompt and flags per docs.

## Task Classification

### Use **claude** only when **both** apply:

- Task is **complex** (greenfield design, ambiguous requirements, architecture exploration, or equivalent)
- Task **explicitly requires brainstorming** (or equivalent deep creative/exploratory reasoning) — e.g. my-skills:brainstorming is invoked before implementation

### Use **agent** (default for all agents and subagents):

- For **all tasks** — small, medium, and big — unless the above claude criteria apply
- When quota is full
- For planning, execution, exploration, validation, and review

## After Deciding

- **Preferred:** Invoke the worker via the **worker_plan_task** or **worker_execute_task** tool (worker, task, workspace; optional context, plan, model, profile). Use plan for read-only planning; use execute to apply edits.
- **Fallback (CLI via shell):** **claude**: Run the `claude` CLI via shell. Use docs/cli-claude-code.md for syntax (plan_task = `claude -p "..." --permission-mode plan`, execute_task = `--permission-mode acceptEdits`). **agent**: Run the `agent` CLI via shell. Use docs/cli-cursor-agent.md for syntax (plan_task = `agent -p "..." --trust --approve-mcps --mode plan`, execute_task = `--mode agent --force`).

## Reference

Full rules: docs/worker-selection-guide.md.
