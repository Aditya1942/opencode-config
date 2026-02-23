# Draft: Git Hooks Installation Plan

## Original Request
Install git hooks with strict failure behavior:
1. **pre-commit**: Validate configs, check symlinks
2. **commit-msg**: Enforce commit message format
3. **pre-push**: Additional checks before pushing

Repository: OpenCode.ai config repo (Bun/Node.js, config-only)

## Codebase Context

### Configuration Files Found
- `opencode.json` - Main config with `$schema` reference, contains agent/model/command config
- `mcp-servers.json` - MCP server configuration
- `package.json` - Node.js package file

### Symlinks Found
- `/Users/aditya/.config/opencode/skills/superpowers` (symlink)

### Current Hook State
- Only sample hooks exist in `.git/hooks/`
- No custom hooks currently installed

### Commit Message Pattern Analysis
Recent commits follow conventional commits format:
- `refactor(agents): update agent descriptions...`
- `chore: add local config support...`
- `chore(deps): upgrade @opencode-ai/plugin...`
- `feat(agents): implement 3-tier agent fleet...`
- `refactor: move update-superpowers command...`

Pattern: `type(scope): description` or `type: description`

## Clarifying Questions Needed

### 1. pre-commit Hook - Config Validation Rules
For each config file, what validation is required?

**opencode.json:**
- [ ] Validate JSON syntax?
- [ ] Verify `$schema` field exists?
- [ ] Validate against the schema?
- [ ] Check required fields exist?
- [ ] Other specific validations?

**mcp-servers.json:**
- [ ] Validate JSON syntax?
- [ ] What structure to validate?

**package.json:**
- [ ] Validate JSON syntax?
- [ ] Check dependencies are valid?
- [ ] Other validations?

### 2. pre-commit Hook - Symlink Checks
What checks should be performed on symlinks?
- [ ] Verify symlink target exists?
- [ ] Check specific symlinks are present?
- [ ] Validate symlink is not broken?
- [ ] Check only the `skills/superpowers` symlink?
- [ ] Other symlink validations?

### 3. commit-msg Hook - Message Format Enforcement
Based on observed patterns, should we enforce:
- [ ] Conventional commits format (`type(scope): description`)?
- [ ] Allow both `type:` and `type(scope):` formats?
- [ ] What types to allow? (feat, fix, chore, refactor, docs, test, style, etc.)
- [ ] Maximum message length?
- [ ] Minimum description length?
- [ ] Require scope for certain types?
- [ ] Enforce lowercase type?

**Proposed format (pending confirmation):**
```
^(feat|fix|chore|refactor|docs|test|style|ci|build|perf|revert)(\(.+\))?: .{10,}
```

### 4. pre-push Hook - Additional Checks
What additional checks should run before pushing?
- [ ] Check for secrets in staged files?
- [ ] Verify no ignored files accidentally staged?
- [ ] Check branch name follows conventions?
- [ ] Run `bun test` if tests exist?
- [ ] Other checks?

### 5. Hook Failure Behavior
User specified "strict failure behavior" - confirm:
- [ ] Hook exits with non-zero code to block operation?
- [ ] Display clear error messages?
- [ ] List all validation failures (not just first one)?
- [ ] Exit immediately on first failure?

## Tech Approach Decisions (Pending User Input)

### Hook Script Language
- [ ] Bash scripts (cross-platform Unix)
- [ ] Node.js scripts (consistent with repo runtime)
- [ ] Shell scripts using Node.js for validation

### Hook Storage Location
- [ ] Scripts in `.githooks/` directory (git-tracked)
- [ ] Scripts in `scripts/git-hooks/` directory
- [ ] Other location?

### Installation Method
- [ ] Manual symlink creation from repo to `.git/hooks/`
- [ ] Install script to automate symlinking
- [ ] Git `core.hooksPath` configuration
- [ ] Other method?

## Validation Strategy (Pending User Input)
Since this is a config-only repo with no build/test/lint:
- [ ] Test hooks manually by triggering them?
- [ ] Create test commit messages to verify commit-msg hook?
- [ ] Test with intentionally broken configs?
- [ ] Test with broken symlink?
- [ ] Other verification approach?

## Decisions Awaiting User Input
All validation rules and hook behaviors are pending clarification from user.
