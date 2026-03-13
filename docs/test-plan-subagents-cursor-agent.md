# Test Plan: All Subagents + cursor_agent End-to-End

**Created:** 2026-03-12  
**Scope:** Functional tests for `cursor_agent` tool (unit), `@cursor-explorer`, `@cursor-general`, `@cursor-reviewer` subagents, primary agent routing (`build`, `plan`, `orchestrator`), and a full end-to-end coding workflow.  
**How to use:** Run each test in an OpenCode session. Copy the prompt verbatim into the agent. Check the result against the Expected column. Tick the checkbox when passing.

---

## Prerequisites (run once before all tests)

```bash
# 1. Verify Cursor CLI is installed and authenticated
agent --version
agent login   # or: echo $CURSOR_API_KEY

# 2. Verify opencode.json is valid and has 12 agents
node -e "
  const j = JSON.parse(require('fs').readFileSync('opencode.json','utf8'));
  console.log('✅ Valid JSON');
  console.log('Agent count:', Object.keys(j.agent).length);
  console.log('Agents:', Object.keys(j.agent).join(', '));
" 
# Expected output: Agent count: 12

# 3. Create sandbox project for Groups 3, 4, and 6
mkdir -p /tmp/cursor-test

cat > /tmp/cursor-test/package.json << 'EOF'
{"name":"cursor-test","version":"1.0.0"}
EOF

cat > /tmp/cursor-test/add.js << 'EOF'
function add(a, b) { return a + b; }
module.exports = { add };
EOF

cat > /tmp/cursor-test/auth.js << 'EOF'
const DB_PASSWORD = "supersecret123";
function login(user, pass) {
  console.log("Logging in: " + user);
  if (pass === DB_PASSWORD) return true;
  return false;
}
module.exports = { login };
EOF

echo "✅ Sandbox ready at /tmp/cursor-test"
ls /tmp/cursor-test

# 4. Restart OpenCode to pick up the new agent definitions
```

**Prerequisite checklist:**
- [ ] `agent --version` returns a valid version string
- [ ] `agent login` succeeds (or `CURSOR_API_KEY` is set)
- [ ] `opencode.json` reports 12 agents
- [ ] `/tmp/cursor-test/` contains `package.json`, `add.js`, `auth.js`
- [ ] OpenCode restarted after config update

---

## Group 1 — cursor_agent Tool (Unit Tests)

> **Session agent:** any (use `@build` or default)  
> **Purpose:** Verify the raw `cursor_agent` tool behaves correctly across all modes, error paths, and options.

---

### T1 — Ask mode: explain code

**Prompt:**
```
Use cursor_agent with:
  prompt = "Explain what the resolveSkill function in plugins/my-skills.js does — describe its inputs, logic, and return value"
  cwd    = "/Users/aditya/.config/opencode"
  mode   = "ask"
```

**Expected:** Plain-text explanation returned. No `{"success":false}`. No file edits.  
- [ ] Pass

---

### T2 — Plan mode: architecture review

**Prompt:**
```
Use cursor_agent with:
  prompt = "Analyze the agent architecture in opencode.json. List each agent's name, mode, and role in one sentence each."
  cwd    = "/Users/aditya/.config/opencode"
  mode   = "plan"
```

**Expected:** Structured list of agents with roles. No file mutations.  
- [ ] Pass

---

### T3 — Agent mode: coding task

**Prompt:**
```
Use cursor_agent with:
  prompt = "Add a JSDoc comment above the resolveSkill function in plugins/my-skills.js. The comment should describe: @param {string} name - the skill name, @returns {{ path, collection, skillName } | null}. Do not change any logic."
  cwd    = "/Users/aditya/.config/opencode"
  mode   = "agent"
```

**Expected:** JSDoc comment added to `plugins/my-skills.js`. Function logic unchanged. Result string confirms the edit.  
**Verify:** `git diff plugins/my-skills.js` shows only the JSDoc addition.  
- [ ] Pass

---

### T4 — Invalid mode guard

**Prompt:**
```
Use cursor_agent with:
  prompt = "Hello"
  mode   = "invalid"
```

**Expected:** Returns `{"success":false,"error":"Invalid mode \"invalid\". Valid modes: agent, plan, ask"}` immediately without spawning the CLI.  
- [ ] Pass

---

### T5 — No cwd (fallback documents the gotcha)

**Prompt:**
```
Use cursor_agent with:
  prompt = "List the files in the current working directory"
  (do NOT set cwd)
```

**Expected:** Runs in the opencode config dir (`~/.config/opencode`). Result mentions files from that directory, NOT a project dir. Documents that omitting cwd defaults to config dir.  
- [ ] Pass

---

### T6 — Thinking mode

**Prompt:**
```
Use cursor_agent with:
  prompt = "What does this one line do in plugins/my-skills.js: const COLLECTIONS = ['my-skills', 'update-config']"
  cwd    = "/Users/aditya/.config/opencode"
  include_thinking = true
```

**Expected:** Response has the format:
```
Result:
<explanation text>

Thinking:
<at least one thinking chunk>
```
- [ ] Pass

---

### T7 — Error recovery: bad cwd

**Prompt:**
```
Use cursor_agent with:
  prompt = "List the files here"
  cwd    = "/nonexistent/path/that/does/not/exist"
```

**Expected:** Returns explicit `{"success":false,"error":"..."}` string. Does not hang. Error message is actionable.  
- [ ] Pass

---

### T8 — Model selection

**Prompt:**
```
Use cursor_agent with:
  prompt = "In one sentence, what does add.js do in /tmp/cursor-test?"
  cwd    = "/tmp/cursor-test"
  mode   = "ask"
  model  = "composer-1.5"
```

**Expected:** Model is accepted (no "invalid model" error). Response is a one-sentence description.  
- [ ] Pass

---

### T9 — Chained calls (result of first feeds second)

**Prompt:**
```
Step 1 — Use cursor_agent with:
  prompt = "List the exported function names in /tmp/cursor-test/add.js"
  cwd    = "/tmp/cursor-test"
  mode   = "ask"

Step 2 — Take the result of step 1 and use cursor_agent with:
  prompt = "Given these exported functions: [RESULT FROM STEP 1] — write a one-line description for each"
  cwd    = "/tmp/cursor-test"
  mode   = "ask"
```

**Expected:** Step 1 returns function list (`add`). Step 2 returns descriptions for each function from step 1's result.  
- [ ] Pass

---

### T10 — Timeout guard (ACP mode stress)

**Prompt:**
```
Use cursor_agent with:
  prompt = "Recursively explain every function in every file in /tmp/cursor-test in extreme detail"
  cwd    = "/tmp/cursor-test"
  include_thinking = true
```

**Expected:** Completes within 120s OR returns a clean timeout error `{"success":false,"error":"cursor_agent timed out after 120s"}`. Never hangs indefinitely.  
- [ ] Pass

---

## Group 2 — @cursor-explorer (Subagent Tests)

> **Session agent:** `@cursor-explorer`  
> **Purpose:** Verify the explorer subagent delegates to cursor_agent in plan/ask mode only and never mutates files.

---

### E1 — Basic codebase exploration

**Prompt to `@cursor-explorer`:**
```
Summarize the structure of /Users/aditya/.config/opencode — what are the main directories and what is each one's purpose?
```

**Expected:** Structured summary (e.g. `plugins/`, `skills/`, `docs/`, `scripts/` with one-line descriptions). No file edits. cursor_agent called with `mode="ask"` or `mode="plan"`.  
- [ ] Pass

---

### E2 — Brainstorming

**Prompt to `@cursor-explorer`:**
```
Brainstorm 3 different approaches to add a new /checkpoint slash command to this opencode config that saves a named snapshot of the current conversation state to memory. Do not implement anything.
```

**Expected:** 3 distinct approaches with brief pros/cons each. cursor_agent called in `mode="plan"`. No implementation.  
- [ ] Pass

---

### E3 — Architecture review

**Prompt to `@cursor-explorer`:**
```
Analyze the plugin architecture in /Users/aditya/.config/opencode/plugins/my-skills.js. Identify: (1) the main patterns used, (2) how the cursor_agent tool is exposed, (3) any risks or improvement opportunities.
```

**Expected:** Architecture analysis with the 3 requested sections. cursor_agent used in `mode="plan"` or `mode="ask"`.  
- [ ] Pass

---

### E4 — Mode enforcement check

**After running E1–E3, verify:**
```bash
# No files should have been modified
git -C /Users/aditya/.config/opencode diff --name-only
```

**Expected:** Empty output (no modifications). The subagent NEVER used `mode="agent"`.  
- [ ] Pass

---

### E5 — Scoped exploration

**Prompt to `@cursor-explorer`:**
```
Focus only on the resolveSkill function in /Users/aditya/.config/opencode/plugins/my-skills.js. How does it handle the colon-separated "collection:name" format? What happens when no match is found?
```

**Expected:** Focused answer about `resolveSkill` logic. Does not dump unrelated file content.  
- [ ] Pass

---

### E6 — Architect/brainstorm mode (plan mode)

**Prompt to `@cursor-explorer`:**
```
Perform an architecture review of the opencode agent system in /Users/aditya/.config/opencode. Evaluate: coupling between agents, single points of failure, and recommend 2 improvements.
```

**Expected:** Structured architecture review with recommendations. Uses `mode="plan"`.  
- [ ] Pass

---

## Group 3 — @cursor-general (Subagent Tests)

> **Session agent:** `@cursor-general`  
> **Purpose:** Verify the execution workhorse delegates to cursor_agent in agent mode, handles errors, and chains steps.  
> **Sandbox:** `/tmp/cursor-test/` (created in Prerequisites)

---

### G1 — Simple coding task

**Prompt to `@cursor-general`:**
```
In /tmp/cursor-test/add.js, add a subtract(a, b) function below the existing add() function. Also add subtract to module.exports. Keep the existing add() function unchanged.
```

**Expected:** `subtract` function added. `module.exports` updated to include `subtract`. `add` untouched.  
**Verify:** `cat /tmp/cursor-test/add.js`  
- [ ] Pass

---

### G2 — Input validation

**Prompt to `@cursor-general`:**
```
Add input validation to the add() function in /tmp/cursor-test/add.js. If either argument is not a number, throw a TypeError with the message "Arguments must be numbers". Do not change the return value or export.
```

**Expected:** `typeof` check added inside `add()`. TypeError thrown on non-numbers. Return value unchanged. Export unchanged.  
- [ ] Pass

---

### G3 — Write new file

**Prompt to `@cursor-general`:**
```
Create /tmp/cursor-test/add.test.js with Jest unit tests for the add() and subtract() functions. Use describe/it blocks. Include at minimum: normal addition, normal subtraction, and one edge case each (e.g. negative numbers, zero).
```

**Expected:** New file `/tmp/cursor-test/add.test.js` created. Uses `describe`/`it` syntax. Tests for both functions.  
**Verify:** `cat /tmp/cursor-test/add.test.js`  
- [ ] Pass

---

### G4 — Shell command execution

**Prompt to `@cursor-general`:**
```
In /tmp/cursor-test, run the command: node -e "console.log('hello from cursor-general')" and report the exact output.
```

**Expected:** Returns `hello from cursor-general`.  
- [ ] Pass

---

### G5 — Error detection and reporting

**Prompt to `@cursor-general`:**
```
Edit /tmp/cursor-test/DOES_NOT_EXIST.js to add a foo() function.
```

**Expected:** Subagent receives a `{"success":false,...}` result from cursor_agent and reports the error clearly to the user with a suggested fix (e.g. "file does not exist — check the path"). Does NOT silently pass.  
- [ ] Pass

---

### G6 — Multi-step chained execution

**Prompt to `@cursor-general`:**
```
Execute these 3 steps in order in /tmp/cursor-test:
Step 1: Add a multiply(a, b) function to add.js (returns a * b). Export it.
Step 2: Add 2 Jest tests for multiply() to add.test.js — one normal case and one with zero.
Step 3: Run node -e "const {multiply}=require('./add'); console.log(multiply(3,4))" and report the output.
```

**Expected:** All 3 steps complete. `multiply` in `add.js`, 2 tests in `add.test.js`, output `12` from step 3.  
**Verify:** `cat /tmp/cursor-test/add.js && cat /tmp/cursor-test/add.test.js`  
- [ ] Pass

---

### G7 — Constraint adherence

**Prompt to `@cursor-general`:**
```
In /tmp/cursor-test/add.js, rename the add() function body to use a local variable named result before returning. The function signature, module.exports key ('add'), and behavior must stay identical.
```

**Expected:** Internal refactor only. `module.exports = { add, ... }` key unchanged. Function still exported as `add`. Behavior identical.  
- [ ] Pass

---

## Group 4 — @cursor-reviewer (Subagent Tests)

> **Session agent:** `@cursor-reviewer`  
> **Purpose:** Verify the reviewer subagent delegates to cursor_agent in ask/plan mode only, applies the review checklist, and never mutates files.  
> **Sandbox:** `/tmp/cursor-test/` — `auth.js` has deliberate CRITICAL flaw (hardcoded password + console.log).

---

### R1 — Security finding triggers Block verdict

**Prompt to `@cursor-reviewer`:**
```
Review /tmp/cursor-test/auth.js for security and code quality issues. Apply the full checklist: Security (CRITICAL) → Code quality (HIGH) → Patterns (HIGH) → Performance (MEDIUM) → Best practices (LOW). End with a Review Summary and Verdict.
```

**Expected:**
- `[CRITICAL]` finding for hardcoded password (`DB_PASSWORD = "supersecret123"`)
- `[HIGH]` finding for `console.log` leaking username
- Verdict: **Block**
- Uses `mode="ask"` (no file edits)

- [ ] Pass

---

### R2 — Clean code review returns Approve

**Prompt to `@cursor-reviewer`:**
```
Review /tmp/cursor-test/add.js for security and code quality. Apply the full checklist and end with a Verdict.
```

**Expected:** No CRITICAL findings. Verdict: **Approve** or **Warning** (minor issues only). No file edits.  
- [ ] Pass

---

### R3 — Multi-file review

**Prompt to `@cursor-reviewer`:**
```
Review all JS files in /tmp/cursor-test/ (add.js, auth.js, add.test.js if it exists) for security, quality, and patterns. Produce a consolidated report with a per-file summary and an overall Verdict.
```

**Expected:** Per-file findings. Overall Verdict: **Block** (because auth.js has CRITICAL). No file edits.  
- [ ] Pass

---

### R4 — Diff-based review

**Prompt to `@cursor-reviewer`:**
```
Review this change for quality and security:

--- a/add.js
+++ b/add.js
@@ -1,2 +1,6 @@
+const API_KEY = "hardcoded-key-12345";
 function add(a, b) { return a + b; }
-module.exports = { add };
+function fetchData(url) {
+  console.log("fetching: " + url);
+  return fetch(url + "?key=" + API_KEY);
+}
+module.exports = { add, fetchData };

Apply the full review checklist and give a Verdict.
```

**Expected:** CRITICAL for hardcoded API key. HIGH for console.log. Verdict: **Block**.  
- [ ] Pass

---

### R5 — Mode enforcement and no mutations

**After R1–R4, verify:**
```bash
git -C /tmp/cursor-test diff --name-only 2>/dev/null || git -C /Users/aditya/.config/opencode diff --name-only
```

**Expected:** No files modified by the reviewer. cursor_agent was called with `mode="ask"` or `mode="plan"` only.  
- [ ] Pass

---

### R6 — Verdict accuracy matrix

| Scenario | File | Expected Verdict |
|----------|------|-----------------|
| Has hardcoded password | `auth.js` | **Block** |
| Simple math functions | `add.js` | **Approve** |
| Mix of both | Both | **Block** |

Run each scenario as a separate `@cursor-reviewer` prompt and verify the verdict string matches exactly.  
- [ ] Pass

---

## Group 5 — Primary Agent Routing Tests

> **Purpose:** Verify `build`, `plan`, and `orchestrator` correctly route to the new cursor subagents.

---

### P1 — build routes exploration to @cursor-explorer

**Prompt to `@build`:**
```
Explore the skills/ directory in /Users/aditya/.config/opencode and give me a structured summary of what's there.
```

**Expected:** `@build` spawns `@cursor-explorer` (preferred for deep analysis). Returns structured summary via cursor_agent.  
- [ ] Pass

---

### P2 — build routes coding task to @cursor-general

**Prompt to `@build`:**
```
Create /tmp/cursor-test/hello.js with a single hello() function that returns the string "Hello, World!". Export it.
```

**Expected:** `@build` delegates to `@cursor-general`. File created with correct content.  
**Verify:** `cat /tmp/cursor-test/hello.js`  
- [ ] Pass

---

### P3 — build invokes @cursor-reviewer before finishing

**Prompt to `@build`:**
```
Add a divide(a, b) function to /tmp/cursor-test/add.js. After implementing it, review the code before marking the task done.
```

**Expected:** `@build` implements via `@cursor-general` then spawns `@cursor-reviewer` (or `@code-reviewer`) before reporting done.  
- [ ] Pass

---

### P4 — plan uses @cursor-explorer for architecture context

**Prompt to `@plan`:**
```
Plan adding a new /checkpoint slash command to the opencode config that saves the current task state to memory. Do not implement — produce a structured plan.
```

**Expected:** `@plan` spawns `@cursor-explorer` (mode=plan) to gather architecture context, then spawns `@ultron` for the structured plan. Returns plan with steps and skills.  
- [ ] Pass

---

### P5 — orchestrator routes to @cursor-explorer

**Prompt to `@orchestrator`:**
```
Summarize the plugin architecture in /Users/aditya/.config/opencode/plugins/
```

**Expected:** Orchestrator routes to `@cursor-explorer` (Cursor-native path, not @explore). Returns summary.  
- [ ] Pass

---

### P6 — orchestrator end-to-end: write then review

**Prompt to `@orchestrator`:**
```
Write a simple clamp(value, min, max) function in /tmp/cursor-test/clamp.js that clamps value between min and max. Then review the code for quality.
```

**Expected:** Orchestrator → `@sequencer` (plan) → `@cursor-general` (write) → `@cursor-reviewer` (review). Both files verified. Verdict returned.  
- [ ] Pass

---

### P7 — orchestrator routes review directly

**Prompt to `@orchestrator`:**
```
Review /tmp/cursor-test/auth.js for security issues.
```

**Expected:** Orchestrator spawns `@cursor-reviewer` directly. Returns Block verdict with CRITICAL finding.  
- [ ] Pass

---

## Group 6 — Full End-to-End Coding Task

> **Purpose:** One complete coding workflow exercising all three cursor subagents in sequence.  
> **Scenario:** Add a `divide(a, b)` function with zero-division guard to the test project, with a unit test, then review it.

---

### Step 1 — Explore (cursor-explorer)

**Prompt to `@cursor-explorer`:**
```
Analyze /tmp/cursor-test/add.js and /tmp/cursor-test/add.test.js (if it exists).
What patterns are used for functions and exports? How should a new divide(a, b) function with error handling fit in consistently?
```

**Expected:** Design notes describing existing patterns. Recommendation for how divide() should be structured. No file edits.  
- [ ] Pass

---

### Step 2 — Implement (cursor-general)

**Prompt to `@cursor-general`:**
```
Based on the pattern in /tmp/cursor-test/add.js, add a divide(a, b) function:
- Returns a / b
- Throws Error("division by zero") if b === 0
- Add it to module.exports
Do not change existing functions or exports.
```

**Expected:** `divide` function added. Export updated. `add`, `subtract` (if present) unchanged.  
**Verify:** `cat /tmp/cursor-test/add.js`  
- [ ] Pass

---

### Step 3 — Write tests (cursor-general)

**Prompt to `@cursor-general`:**
```
Add 3 Jest tests for divide() to /tmp/cursor-test/add.test.js:
1. Normal case: divide(10, 2) === 5
2. Zero divisor: expect(() => divide(1, 0)).toThrow("division by zero")
3. Negative numbers: divide(-6, 3) === -2
Follow the same describe/it structure already in the file (or create the file if it doesn't exist).
```

**Expected:** 3 tests added for `divide`. Existing tests untouched. File has valid Jest syntax.  
**Verify:** `cat /tmp/cursor-test/add.test.js`  
- [ ] Pass

---

### Step 4 — Review (cursor-reviewer)

**Prompt to `@cursor-reviewer`:**
```
Review the divide() implementation in /tmp/cursor-test/add.js and its tests in /tmp/cursor-test/add.test.js.
Apply the full review checklist (Security → Quality → Patterns → Performance → Best practices).
End with a Review Summary and Verdict.
```

**Expected:** No CRITICAL findings. Verdict: **Approve** (the divide function is simple and correct). Any MEDIUM/LOW findings are minor.  
- [ ] Pass

---

### Step 5 — Verify runtime (sanity check)

```bash
node -e "
  const { add, divide } = require('/tmp/cursor-test/add.js');
  console.log('add(2,3)=', add(2, 3));         // 5
  console.log('divide(10,2)=', divide(10, 2));  // 5
  try { divide(1, 0); } catch(e) { console.log('zero guard:', e.message); }
"
```

**Expected output:**
```
add(2,3)= 5
divide(10,2)= 5
zero guard: division by zero
```
- [ ] Pass

---

## Test Execution Checklist (Master)

```
Prerequisites
  [ ] agent --version  →  valid version string
  [ ] agent login      →  authenticated  
  [ ] opencode.json    →  valid JSON, 12 agents
  [ ] /tmp/cursor-test →  package.json, add.js, auth.js present
  [ ] OpenCode restarted

Group 1 — cursor_agent tool (unit)
  [ ] T1  ask mode
  [ ] T2  plan mode
  [ ] T3  agent mode coding task
  [ ] T4  invalid mode guard
  [ ] T5  no cwd fallback
  [ ] T6  thinking mode
  [ ] T7  error recovery bad cwd
  [ ] T8  model selection
  [ ] T9  chained calls
  [ ] T10 timeout guard

Group 2 — @cursor-explorer
  [ ] E1  basic exploration
  [ ] E2  brainstorming
  [ ] E3  architecture review
  [ ] E4  mode enforcement (no agent mode, no mutations)
  [ ] E5  scoped exploration
  [ ] E6  architect/brainstorm plan mode

Group 3 — @cursor-general
  [ ] G1  simple coding task
  [ ] G2  input validation
  [ ] G3  write new file
  [ ] G4  shell command execution
  [ ] G5  error detection and reporting
  [ ] G6  multi-step chained execution
  [ ] G7  constraint adherence

Group 4 — @cursor-reviewer
  [ ] R1  security CRITICAL → Block verdict
  [ ] R2  clean code → Approve verdict
  [ ] R3  multi-file review
  [ ] R4  diff-based review
  [ ] R5  mode enforcement (no agent mode, no mutations)
  [ ] R6  verdict accuracy matrix

Group 5 — Primary agent routing
  [ ] P1  build → cursor-explorer
  [ ] P2  build → cursor-general
  [ ] P3  build → cursor-reviewer before done
  [ ] P4  plan → cursor-explorer + ultron
  [ ] P5  orchestrator → cursor-explorer
  [ ] P6  orchestrator → sequencer → cursor-general → cursor-reviewer
  [ ] P7  orchestrator → cursor-reviewer direct

Group 6 — Full E2E coding task
  [ ] Step 1  explore (cursor-explorer)
  [ ] Step 2  implement divide() (cursor-general)
  [ ] Step 3  write tests (cursor-general)
  [ ] Step 4  review (cursor-reviewer)
  [ ] Step 5  verify runtime (node sanity check)
```

---

## Pass/Fail Summary Table

Fill in after each session:

| Group | Tests | Pass | Fail | Notes |
|-------|-------|------|------|-------|
| Group 1 — cursor_agent tool | 10 | | | |
| Group 2 — @cursor-explorer | 6 | | | |
| Group 3 — @cursor-general | 7 | | | |
| Group 4 — @cursor-reviewer | 6 | | | |
| Group 5 — Primary routing | 7 | | | |
| Group 6 — E2E coding task | 5 | | | |
| **Total** | **41** | | | |

---

## Known Risks & Gotchas

| Risk | Mitigation |
|------|------------|
| Cursor CLI not on PATH | Run `agent --version` in prerequisites; install if missing |
| Not authenticated | Run `agent login` or set `CURSOR_API_KEY` env var before tests |
| ACP mode (include_thinking) slow | T6/T10 may take up to 80s — set expectation before running |
| Sandbox files mutated between tests | Re-run Prerequisites bash block to reset `/tmp/cursor-test` |
| cursor-reviewer accidentally uses agent mode | Check git diff after each R-series test |
| T3 JSDoc edit leaves dirty git state | Run `git checkout plugins/my-skills.js` after T3 to clean up |

---

## Cleanup After Testing

```bash
# Remove sandbox
rm -rf /tmp/cursor-test

# Revert any test edits to config files (T3)
git -C /Users/aditya/.config/opencode checkout plugins/my-skills.js

# Verify clean state
git -C /Users/aditya/.config/opencode status
```

---

**Related docs:**
- [`docs/AGENTS.md`](AGENTS.md) — Agent hierarchy and routing rules
- [`skills/my-skills/cursor-agent/SKILL.md`](../skills/my-skills/cursor-agent/SKILL.md) — cursor_agent tool full reference
- [`opencode.json`](../opencode.json) — Agent definitions (12 agents)
