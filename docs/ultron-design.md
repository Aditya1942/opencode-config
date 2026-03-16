# Ultron — Planning Sub-Agent Design

**Last updated:** 2026-03-13  
**Scope:** Planning sub-agent that assigns skills per step, writes bite-sized TDD plans saved to `docs/plans/`, and offers execution handoff. Plan-only by default; no execution unless user chooses Subagent-Driven mode.

---

## Role

**Ultron** is a planning sub-agent that:

1. **Reads and understands** the user task
2. **Explores the codebase** using Read/Glob tools for architecture context
3. **Invokes skill-chooser** (my-skills:skill-chooser) for the overall task and per step
4. **Outputs a structured TDD plan** saved to `docs/plans/YYYY-MM-DD-<feature-name>.md`
5. **Offers execution handoff** — Subagent-Driven (dispatches @executor + @code-reviewer per task) or Manual

Execution of plan steps is done by @executor (Subagent-Driven) or by the user (Manual/Parallel Session).

---

## When to Use Ultron

- **Plan agent:** The **plan** agent is enforced to use Ultron for all planning; it must spawn @ultron and may not plan itself.
- You need a **plan with per-step skill recommendations** (skill-chooser).
- You want to hand a structured plan to executor.

**Invocation:** Use the **plan** agent (which spawns Ultron), spawn @ultron with the task directly, or use the **/ultron** slash command.

---

## Design Principles (Research-Aligned)

| Principle | Source | How Ultron Applies It |
|-----------|--------|------------------------|
| **Bite-sized TDD steps** | writing-plans, TDD best practices | Each task broken into: write failing test → confirm fail → implement minimal code → confirm pass → commit. Each step 2–5 minutes. |
| **As-needed decomposition** | ADaPT, TodoEvolve | One step when task is simple/single-focus; multiple steps only when multi-part or phased. Avoid over-decomposition. |
| **Structured handoff** | Magentic-One, CodeSim | Fixed output format: per task — files, skills, TDD steps, verification. Machine-readable for executor. |
| **Plan as hypothesis** | Backtracking/replanning literature | Ultron only produces the plan; execution can fail and trigger replan (re-run Ultron or adjust and re-execute). |
| **Clear role separation** | Multi-agent best practices | Ultron does not execute; it only plans, assigns, and writes the plan file. Execution is delegated. |

---

## Output Format

Ultron saves a plan document to `docs/plans/YYYY-MM-DD-<feature-name>.md` with this structure:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence]

**Architecture:** [2–3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing:123-145`
- Test: `tests/exact/path/to/test`

**Skills:** [from skill-chooser]

**Step 1:** Write the failing test — [describe what test checks]
**Step 2:** Run test → confirm it fails
**Step 3:** Write minimal implementation — [describe what to implement]
**Step 4:** Run test → confirm it passes
**Step 5:** Commit — `git commit -m "[message]"`

**Verification:** [how to confirm the task is complete end-to-end]
**Dependencies:** None | Requires Task N
**Risk:** Low | Medium | High

---

## Testing Strategy
- [Unit / integration / E2E]

## Risks & Mitigations
- **Risk:** [description] — Mitigation: [approach]

## Success Criteria
- [ ] Criterion 1
```

---

## Execution Handoff

After saving the plan, Ultron offers:

> "Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:
>
> **1. Subagent-Driven (this session)** — I dispatch @executor per task with @code-reviewer after each task; fast iteration
>
> **2. Manual / Parallel Session** — You execute the plan yourself or in a new session
>
> Which approach?"

**Subagent-Driven:** Ultron dispatches @executor sequentially per task, runs @code-reviewer after each, reports between tasks.  
**Manual/Parallel Session:** User executes the plan themselves; plan document is the handoff artifact.

---

## Integration Points

- **Tools (explore):** Ultron uses Read/Glob to explore the codebase before planning.
- **skill-chooser:** Reads `skills/my-skills/skill-chooser/skill_index.json`; recommends 1–3 skills per task.
- **Write tool:** Saves plan document to `docs/plans/`.
- **Config:** Agent and `/ultron` command in opencode.json.

---

## Test Prompt

Use this prompt to test the Ultron subagent. Spawn @ultron or use `/ultron`:

```
Spawn @ultron with this task:

Add a small REST API in this repo: one GET endpoint that returns project metadata (name, version from package.json). Then add unit tests for it, and update the README with a short "API" section. Do not implement yet — produce a structured TDD plan with per-step skills and verification for each step, saved to docs/plans/.
```

**What to expect:** Ultron should (1) optionally use tools to explore/summarize the repo, (2) invoke skill-chooser for the overall task and per step (e.g. api-design, testing, readme), (3) write a plan file to `docs/plans/` with bite-sized TDD steps per task, (4) present the plan and offer Subagent-Driven vs Manual execution.

**Shorter variant (single-focus):**

```
@ultron Plan only: add a /health GET endpoint that returns { "status": "ok" }. Output structured TDD plan with skills per step; save to docs/plans/; do not implement.
```

---

## Quality Gates

- [ ] Ultron invoked only for planning; no execution by Ultron (unless user explicitly chooses Subagent-Driven).
- [ ] Each task has at least one skill recommendation.
- [ ] Each task has bite-sized TDD steps (write test → fail → implement → pass → commit).
- [ ] Plan saved to `docs/plans/YYYY-MM-DD-<feature-name>.md`.
- [ ] Execution handoff offered after presenting plan.
- [ ] Plan is actionable: executor or human can run steps.
- [ ] Replanning possible: if execution fails, re-run Ultron or adjust plan and continue.

---

**Confidence:** 0.95  
**Related:** opencode.json (agent "ultron"), my-skills:ultron-planning (when to use), my-skills:plan-writing (principles).
