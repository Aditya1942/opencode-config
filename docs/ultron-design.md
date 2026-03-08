# Ultron — Planning Sub-Agent Design

**Last updated:** 2026-03-08  
**Scope:** Planning sub-agent that assigns skills and worker CLI per step; plan-only, no execution.

---

## Role

**Ultron** is a planning sub-agent that:

1. **Reads and understands** the user task
2. **Uses the agent CLI** (via shell, docs/cli-cursor-agent.md) for **exploration**, **summarizing**, and **small tasks** — e.g. ask/explore mode for codebase mapping and summaries; run agent with a short prompt for small clarifying work. Does not use claude CLI for these; agent CLI only.
3. **Invokes skill-chooser** (my-skills:skill-chooser) for the overall task and, when useful, per step
4. **Invokes worker-selection** (my-skills:worker-selection) for each step to assign **agent** or **claude** CLI
5. **Outputs a structured plan** (steps, skills, worker, verification) and **does not execute plan steps**

Execution of plan steps is done by @sequencer, @executor, or by running the chosen worker CLI per step (docs/cli-cursor-agent.md, docs/cli-claude-code.md).

---

## When to Use Ultron

- **Plan agent:** The **plan** agent is enforced to use Ultron for all planning; it must spawn @ultron and may not plan itself or via CLI directly.
- You need a **plan with per-step skill recommendations** (skill-chooser) and **per-step worker assignment** (worker-selection).
- You want to hand a structured plan to sequencer/executor or run steps yourself via CLI.

**Invocation:** Use the **plan** agent (which spawns Ultron), spawn @ultron with the task directly, or use the **/ultron** slash command.

---

## Design Principles (Research-Aligned)

| Principle | Source | How Ultron Applies It |
|-----------|--------|------------------------|
| **As-needed decomposition** | ADaPT, TodoEvolve | Prompt instructs: one step when task is simple/single-focus; multiple steps only when multi-part or phased. Avoid over-decomposition. |
| **Structured handoff** | Magentic-One, CodeSim | Fixed output format: per step — description, skills, worker (and reason), verification. Machine-readable for sequencer/executor or scripts. |
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
- **Worker:** [agent | claude] — [one-line reason]
- **Verification:** [how to check step is done]

### Step 2: ...
...

### Assumptions & risks
[Brief list]
```

---

## Integration Points

- **agent CLI (mandatory for explore/summarize/small tasks):** Ultron uses the **agent** CLI via shell (docs/cli-cursor-agent.md) for exploration, summarizing, and small clarifying tasks — e.g. ask/explore mode for mapping and summaries. Does not use claude CLI for these.
- **skill-chooser:** Reads `skills/my-skills/skill-chooser/skill_index.json`; recommends 1–3 skills per (sub)task.
- **worker-selection:** Chooses agent or claude per plan step (for execution); docs/worker-selection-guide.md.
- **team-agents:** When to spawn Ultron vs sequencer/executor; CLI routing table.
- **Config:** Agent and `/ultron` command in opencode.json; AGENTS.md hierarchy; team-agents SKILL.

---

## Test Prompt

Use this prompt to test the Ultron subagent. Spawn @ultron with it, or use **/ultron** and paste the prompt.

**Copy-paste:**

```
Spawn @ultron with this task:

Add a small REST API in this repo: one GET endpoint that returns project metadata (name, version from package.json). Then add unit tests for it, and update the README with a short "API" section. Do not implement yet — produce a structured plan with per-step skills and worker (agent or claude) for each step, plus verification for each step.
```

**What to expect:** Ultron should (1) optionally use the agent CLI to explore/summarize the repo if needed, (2) invoke skill-chooser for the overall task and per step (e.g. api-design, testing, readme), (3) invoke worker-selection for each step, (4) output a plan with steps in the format above (Description, Skills, Worker, Verification) and Assumptions & risks. No code or file edits from Ultron.

**Shorter variant (single-focus):**

```
@ultron Plan only: add a /health GET endpoint that returns { "status": "ok" }. Output structured plan with skills and worker per step; do not implement.
```

---

## Quality Gates

- [ ] Ultron invoked only for planning; no execution by Ultron.
- [ ] Each step has at least one skill recommendation and one worker assignment.
- [ ] Plan is actionable: sequencer/executor or human can run steps via CLI per step.
- [ ] Replanning possible: if execution fails, re-run Ultron or adjust plan and continue.

---

**Confidence:** 0.95  
**Related:** AGENTS.md (Agent Hierarchy), skills/team-agents/SKILL.md (Planning Sub-Agent), my-skills:ultron-planning (when to use).
