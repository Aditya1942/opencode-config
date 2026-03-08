---
name: sequential-task-runner
description: "Use when a big or multi-step task should be completed sequentially via the worker CLIs. Spawn sequencer then executor subagents; they use Claude Sonnet/Haiku and run claude or agent via shell per docs."
---

# Sequential Task Runner (Subagent Flow)

When the task is **big** or **multi-step**, build and orchestrator should **spawn two subagents in order**; they complete the work sequentially using the chosen worker CLI (claude or agent) **via shell** per docs/cli-claude-code.md and docs/cli-cursor-agent.md.

## When to Use

- Task has multiple dependent steps or touches many files
- Task is explicitly "big" or user asks to "break it down and execute"
- Orchestrator or build decides local execution would be token-heavy or error-prone

## Subagents

| Subagent | Model | Role |
|----------|--------|------|
| **@sequencer** | Claude Sonnet | Takes the big task; runs worker-selection; uses chosen CLI via shell to plan and decompose into an **ordered list of steps**. Outputs plan only (no execution). Syntax: docs/cli-claude-code.md or docs/cli-cursor-agent.md (plan mode). |
| **@executor** | Claude Haiku | Takes the plan (from sequencer or context); runs worker-selection; **executes steps one-by-one** via chosen CLI via shell, with validate + review after each step. Syntax: docs. |

## Flow

1. **Build or orchestrator** invokes my-skills:worker-selection (or has already chosen worker CLI).
2. For **big/multi-step** task: spawn **@sequencer** with the task. Wait for the ordered plan.
3. Spawn **@executor** with the plan (and task context). Executor runs steps sequentially via the CLI (shell).
4. Build/orchestrator summarizes outcome and any remaining risks.

## Checklist

- [ ] Confirm task is big or multi-step before spawning subagents.
- [ ] Spawn **sequencer** first; do not spawn executor without a plan unless executor can infer one.
- [ ] Pass the sequencer's output (numbered steps, assumptions, risks) to the executor.
- [ ] Let sequencer and executor use their own worker-selection (they may choose different CLI if quota changes).
- [ ] Do not do the same work locally; subagents own planning and execution via the CLIs (shell).

## Anti-patterns

- Spawning executor without a plan when the task is ambiguous.
- Doing token-heavy planning or execution locally instead of delegating to sequencer/executor.
- Spawning sequencer for trivial single-step tasks (handle those directly).
