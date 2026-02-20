---
name: security-guidance
description: Use when editing files that may have security implications - warns about command injection, XSS, eval usage, dangerous HTML, pickle deserialization, os.system calls, and GitHub Actions workflow injection risks
---

# Security Guidance

## Overview

Security reminder system. Check these patterns when editing files that handle user input, execute commands, render HTML, or modify CI/CD workflows.

**Core principle:** Catch security issues at edit time, before they reach production.

## Quick Reference

| # | Pattern | Risk | Trigger | Safe Alternative |
|---|---------|------|---------|-----------------|
| 1 | `${{ github.event.* }}` in `run:` | CI injection | `.github/workflows/*.yml` | Use `env:` block, reference `$VAR` |
| 2 | `child_process.exec(cmd)` | Command injection | Shell commands with user input | `execFile(cmd, [args])` |
| 3 | `new Function(str)` | Code injection | Dynamic code evaluation | `JSON.parse()`, design patterns |
| 4 | `eval(str)` | Code injection | Dynamic code evaluation | `JSON.parse()`, design patterns |
| 5 | `dangerouslySetInnerHTML` | XSS | React HTML rendering | DOMPurify sanitization |
| 6 | `document.write()` | XSS | DOM manipulation | `createElement`, `appendChild` |
| 7 | `.innerHTML = x` | XSS | Setting HTML content | `textContent`, DOMPurify |
| 8 | `pickle.load(f)` | Code execution | Python deserialization | `json.load(f)`, `msgpack` |
| 9 | `os.system(cmd)` | Shell injection | Python command execution | `subprocess.run([...])` |

## GitHub Actions Detail

Most dangerous pattern — easy to miss:

**UNSAFE:** `run: echo "${{ github.event.issue.title }}"`
**SAFE:** Use env block: `env: TITLE: ${{ github.event.issue.title }}` then `run: echo "$TITLE"`

**Risky inputs:** `github.event.issue.body`, `github.event.pull_request.title/body`, `github.event.comment.body`, `github.event.commits.*.message`, `github.head_ref`

## When to Check

- Editing GitHub Actions workflows
- Code using `child_process`, `exec`, `eval`
- Setting innerHTML or dangerouslySetInnerHTML
- Working with pickle, os.system, document.write
- Any file handling user input

## Integration
- Pairs with: `superpowers:verification-before-completion`
- Related: `claudepowers:code-review` catches security issues in PRs
