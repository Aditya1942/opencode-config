---
name: code-review
description: Use when reviewing a pull request for bugs, CLAUDE.md/AGENTS.md compliance, and code quality - launches multiple parallel review agents with confidence-based scoring to filter false positives, optionally posts inline PR comments
---

# Automated PR Code Review

## Overview

Comprehensive pull request review using multiple specialized subagents running in parallel. Each agent independently reviews changes, then results are validated and filtered to produce high-signal feedback only.

**Core principle:** Multiple independent reviewers with confidence-based filtering produce better results than a single pass.

## When to Use

- Before merging any PR
- After receiving a PR for review
- When running `/code-review` on a PR URL
- Automated review in CI/CD pipelines

## Checklist

Create TodoWrite tasks for each step:

1. Pre-flight checks (PR status, draft, already reviewed)
2. Gather AGENTS.md/CLAUDE.md guidelines
3. Get PR summary
4. Launch parallel review agents
5. Validate findings
6. Filter and present results
7. Optionally post comments

## Step 1: Pre-Flight Checks

Launch an explore subagent to verify:
- PR is not closed or draft
- PR has not already been reviewed by Claude (check `gh pr view <PR> --comments`)
- PR is not trivially correct (automated/generated)

If any condition fails, stop and explain why.

## Step 2: Gather Guidelines

Launch an explore subagent to find:
- Root AGENTS.md or CLAUDE.md file
- Any AGENTS.md/CLAUDE.md files in directories containing modified files
- Project-specific coding standards

## Step 3: PR Summary

Launch an explore subagent to:
- View the PR diff with `gh pr diff <PR>`
- Return a structured summary of changes

## Step 4: Launch Parallel Review Agents

Launch 4 subagents in parallel:

### Agent 1 & 2: Guidelines Compliance (explore subagents)
Audit changes for AGENTS.md/CLAUDE.md compliance. Split the files between two agents for coverage.

### Agent 3: Bug Detection (general subagent)
Scan for obvious bugs in the diff. Focus only on the diff itself. Flag only significant bugs. Do NOT flag:
- Pre-existing issues
- Linter-catchable issues
- Style concerns
- Potential issues depending on specific inputs

### Agent 4: Security & Logic Review (general subagent)
Look for problems in introduced code: security issues, incorrect logic. Only issues within changed code.

**CRITICAL: HIGH SIGNAL ONLY.** Flag issues where:
- Code will fail to compile/parse (syntax errors, type errors, missing imports)
- Code will definitely produce wrong results (clear logic errors)
- Clear, unambiguous guideline violations (quote the exact rule)

Do NOT flag: style concerns, potential issues, subjective suggestions.

### Agent Prompt Template

```
Review this PR for [specific focus].

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

## Step 5: Validate Findings

For each issue from Steps 3-4, launch a validation subagent:
- Provide PR context + issue description
- Agent validates: Is this truly an issue with high confidence?
- For bugs: Verify the variable/function actually behaves as claimed
- For guideline violations: Verify the rule is actually violated and scoped correctly

Use **general** subagents for bug validation, **explore** for guideline validation.

## Step 6: Filter and Present

Filter out any issues not validated in Step 5. Present summary:

```
## Code Review Summary

### Critical Issues (must fix)
- [file:line] Description (confidence: X)

### Important Issues (should fix)
- [file:line] Description (confidence: X)

### No Issues Found
"No issues found. Checked for bugs and AGENTS.md compliance."
```

## Step 7: Post Comments (Optional)

If `--comment` flag provided and issues found:
1. For each issue, post inline comment using `gh api` or `gh pr comment`
2. For small fixes: include a code suggestion
3. For large fixes: describe the issue and suggested approach
4. ONE comment per unique issue - no duplicates

If no issues found:
```
## Code review
No issues found. Checked for bugs and AGENTS.md compliance.
```

## False Positive Checklist

Do NOT flag:
- Pre-existing issues (not introduced in this PR)
- Pedantic nitpicks a senior engineer wouldn't flag
- Issues a linter will catch
- General code quality concerns (unless required by AGENTS.md)
- Issues explicitly silenced in code (lint ignore comments)
- Something that appears buggy but is actually correct

## Integration

- **Before PR:** Use `claudepowers:pr-review-toolkit` for comprehensive multi-aspect review
- **After review:** Use `superpowers:commit-and-push` for any fixes
- **Quick review:** Use `superpowers:requesting-code-review` for ad-hoc reviews during development
