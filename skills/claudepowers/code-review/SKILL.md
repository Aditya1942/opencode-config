---
name: code-review
description: Use when reviewing a pull request for bugs, AGENTS.md compliance, and code quality - launches parallel review agents with confidence-based scoring to filter false positives, optionally posts inline PR comments
---

# PR Code Review

## Overview

Comprehensive PR review using specialized parallel agents. Each agent independently reviews changes, then results are validated and filtered to produce high-signal feedback only.

**Core principle:** Multiple independent reviewers with confidence-based filtering produce better results than a single pass.

## When to Use

- Before merging any PR
- After receiving a PR for review
- When running `/code-review` on a PR URL
- Automated review in CI/CD pipelines

## Review Agents

| Agent | Focus | When to Use |
|-------|-------|-------------|
| Guidelines Compliance (×2) | AGENTS.md/CLAUDE.md audit | Always |
| Bug Detection | Logic errors, missing imports | Always |
| Security & Logic | Security, incorrect logic | Always |
| Comment Analyzer | Comment accuracy, rot | If comments/docs changed |
| Test Analyzer | Coverage quality, gaps | If tests changed |
| Silent Failure Hunter | Error handling audit | If error handling changed |
| Type Design Analyzer | Type encapsulation | If types changed |
| Code Simplifier | Clarity, maintainability | Post-review polish |

## Workflow

### 1. Pre-flight Checks

Launch explore subagent to verify:
- PR is not closed or draft
- PR has not already been reviewed (`gh pr view <PR> --comments`)
- PR is not trivially correct (automated/generated)

If any condition fails, stop and explain why.

### 2. Gather Guidelines

Launch explore subagent to find:
- Root AGENTS.md or CLAUDE.md file
- Any AGENTS.md/CLAUDE.md files in directories containing modified files
- Project-specific coding standards

### 3. PR Summary

Launch explore subagent to:
- View the PR diff with `gh pr diff <PR>`
- Return structured summary of changes

### 4. Launch Review Agents

Launch applicable agents in parallel based on changes (see table above).

**Agent Prompt Template:**

```
You are a [agent-name] reviewing this PR for [specific focus].

PR Title: {title}
PR Description: {description}

Guidelines to check against:
{guidelines content}

Review the diff:
git diff {base}...{head}

For each issue found, provide:
- Description of the issue
- Why it was flagged (bug, guideline violation, security)
- File path and line number
- Confidence score (0-100)
- Suggested fix

Only report issues with confidence >= 80.
```

### 5. Validate Findings

For each issue from Step 4, launch validation subagent:
- Provide PR context + issue description
- Agent validates: Is this truly an issue with high confidence?
- For bugs: Verify the variable/function actually behaves as claimed
- For guideline violations: Verify the rule is actually violated and scoped correctly

Use general subagents for bug validation, explore for guideline validation.

### 6. Filter and Present

Filter out issues not validated in Step 5. Present results grouped by severity:

```
## Code Review Summary

### Critical Issues (X found)
- [file:line] Description (confidence: X)

### Important Issues (X found)
- [file:line] Description (confidence: X)

### Suggestions (X found)
- [file:line] Suggestion (confidence: X)

### Strengths
- What's well-done in this PR

### No Issues Found
"No issues found. Checked for bugs and AGENTS.md compliance."
```

### 7. Post Comments (Optional)

If `--comment` flag provided and issues found:
- Post inline comment using `gh api` or `gh pr comment`
- For small fixes: include code suggestion
- For large fixes: describe issue and suggested approach
- ONE comment per unique issue - no duplicates

## False Positive Filter

Do NOT flag:
- Pre-existing issues (not introduced in this PR)
- Pedantic nitpicks a senior engineer wouldn't flag
- Issues a linter will catch
- General code quality concerns (unless required by AGENTS.md)
- Issues explicitly silenced in code (lint ignore comments)
- Something that appears buggy but is actually correct

## Integration

- **Before commit:** `superpowers:commit-and-push` for fixes
- **Quick review:** `superpowers:requesting-code-review` for ad-hoc reviews
