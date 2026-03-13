---
name: sequential-task-runner
description: "Use when a big or multi-step task should be completed sequentially. Spawn sequencer then cursor-general (Cursor-native) or executor (opencode tools); they complete work sequentially."
---

# Sequential Task Runner (Subagent Flow)

When the task is **big** or **multi-step**, build and orchestrator should **spawn two subagents in order**; they complete the work sequentially using tools or the cursor_agent tool.

## When to Use

- Task has multiple dependent steps or touches many files
- Task is explicitly "big" or user asks to "break it down and execute"
- Orchestrator or build decides local execution would be token-heavy or error-prone

## Subagents

| Subagent | Model | Role | When to use |
|----------|-------|------|-------------|
| **@sequencer** | Claude Sonnet | Takes the big task; decomposes into an **ordered list of steps**. Outputs plan only. | Always first for multi-step work |
| **@cursor-general** | Claude Sonnet | Takes the plan; **executes steps via cursor_agent** (agent mode), with validate + review after each step. | Preferred for Cursor-native execution |
| **@executor** | Claude Haiku | Takes the plan; **executes steps via opencode tools** (Read/Write/Edit/Bash), with validate + review after each step. | Fallback when cursor_agent unavailable |

## Flows

### Cursor-Native Flow (preferred)
1. Spawn **@sequencer** with the task → ordered plan
2. Spawn **@cursor-general** with the plan → executes steps via cursor_agent
3. Spawn **@cursor-reviewer** → reviews changes
4. Build/orchestrator summarizes outcome and risks

### OpenCode Tools Flow (fallback)
1. Spawn **@sequencer** with the task → ordered plan
2. Spawn **@executor** with the plan → executes steps via Read/Write/Edit/Bash
3. Spawn **@code-reviewer** → reviews changes
4. Build/orchestrator summarizes outcome and risks

## Checklist

- [ ] Confirm task is big or multi-step before spawning subagents.
- [ ] Spawn **@sequencer** first; do not spawn executor/cursor-general without a plan.
- [ ] Pass the sequencer's output (numbered steps, assumptions, risks) to the execution agent.
- [ ] After execution: spawn **@cursor-reviewer** or **@code-reviewer** before marking done.
- [ ] Do not do the same work locally; subagents own planning and execution.

## Anti-patterns

- Spawning an execution agent without a plan when the task is ambiguous.
- Doing token-heavy planning or execution locally instead of delegating.
- Spawning sequencer for trivial single-step tasks (use @cursor-general directly).
- Skipping the review step after execution.
