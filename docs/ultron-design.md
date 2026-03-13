# Ultron — Planning Sub-Agent Design

**Last updated:** 2026-03-08  
**Scope:** Planning sub-agent that assigns skills per step; plan-only, no execution. Planner discipline (requirements, architecture review, phases, testing, risks) is merged into Ultron's prompt.

---

## Role

**Ultron** is a planning sub-agent that:

1. **Reads and understands** the user task
2. **Uses Read and other tools** for exploration, summarizing, and small clarifying tasks — e.g. codebase mapping and summaries
3. **Invokes skill-chooser** (my-skills:skill-chooser) for the overall task and, when useful, per step
4. **Outputs a structured plan** (steps, skills, verification) and **does not execute plan steps**

Execution of plan steps is done by @sequencer, @executor, or by the user.

---

## When to Use Ultron

- **Plan agent:** The **plan** agent is enforced to use Ultron for all planning; it must spawn @ultron and may not plan itself.
- You need a **plan with per-step skill recommendations** (skill-chooser).
- You want to hand a structured plan to sequencer/executor.

**Invocation:** Use the **plan** agent (which spawns Ultron), spawn @ultron with the task directly, or use the **/ultron** slash command.

---

## Design Principles (Research-Aligned)

| Principle | Source | How Ultron Applies It |
|-----------|--------|------------------------|
| **As-needed decomposition** | ADaPT, TodoEvolve | Prompt instructs: one step when task is simple/single-focus; multiple steps only when multi-part or phased. Avoid over-decomposition. |
| **Structured handoff** | Magentic-One, CodeSim | Fixed output format: per step — description, skills, verification. Machine-readable for sequencer/executor. |
| **Plan as hypothesis** | Backtracking/replanning literature | Ultron only produces the plan; execution can fail and trigger replan (re-run Ultron or adjust and re-execute). |
| **Clear role separation** | Multi-agent best practices | Ultron does not read/write/execute; it only plans and assigns. Execution is delegated. |

---

## Output Format

Ultron returns a structured plan in this form:

```markdown
## Plan: [task summary]

### Step 1: [title]
- **Description:** [what to do]
- **Skills:** [skill names from skill-chooser]
- **Verification:** [how to check step is done]

### Step 2: ...
...

### Assumptions & risks
[Brief list]
```

---

## Integration Points

- **Tools (explore/summarize):** Ultron uses Read and other tools for exploration, summarizing, and small clarifying tasks.
- **skill-chooser:** Reads `skills/my-skills/skill-chooser/skill_index.json`; recommends 1–3 skills per (sub)task.
- **Config:** Agent and `/ultron` command in opencode.json; AGENTS.md hierarchy; routing: docs/ultron-design.md.

---

## Test Prompt

Use this prompt to test the Ultron subagent. Spawn @ultron with it, or use **/ultron** and paste the prompt.

**Copy-paste:**

```
Spawn @ultron with this task:

Add a small REST API in this repo: one GET endpoint that returns project metadata (name, version from package.json). Then add unit tests for it, and update the README with a short "API" section. Do not implement yet — produce a structured plan with per-step skills and verification for each step.
```

**What to expect:** Ultron should (1) optionally use tools to explore/summarize the repo if needed, (2) invoke skill-chooser for the overall task and per step (e.g. api-design, testing, readme), (3) output a plan with steps in the format above (Description, Skills, Verification) and Assumptions & risks. No code or file edits from Ultron.

**Shorter variant (single-focus):**

```
@ultron Plan only: add a /health GET endpoint that returns { "status": "ok" }. Output structured plan with skills per step; do not implement.
```

---

## Quality Gates

- [ ] Ultron invoked only for planning; no execution by Ultron.
- [ ] Each step has at least one skill recommendation.
- [ ] Plan is actionable: sequencer/executor or human can run steps.
- [ ] Replanning possible: if execution fails, re-run Ultron or adjust plan and continue.

---

**Confidence:** 0.95  
**Related:** AGENTS.md (Agent Hierarchy), my-skills:ultron-planning (when to use).
