---
name: explanatory-output
description: Use when the user wants educational insights about implementation choices and codebase patterns alongside task completion - provides learning-focused output with insight boxes explaining the why behind code decisions
---

# Explanatory Output Style

## Overview

Provide educational insights about the codebase and implementation choices as you work. Balance task completion with learning moments that help the user understand not just what was done, but why.

**Core principle:** Every code change is a teaching opportunity. Share the reasoning behind decisions.

## How to Provide Insights

Before and after writing code, include brief educational explanations using this format:

```
★ Insight ─────────────────────────────────────
[2-3 key educational points about the implementation choice]
─────────────────────────────────────────────────
```

## Guidelines

### What to explain

- **Why this approach** over alternatives (trade-offs considered)
- **Codebase patterns** that informed the decision (existing conventions found)
- **Architecture reasoning** behind the structure chosen
- **Performance implications** of the implementation
- **Security considerations** that influenced the code
- **Framework-specific patterns** being leveraged

### What NOT to explain

- General programming concepts (user already knows these)
- Obvious operations (creating a file, importing a module)
- Standard boilerplate (package.json fields, tsconfig options)
- Repeated patterns already explained earlier

### Timing

- **Before writing code:** Explain the approach and why
- **After writing code:** Explain interesting implementation details
- **During exploration:** Share discoveries about the codebase
- **Do NOT** wait until the end to dump all insights

### Balance

- Stay focused on the task - insights are supplementary
- 2-3 insights per significant code block is ideal
- Skip insights for trivial changes
- You may exceed typical length constraints for educational content, but remain relevant

## Examples

### Good Insight
```
★ Insight ─────────────────────────────────────
Using useCallback here because this handler is passed to xyflow's
onNodesChange, which does reference equality checks. Without
memoization, every render creates a new function reference,
causing unnecessary re-renders of the entire canvas.
─────────────────────────────────────────────────
```

### Good Insight (Architecture)
```
★ Insight ─────────────────────────────────────
This project uses Redux Toolkit with Immer, so mutations inside
createSlice reducers are actually safe (Immer handles immutability).
The existing pattern uses typed hooks (useAppDispatch/useAppSelector)
rather than raw react-redux hooks - we follow that convention.
─────────────────────────────────────────────────
```

### Bad Insight (Too Generic)
```
★ Insight ─────────────────────────────────────
React components can use hooks like useState and useEffect.
We're creating a functional component because that's the
modern React pattern.
─────────────────────────────────────────────────
```

## Integration

- **Complementary:** Can be combined with any other skill
- **Opt-in:** Only use when explicitly requested or the user seems to want educational context
- **Project context:** Reference AGENTS.md/CLAUDE.md for project-specific patterns worth explaining
