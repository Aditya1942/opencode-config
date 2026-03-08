---
name: ultron-planning
description: When to spawn the Ultron planning sub-agent for a plan with per-step skills and per-step worker (claude/agent) assignment. Plan only; execution via sequencer/executor or CLI.
---

# Ultron Planning — When to Use

Use this skill when you need a **structured plan** that includes **per-step skill recommendations** and **per-step worker CLI assignment** (agent vs claude). Ultron does not execute; it only plans and assigns.

## When to Use Ultron

- User asks for a "plan with skills per step" or "plan that assigns worker per step"
- Task is multi-phase and you want each phase to have explicit skill(s) and worker
- You will hand the plan to @sequencer / @executor or run steps yourself via worker CLI
- User says "use Ultron" or "ultron plan" or "/ultron"

## When Not to Use

- Single global worker and no need for per-step skills → use **plan** agent or **@sequencer**
- You only need a task breakdown without skill/worker assignment → use **writing-plans** or **@sequencer**

## Checklist

1. **Spawn @ultron** with the task (or use **/ultron** with task in context)
2. Ultron will: read task → skill-chooser (overall + per step) → worker-selection per step → output structured plan
3. **Present the plan** to the user; do not execute unless the user asks
4. If user wants execution: hand plan to @sequencer then @executor, or run each step via the chosen CLI per step (docs/cli-cursor-agent.md, docs/cli-claude-code.md)

## Output You Get

A plan with for each step:

- **Description** — what to do
- **Skills** — from skill-chooser (1–3 per step)
- **Worker** — agent or claude, with one-line reason (from worker-selection)
- **Verification** — how to check the step is done

Plus assumptions and risks.

## Reference

- **Design doc:** docs/ultron-design.md
- **Agent config:** opencode.json → agent "ultron"
- **Routing:** team-agents skill → Planning Sub-Agent (Ultron) table
