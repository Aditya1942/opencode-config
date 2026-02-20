---
name: team-agents
description: "Use when receiving any task that involves sub-tasks like file reading, code comprehension, searching, or simple code generation - delegates micro-work to specialized models based on task type"
---

# Multi-Agent Routing

## Models & Roles

| Model | Role | Subagent Type | Fallback Chain |
|-------|------|---------------|----------------|
| GLM 4.7 Flash | File Explorer (primary) | `explore` | explore-fallback → GPT-5 Nano → Opus 4.6 |
| GLM 5 Free | File Explorer (fallback) | `explore-fallback` | GPT-5 Nano → Opus 4.6 |
| GLM 4.7 | Code Comprehension | `general` | Sonnet 4.6 → GLM 4.7 FlashX → Opus 4.6 |
| MiniMax M2.5 Free | Lightweight Transform | `transform` | GLM 4.7 → Sonnet 4.6 → Opus 4.6 |
| Big Pickle | Pattern Analysis | `explore` | GLM 4.7 → GLM 4.7 FlashX → Opus 4.6 |
| GPT-5 Nano | Validation | `validator` | Sonnet 4.6 → GLM 4.7 Flash → Opus 4.6 |
| GLM 4.7 | Primary Code Executor | `executor` | Sonnet 4.6 → Opus 4.6 |
| Claude Sonnet 4.6 | Fallback Code Executor | `executor-sonnet` | Opus 4.6 |
| Claude Opus 4.6 | Final Authority / Security | — | (final fallback for all) |

**Priority order:** explore/general (Tier 0/1) → executor (GLM 4.7) → executor-sonnet (Sonnet 4.6) → Opus 4.6 (Tier 2, final)

## Task Routing

| Task Type | Primary Agent | Fallback |
|-----------|---------------|----------|
| file_read | GLM 4.7 Flash (`explore`) | GLM 5 Free → GPT-5 Nano → Opus 4.6 |
| search | GLM 4.7 Flash (`explore`) | GLM 5 Free → GPT-5 Nano → Opus 4.6 |
| comprehend | GLM 4.7 (`general`) | Sonnet 4.6 → GLM 4.7 FlashX → Opus 4.6 |
| transform | MiniMax M2.5 Free | GLM 4.7 → Sonnet 4.6 → Opus 4.6 |
| pattern_scan | Big Pickle | GLM 4.7 → GLM 4.7 FlashX → Opus 4.6 |
| validate | GPT-5 Nano | Sonnet 4.6 → GLM 4.7 Flash → Opus 4.6 |
| generate_code | GLM 4.7 (`executor`) | Sonnet 4.6 → Opus 4.6 |
| write_tests | GLM 4.7 (`executor`) | Sonnet 4.6 → Opus 4.6 |
| code_review | GLM 4.7 (`executor`) | Sonnet 4.6 → Opus 4.6 |
| refactor | GLM 4.7 (`executor`) | Sonnet 4.6 → Opus 4.6 |
| deep_analyze | GLM 4.7 (`executor`) | Sonnet 4.6 → Opus 4.6 |
| security | Claude Opus 4.6 | — |
| complex_logic | Claude Opus 4.6 | — |
| architecture | Claude Opus 4.6 | — |

## Confidence Thresholds

| Confidence | Action |
|-----------|--------|
| >= 0.80 | Accept result |
| 0.65–0.79 | Accept with review — verify key aspects yourself |
| 0.50–0.64 | Retry once with next model in fallback chain |
| < 0.50 | Reject — escalate to Claude Opus 4.6 immediately |

## Direct-to-Opus Rules

Bypass routing and go straight to Claude Opus 4.6 for:
- Security audit (always)
- Async/concurrency logic where correctness is critical
- Auth/authorization changes
- Multi-file changes >5 files
- Confidence <0.50 from any model
- Validator returns is_valid: false twice
- Complex debugging requiring 10+ tool calls
- Architectural decisions or system design

**This rule is non-negotiable.**

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Skipping explore/general | Always use explore (GLM 4.7 Flash) and general (GLM 4.7) first |
| Sonnet as Primary Executor | executor (GLM 4.7) is primary; executor-sonnet is fallback only |
| Wrong Specialist | Match task type to model role (see Task Routing) |
| Serial Collapse | Dispatch independent tasks simultaneously |
| Skipping Fallback | Move to next model in chain immediately on failure |
| Opus for Everything | Use Sonnet 4.6 for general work, Opus for security/complex |
| No Validation | Run GPT-5 Nano validator on critical outputs |
| Context-Free Prompts | Write self-contained prompts with explicit file paths |
| Skipping Security | Security = Opus. Always. |
| Ignoring Contradictions | Flag conflict, dispatch tiebreaker |

## Quality Checklist

- Did all dispatched agents return results?
- Do results from different agents agree?
- Are all confidence scores >=0.65 (or escalated)?
- Are all file modifications declared? No hallucinated imports?
- Has the synthesis been coherent, not just concatenated?

## Failure Recovery

**When to trigger fallback:** Model returns empty/wrong/vague output, confidence <0.50, malformed JSON, or provider error. Never retry the same model twice — move to the next in the fallback chain.
