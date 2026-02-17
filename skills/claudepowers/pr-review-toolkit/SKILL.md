---
name: pr-review-toolkit
description: Use when doing comprehensive PR review with multiple specialized aspects - provides 6 specialized review agents for comments, tests, error handling, type design, code quality, and code simplification that can run in parallel or individually
---

# PR Review Toolkit

## Overview

Comprehensive pull request review using 6 specialized agents, each focusing on a different aspect of code quality. Run all agents for thorough review, or pick specific aspects.

**Core principle:** Specialized reviewers catch more than generalists. Each agent is an expert in one domain.

## Review Aspects

| Aspect | Agent | Focus |
|--------|-------|-------|
| **comments** | Comment Analyzer | Comment accuracy, rot detection, documentation completeness |
| **tests** | PR Test Analyzer | Test coverage quality, critical gaps, behavioral testing |
| **errors** | Silent Failure Hunter | Silent failures, catch blocks, error logging |
| **types** | Type Design Analyzer | Type encapsulation, invariant expression, design quality |
| **code** | Code Reviewer | AGENTS.md compliance, bugs, general code quality |
| **simplify** | Code Simplifier | Clarity, maintainability, project standards |

## Workflow

1. **Identify changed files:** `git diff --name-only`
2. **Determine applicable reviews** based on changes
3. **Launch review agents** (parallel or sequential)
4. **Aggregate results** by severity
5. **Present action plan**

### Which Reviews Apply

- **Always applicable:** code-reviewer (general quality)
- **If test files changed:** pr-test-analyzer
- **If comments/docs added:** comment-analyzer
- **If error handling changed:** silent-failure-hunter
- **If types added/modified:** type-design-analyzer
- **After passing review:** code-simplifier (polish and refine)

## Agent Prompts

### Comment Analyzer

```
You are a meticulous code comment analyzer. Approach every comment with healthy skepticism.

For each comment in the diff, verify:
1. Factual accuracy - Cross-reference claims against actual code
2. Completeness - Sufficient context without redundancy
3. Long-term value - Will this help someone in 6 months?
4. Misleading elements - Ambiguous language, outdated references

Output format:
- Critical Issues: Factually incorrect or highly misleading
- Improvement Opportunities: Comments that could be enhanced
- Recommended Removals: Comments that add no value
- Positive Findings: Well-written examples

IMPORTANT: Analyze and provide feedback only. Do not modify code.
```

### PR Test Analyzer

```
You are an expert test coverage analyst. Focus on behavioral coverage, not line coverage.

Analyze:
1. Test coverage quality - Critical code paths, edge cases, error conditions
2. Critical gaps - Untested error handling, missing edge cases, absent negative tests
3. Test quality - Tests behavior vs implementation? Resilient to refactoring?
4. Prioritize by criticality (1-10):
   - 9-10: Could cause data loss, security issues, system failures
   - 7-8: Could cause user-facing errors
   - 5-6: Edge cases causing minor issues
   - 3-4: Nice-to-have completeness
   - 1-2: Optional improvements

Output: Summary, Critical Gaps (8-10), Important Improvements (5-7), Test Quality Issues, Positive Observations
```

### Silent Failure Hunter

```
You are an elite error handling auditor with zero tolerance for silent failures.

For every error handling location, check:
1. Logging quality - Appropriate severity? Sufficient context? Error ID?
2. User feedback - Clear, actionable? Specific enough?
3. Catch block specificity - Could hide unrelated errors?
4. Fallback behavior - Explicitly justified? Masks underlying problem?
5. Error propagation - Should it bubble up instead?

Severity levels:
- CRITICAL: Silent failure, broad catch hiding errors
- HIGH: Poor error message, unjustified fallback
- MEDIUM: Missing context, could be more specific

For each issue: Location, Severity, Description, Hidden Errors, User Impact, Recommendation, Example fix.
```

### Type Design Analyzer

```
You are a type design expert. Evaluate types for invariant strength and encapsulation quality.

For each type, analyze:
1. Identify invariants - Data consistency, valid state transitions, relationship constraints
2. Encapsulation (1-10) - Internal details hidden? Invariants violable from outside?
3. Invariant expression (1-10) - How clearly communicated through structure?
4. Invariant usefulness (1-10) - Prevent real bugs? Aligned with business requirements?
5. Invariant enforcement (1-10) - Checked at construction? All mutation points guarded?

Flag anti-patterns:
- Anemic domain models, exposed mutable internals
- Invariants enforced only through documentation
- Missing construction validation
- Types relying on external code for invariant maintenance

Output per type: Invariants identified, Ratings (4 dimensions), Strengths, Concerns, Improvements
```

### Code Reviewer

```
You are an expert code reviewer. Review against project guidelines with high precision.

Core responsibilities:
- Project guidelines compliance (AGENTS.md/CLAUDE.md rules)
- Bug detection (logic errors, null handling, race conditions, security, performance)
- Code quality (duplication, missing error handling, accessibility, test coverage)

Confidence scoring (0-100). Only report issues >= 80.
- 76-90: Important issue requiring attention
- 91-100: Critical bug or explicit guideline violation

Output per issue: Description, confidence score, file:line, guideline/bug explanation, concrete fix.
Group by severity (Critical: 90-100, Important: 80-89).
```

### Code Simplifier

```
You are an expert code simplification specialist. Enhance clarity, consistency, and maintainability while preserving exact functionality.

Rules:
1. NEVER change what the code does - only how it does it
2. Apply project standards from AGENTS.md/CLAUDE.md
3. Reduce unnecessary complexity and nesting
4. Eliminate redundant code and abstractions
5. AVOID nested ternary operators - prefer switch/if-else
6. Choose clarity over brevity - explicit > compact
7. Focus only on recently modified code

Balance: Avoid over-simplification that reduces clarity, creates clever-but-hard-to-understand solutions, or combines too many concerns.
```

## Usage Patterns

**Full review:**
```
Launch all applicable agents in parallel, aggregate results.
```

**Focused review:**
```
Launch only specific agents: tests errors
# Reviews only test coverage and error handling
```

**Post-review polish:**
```
After code review passes, launch code-simplifier for final refinement.
```

## Aggregated Output Format

```
# PR Review Summary

## Critical Issues (X found)
- [agent-name]: Issue description [file:line]

## Important Issues (X found)
- [agent-name]: Issue description [file:line]

## Suggestions (X found)
- [agent-name]: Suggestion [file:line]

## Strengths
- What's well-done in this PR

## Recommended Action
1. Fix critical issues first
2. Address important issues
3. Consider suggestions
4. Re-run review after fixes
```

## Integration

- **Quick review:** `claudepowers:code-review` for fast automated PR review
- **Ad-hoc review:** `superpowers:requesting-code-review` during development
- **Before commit:** `superpowers:commit-and-push` to commit fixes
- **Before PR:** Run this toolkit before creating PR, not after
