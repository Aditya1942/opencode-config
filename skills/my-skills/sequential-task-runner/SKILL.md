---
name: sequential-task-runner
description: "Use when a big or multi-step task should be completed sequentially via the worker MCPs. Spawn sequencer then executor subagents; they use Claude Sonnet/Haiku and claude-code or cursor-agent."
---

# Sequential Task Runner (Subagent Flow)

When the task is **big** or **multi-step**, build and orchestrator should **spawn two subagents in order**; they complete the work sequentially using the chosen worker MCP (claude-code or cursor-agent).

## When to Use

- Task has multiple dependent steps or touches many files
- Task is explicitly “big” or user asks to “break it down and execute”
- Orchestrator or build decides local execution would be token-heavy or error-prone

## Subagents

| Subagent | Model | Role |
|----------|--------|------|
| **@sequencer** | Claude Sonnet | Takes the big task; runs mcp-selection; uses chosen MCP to plan and decompose into an **ordered list of steps**. Outputs plan only (no execution). |
| **@executor** | Claude Haiku | Takes the plan (from sequencer or context); runs mcp-selection; **executes steps one-by-one** via chosen MCP, with validate + review after each step. |

## Flow

1. **Build or orchestrator** invokes my-skills:mcp-selection (or has already chosen MCP).
2. For **big/multi-step** task: spawn **@sequencer** with the task. Wait for the ordered plan.
3. Spawn **@executor** with the plan (and task context). Executor runs steps sequentially via the MCP.
4. Build/orchestrator summarizes outcome and any remaining risks.

## Checklist

- [ ] Confirm task is big or multi-step before spawning subagents.
- [ ] Spawn **sequencer** first; do not spawn executor without a plan unless executor can infer one.
- [ ] Pass the sequencer’s output (numbered steps, assumptions, risks) to the executor.
- [ ] Let sequencer and executor use their own mcp-selection (they may choose different MCP if quota changes).
- [ ] Do not do the same work locally; subagents own planning and execution via the MCPs.

## Anti-patterns

- Spawning executor without a plan when the task is ambiguous.
- Doing token-heavy planning or execution locally instead of delegating to sequencer/executor.
- Spawning sequencer for trivial single-step tasks (handle those directly).
