---
name: ultron-planning
description: When to spawn the Ultron planning sub-agent for a structured TDD plan with per-step skills. Plan only; execution via executor or manually.
---

# Ultron Planning — When to Use

Use this skill when you need a **structured TDD plan** that includes **per-step skill recommendations**, bite-sized tasks (2–5 min each), and a saved plan file. Ultron does not execute; it only plans and assigns skills.

## When to Use Ultron

- User asks for a plan or "plan with skills per step"
- Task is multi-phase and you want each phase to have explicit skill(s)
- You will hand the plan to @executor for execution
- User says "use Ultron" or "ultron plan" or `/ultron`

## When Not to Use

- Single focus and no need for per-step skills → use **plan** agent or **@sequencer**
- You only need a task breakdown without skill assignment → use **plan-writing** or **@sequencer**

## Checklist

1. **Spawn @ultron** with the task (or use `/ultron` with task in context)
2. Optionally spawn **@explore** first for deep architecture context to pass to Ultron
3. Ultron will: read task → assign skills (overall + per step) → write bite-sized TDD plan → save to `docs/plans/`
4. **Present the plan** to the user; do not execute unless the user explicitly requests Subagent-Driven mode
5. If user wants execution: Ultron dispatches @executor per task + @code-reviewer for each task sequentially

## Skill Assignment Rules (No selection router)

Ultron assigns skills using existing skills only (no selection router). Keep it practical: 1–3 skills per task/phase.

- **Always include**: `plan-writing` (planning principles) and/or `tdd-workflow` (TDD cycle) when writing implementation steps.
- **Testing steps**: prefer `tdd-workflow`, `testing-patterns`, and/or `unit-testing-test-generate`.
- **Debugging steps**: prefer `systematic-debugging`, `debugging-strategies`, and/or `error-detective`.
- **Code review/quality**: prefer `code-reviewer` and/or `clean-code`.
- **Documentation** (if requested): prefer `readme` and/or `documentation-templates`.
- **Frontend keywords**:
  - React/Next.js: prefer `react-best-practices`, `react-patterns`, `react-ui-patterns`
  - Performance: prefer `web-performance-optimization`
- **Android/Kotlin keywords**: prefer `kotlin-coroutines-expert` / `android-jetpack-compose-expert`.

## Output You Get

A plan document saved to `docs/plans/YYYY-MM-DD-<feature-name>.md` with:

- **Header** — Goal, Architecture, Tech Stack
- **Tasks** — each with Files (create/modify/test), Skills, bite-sized TDD Steps (write test → fail → implement → pass → commit), Verification, Dependencies, Risk
- **Testing Strategy, Risks & Mitigations, Success Criteria**
- **Execution handoff** — Subagent-Driven (this session) or Manual/Parallel Session

## Reference

- **Design doc:** docs/ultron-design.md
- **Agent config:** opencode.json → agent "ultron"
- **Slash command:** `/ultron`
