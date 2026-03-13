---
name: ultron-planning
description: When to spawn the Ultron planning sub-agent for a plan with per-step skills. Plan only; execution via sequencer/executor.
---

# Ultron Planning — When to Use

Use this skill when you need a **structured plan** that includes **per-step skill recommendations**. Ultron does not execute; it only plans and assigns skills.

## When to Use Ultron

- User asks for a "plan with skills per step"
- Task is multi-phase and you want each phase to have explicit skill(s)
- You will hand the plan to @sequencer / @executor
- User says "use Ultron" or "ultron plan" or "/ultron"

## When Not to Use

- Single focus and no need for per-step skills → use **plan** agent or **@sequencer**
- You only need a task breakdown without skill assignment → use **writing-plans** or **@sequencer**

## Checklist

1. **Spawn @ultron** with the task (or use **/ultron** with task in context)
2. Optionally spawn **@cursor-explorer** (mode=plan) first for deep architecture context to pass to Ultron
3. Ultron will: read task → skill-chooser (overall + per step) → output structured plan
4. **Present the plan** to the user; do not execute unless the user asks
5. If user wants execution: hand plan to @sequencer then @cursor-general (Cursor-native) or @executor (opencode tools)

## Output You Get

A plan with for each step:

- **Description** — what to do
- **Skills** — from skill-chooser (1–3 per step)
- **Verification** — how to check the step is done

Plus assumptions and risks.

## Reference

- **Design doc:** docs/ultron-design.md
- **Agent config:** opencode.json → agent "ultron"
- **Routing:** docs/ultron-design.md, AGENTS.md → Planning Sub-Agent (Ultron)
