---
name: security-guidance
description: Use when editing files that may have security implications - warns about command injection, XSS, eval usage, dangerous HTML, pickle deserialization, os.system calls, and GitHub Actions workflow injection risks
---

# Security Guidance

## Overview

Security reminder system that warns about potential vulnerabilities when editing files. Provides pattern-based detection of common security anti-patterns across multiple languages and frameworks.

**Core principle:** Catch security issues at edit time, before they reach production.

## When to Invoke

Automatically check for security patterns when:
- Editing GitHub Actions workflow files (.yml/.yaml in .github/workflows/)
- Writing code that uses child_process, exec, eval, or similar
- Setting innerHTML or using dangerouslySetInnerHTML
- Working with pickle, os.system, or document.write
- Any file edit involving user input handling

## Security Patterns

### 1. GitHub Actions Workflow Injection

**Trigger:** Editing `.github/workflows/*.yml` or `.yaml`

**Risk:** Command injection via untrusted input (issue titles, PR descriptions, commit messages) used directly in `run:` commands.

**UNSAFE:**
```yaml
run: echo "${{ github.event.issue.title }}"
```

**SAFE:**
```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: echo "$TITLE"
```

**Risky inputs to watch for:**
- `github.event.issue.body`, `github.event.pull_request.title/body`
- `github.event.comment.body`, `github.event.review.body`
- `github.event.commits.*.message`, `github.event.head_commit.message`
- `github.event.pull_request.head.ref/label`
- `github.head_ref`

**Reference:** https://github.blog/security/vulnerability-research/how-to-catch-github-actions-workflow-injections-before-attackers-do/

### 2. Command Injection (child_process.exec)

**Trigger:** Code containing `child_process.exec`, `exec(`, `execSync(`

**Risk:** Shell injection when user input is interpolated into commands.

**UNSAFE:**
```javascript
exec(`command ${userInput}`)
```

**SAFE:**
```javascript
import { execFile } from 'child_process';
execFile('command', [userInput]);
// Or use execFileSync for synchronous
```

Use `execFile`/`execFileSync` instead of `exec` - prevents shell injection by not using a shell.

### 3. new Function() Injection

**Trigger:** Code containing `new Function`

**Risk:** Code injection via dynamic string evaluation. Consider alternative approaches that don't evaluate arbitrary code.

### 4. eval() Injection

**Trigger:** Code containing `eval(`

**Risk:** Executes arbitrary code. Major security risk.

**Alternatives:**
- `JSON.parse()` for data parsing
- Design patterns that don't require code evaluation
- Template literals for string construction

### 5. React dangerouslySetInnerHTML

**Trigger:** Code containing `dangerouslySetInnerHTML`

**Risk:** XSS vulnerabilities if used with untrusted content.

**Mitigation:** Sanitize all content with DOMPurify or similar HTML sanitizer library before rendering.

### 6. document.write() XSS

**Trigger:** Code containing `document.write`

**Risk:** XSS attacks and performance issues.

**Alternative:** Use DOM manipulation methods: `createElement()`, `appendChild()`, `textContent`.

### 7. innerHTML XSS

**Trigger:** Code containing `.innerHTML =` or `.innerHTML=`

**Risk:** XSS when setting innerHTML with untrusted content.

**Alternatives:**
- `textContent` for plain text
- Safe DOM methods for HTML content
- DOMPurify for sanitizing HTML

### 8. Pickle Deserialization (Python)

**Trigger:** Code containing `pickle`

**Risk:** Arbitrary code execution when deserializing untrusted data.

**Alternatives:**
- `json` for structured data
- `msgpack` for binary serialization
- Only use pickle with trusted data sources

### 9. os.system() Injection (Python)

**Trigger:** Code containing `os.system` or `from os import system`

**Risk:** Shell injection with user-controlled arguments.

**Alternative:**
```python
import subprocess
subprocess.run(['command', argument], check=True)
# Never: os.system(f'command {user_input}')
```

## How to Use This Skill

When editing files, mentally check against these patterns:

1. **Before writing shell commands:** Am I using execFile or exec? Is any user input interpolated?
2. **Before setting HTML:** Am I using innerHTML/dangerouslySetInnerHTML? Is the content sanitized?
3. **Before evaluating code:** Am I using eval/new Function? Is there an alternative?
4. **Before serializing:** Am I using pickle with untrusted data?
5. **Before CI/CD changes:** Am I using GitHub event data directly in run commands?

## Quick Reference

| Pattern | Risk | Safe Alternative |
|---------|------|-----------------|
| `exec(cmd)` | Command injection | `execFile(cmd, args)` |
| `eval(str)` | Code injection | `JSON.parse()`, design patterns |
| `new Function(str)` | Code injection | Alternative approaches |
| `innerHTML = x` | XSS | `textContent`, DOMPurify |
| `dangerouslySetInnerHTML` | XSS | DOMPurify sanitization |
| `document.write()` | XSS | `createElement`, `appendChild` |
| `pickle.load(f)` | Code execution | `json.load(f)` |
| `os.system(cmd)` | Shell injection | `subprocess.run([...])` |
| `${{ github.event.* }}` in run | CI injection | Use `env:` block |

## Integration

- **Pairs with:** `superpowers:verification-before-completion` - verify security before shipping
- **Related:** `claudepowers:code-review` - automated review catches security issues in PRs
