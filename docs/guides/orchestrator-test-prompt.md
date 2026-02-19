# Orchestrator Test Prompt

Copy-paste this into a **new OpenCode session** to verify the tiered agent fleet is routing correctly.

---

## The Prompt

```
@orchestrator

Run a routing verification test for the multi-agent system. I need you to dispatch one task to EACH of these subagent types and report which model each one actually used:

1. **explore** — Read /Users/aditya/.config/opencode/package.json and return its contents. Also report your model name/ID.

2. **general** — Read /Users/aditya/.config/opencode/opencode.json and explain how many agents are defined and what each does. Also report your model name/ID.

3. **transform** — Given this code snippet, rename the variable `foo` to `bar`: `const foo = 42; console.log(foo);`. Return the transformed code. Also report your model name/ID.

4. **validator** — Validate this JSON for correctness: `{"name": "test", "version": "1.0"}`. Report whether it's valid and why. Also report your model name/ID.

5. **executor** — Create a temporary file at /tmp/orchestrator-routing-test.txt with the content "routing test passed" and then read it back to confirm. Also report your model name/ID.

After all 5 tasks complete, produce a routing report table:

| subagent_type | Expected Model | Reported Model | Match? |
|---|---|---|---|
| explore | opencode/glm-5-free | (what it reported) | ✅/❌ |
| general | opencode/kimi-k2.5-free | (what it reported) | ✅/❌ |
| transform | opencode/minimax-m2.5-free | (what it reported) | ✅/❌ |
| validator | opencode/gpt-5-nano | (what it reported) | ✅/❌ |
| executor | zai-coding-plan/glm-4.7 | (what it reported) | ✅/❌ |

This is a routing test only — I want to verify each subagent_type maps to the correct model as defined in opencode.json. Dispatch all 5 tasks and present results. No confirmation gate needed for this test — just execute.
```

---

## What to Look For

### Pass Criteria
- All 5 tasks dispatch and return results (no empty responses)
- Each subagent reports a DIFFERENT model (not all Claude Opus 4.6)
- `explore` → GLM 5 Free or similar free model
- `general` → Kimi K2.5 Free or similar free model
- `transform` → MiniMax M2.5 Free or similar free model
- `validator` → GPT-5 Nano or similar free model
- `executor` → GLM 4.7

### Known Limitations
- Some models may not self-report their model ID accurately (they may say "I'm Claude" when they're actually a different model running through a proxy)
- The real signal is whether the response **style and speed** differ across subagents — free models respond noticeably faster and with different formatting
- Check the session child sessions (`<Leader>+Right`) to see each subagent's individual session

### Failure Modes
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| All report Claude Opus 4.6 | Config not loaded — still using old session | Start a brand new session |
| Some agents return empty | Model doesn't support the task or is down | Check model availability with `opencode models` |
| Agent not found error | Agent name doesn't match config | Check `opencode.json` agent names match exactly |
| Orchestrator doesn't dispatch | Orchestrator prompt doesn't reference the agent | Check routing table in orchestrator prompt |
