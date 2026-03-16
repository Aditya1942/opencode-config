---
name: Remove cursor-agent and refs
overview: Remove the cursor-agent tool, its script, the three Cursor-native subagents (cursor-explorer, cursor-general, cursor-reviewer), the cursor-agent and cursor-agent-tool skills, and update all agents and skills that reference them so the config uses only opencode tools (@explore, @executor, @code-reviewer).
todos: []
isProject: false
---

# Plan: Remove cursor-agent and All References from OpenCode Config

## Scope

**Remove:**

- The `cursor_agent` tool (plugin) and the script it runs
- The three agents that depend on it: `cursor-explorer`, `cursor-general`, `cursor-reviewer`
- The two skills: `cursor-agent`, `cursor-agent-tool`
- All references in agents, skills, docs, and skill index

**Result:** Routing uses only opencode tools: `@explore`, `@executor`, `@code-reviewer`. No Cursor CLI delegation.

---

## 1. Delete cursor-agent assets

- **Delete** [scripts/run-cursor-agent.js](scripts/run-cursor-agent.js) (the script invoked by the tool).
- **Delete** directory [skills/my-skills/cursor-agent/](skills/my-skills/cursor-agent/) (and its `SKILL.md`).
- **Delete** directory [skills/my-skills/cursor-agent-tool/](skills/my-skills/cursor-agent-tool/) (and its `SKILL.md`).

---

## 2. Plugin: remove cursor_agent tool

**File:** [plugins/my-skills.js](plugins/my-skills.js)

- Remove the constant `RUN_CURSOR_AGENT_SCRIPT` (line 18).
- Remove th[e]() entire `cursor_agent` tool definition: the `tool({...})` object (description, args, execute) and its registration in the returned tools object (~lines 172–279). Keep the `skill` tool unchanged.

---

## 3. Config: remove Cursor subagents and update routing

**File:** [opencode.json](opencode.json)

- **Remove** the three agent blocks: `cursor-explorer`, `cursor-general`, `cursor-reviewer` (lines 115–132).
- **Update `build` agent** (line 69): Replace the prompt so it no longer mentions `@cursor-explorer`, `@cursor-general`, or `@cursor-reviewer`. Route only to `@explore`, `@sequencer` → `@executor`, and `@cursor-reviewer` → `@code-reviewer`. Example wording: exploration/summary → `@explore`; big/multi-step → `@sequencer` then `@executor`; small/single-step → tools or `@executor`; review → `@code-reviewer`; flow ref: `my-skills:sequential-task-runner`.
- **Update `orchestrator` agent** (line 75): Remove all mentions of `@cursor-general` and `@cursor-reviewer`. Phases: Plan (@ultron) → Sequence (@sequencer + sequential-thinking) → Execute (@executor) → Review (@code-reviewer) → Close. Ref: `my-skills:workflow-orchestration`, `my-skills:subagent-driven-development`.

---

## 4. Skill index: remove cursor-agent entries

**File:** [skills/my-skills/skill-chooser/skill_index.json](skills/my-skills/skill-chooser/skill_index.json)

- Remove the two skill objects in the `skills` array (around 209–233):
  - The one with `"n": "cursor-agent"` (and its `d`, `k`).
  - The one with `"n": "cursor-agent-tool"` (and its `d`, `k`).

---

## 5. Skills: remove cursor-agent and Cursor subagent references


| File                                                                                                           | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [skills/update-config/SKILL.md](skills/update-config/SKILL.md)                                                 | Agents: list 9 agents (drop cursor-explorer, cursor-general, cursor-reviewer). Remove the bullet "Other skills: ... cursor-agent". Remove the "Cursor-native subagents" bullet entirely.                                                                                                                                                                                                                                                                                                  |
| [skills/my-skills/workflow-orchestration/SKILL.md](skills/my-skills/workflow-orchestration/SKILL.md)           | Description: drop `@cursor-general`/`@cursor-reviewer`; "execute (@executor), review (@code-reviewer)". Phase 3: single path "Execute via @executor". Phase 4: single path "Review via @code-reviewer". Routing table: "Exploration / summary → @explore". Remove "Related Skills" bullet for `cursor-agent`.                                                                                                                                                                             |
| [skills/my-skills/sequential-task-runner/SKILL.md](skills/my-skills/sequential-task-runner/SKILL.md)           | Description: "Spawn sequencer then executor". Body: remove all cursor_agent and @cursor-general / @cursor-reviewer mentions. Subagents table: only @sequencer, @executor; remove @cursor-general row. Flows: keep only "OpenCode Tools Flow" (sequencer → executor → code-reviewer); remove "Cursor-Native Flow". Checklist: "executor" only; review → @code-reviewer. Anti-patterns: "use @executor directly" instead of @cursor-general.                                                |
| [skills/my-skills/subagent-driven-development/SKILL.md](skills/my-skills/subagent-driven-development/SKILL.md) | Description: list only @sequencer, @executor, @explore (no cursor-*). Body: "or the cursor_agent tool" → remove that phrase. Routing table: single column Preferred (e.g. @explore, sequencer → @executor, direct tools or @executor, @ultron, @code-reviewer); remove "Cursor-native" column and @cursor-* rows. Checklist: @explore, @executor, @code-reviewer only. Forbidden: @cursor-explorer → @explore, @cursor-general → @executor. Remove "Integration" bullet for cursor-agent. |


---

## 6. Docs and README


| File                                                                                 | Changes                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/AGENTS.md](docs/AGENTS.md)                                                     | Remove the three table rows for cursor-explorer, cursor-general, cursor-reviewer. In "Before completion" and "Cursor subagents" bullets, remove references to @cursor-reviewer and the Cursor subagents sentence.                                                                                           |
| [README.md](README.md)                                                               | In "Primary agents" sentence, remove "Cursor-native subagents cursor-explorer, cursor-general, cursor-reviewer delegate... cursor_agent tool". In both agent tables, remove the three cursor-* rows.                                                                                                        |
| [.opencode/INSTALL.md](.opencode/INSTALL.md)                                         | In "Agents configured", remove cursor-explorer, cursor-general, cursor-reviewer from the list and remove the sentence about Cursor-native subagents and cursor_agent / Cursor CLI.                                                                                                                          |
| [docs/test-plan-subagents-cursor-agent.md](docs/test-plan-subagents-cursor-agent.md) | **Option A:** Delete (entire doc is cursor_agent + cursor-* subagent tests). **Option B:** Keep but add a short note at top: "OBSOLETE: cursor-agent and Cursor subagents removed; this test plan is retained for reference only." Prefer **Option A** unless you need to keep the test spec for reference. |


---

## 7. Verification

- Search repo for: `cursor-agent`, `cursor_agent`, `cursor-explorer`, `cursor-general`, `cursor-reviewer`, `run-cursor-agent` — expect no remaining references (or only the obsolete test-plan note if Option B).
- Ensure [plugins/my-skills.js](plugins/my-skills.js) still exports the `skill` tool and that no syntax errors remain.
- Ensure [opencode.json](opencode.json) is valid JSON and lists 9 agents (build, plan, orchestrator, sequencer, executor, explore, ultron, architect, code-reviewer).

---

## Dependency order

1. Delete script + skill dirs (no code depends on them after plugin change).
2. Edit plugin (remove tool).
3. Edit opencode.json (remove agents, update build + orchestrator).
4. Edit skill_index.json.
5. Edit the four skills (update-config, workflow-orchestration, sequential-task-runner, subagent-driven-development).
6. Edit docs (AGENTS.md, README.md, INSTALL.md) and remove or obsolete test plan.

No MCP entries reference cursor-agent; the only integration was the `cursor_agent` tool in the my-skills plugin.