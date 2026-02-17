---
name: feature-dev
description: Use when implementing new features that touch multiple files, require architectural decisions, or have unclear requirements - provides a structured 7-phase workflow with specialized subagents for codebase exploration, architecture design, and quality review
---

# Feature Development Workflow

## Overview

A systematic 7-phase approach to building features. Instead of jumping into code, explore the codebase, ask questions, design architecture, then implement with quality review.

**Core principle:** Understand deeply, design deliberately, implement confidently.

**When to use:** New features touching multiple files, complex integrations, features with unclear requirements.
**When NOT to use:** Single-line fixes, trivial changes, urgent hotfixes.

## Checklist

Create a TodoWrite task for each phase and complete them in order:

1. Discovery - Understand what needs to be built
2. Codebase Exploration - Understand relevant existing code
3. Clarifying Questions - Fill gaps and resolve ambiguities
4. Architecture Design - Design multiple approaches
5. Implementation - Build the feature
6. Quality Review - Review for quality and correctness
7. Summary - Document what was accomplished

## Phase 1: Discovery

**Goal:** Understand what needs to be built.

1. If feature is unclear, ask the user:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
2. Summarize understanding and confirm with user

## Phase 2: Codebase Exploration

**Goal:** Understand relevant existing code and patterns at both high and low levels.

Launch 2-3 **explore** subagents in parallel. Each agent should:
- Trace through code comprehensively, focusing on abstractions, architecture, and flow of control
- Target a different aspect (similar features, high-level architecture, UI patterns)
- Return a list of 5-10 key files to read

**Example agent prompts:**
- "Find features similar to [feature] and trace through their implementation comprehensively"
- "Map the architecture and abstractions for [feature area], tracing through the code comprehensively"
- "Analyze the current implementation of [existing feature], tracing through the code comprehensively"

After agents return, **read all identified files** to build deep understanding. Present comprehensive summary.

### Code Explorer Agent Prompt Template

```
You are an expert code analyst specializing in tracing feature implementations.

Provide complete understanding of how a feature works by tracing from entry points to data storage through all abstraction layers.

Analysis approach:
1. Feature Discovery - Find entry points (APIs, UI components, CLI commands)
2. Code Flow Tracing - Follow call chains, trace data transformations, identify dependencies
3. Architecture Analysis - Map abstraction layers, identify design patterns, document interfaces
4. Implementation Details - Key algorithms, error handling, performance considerations

Output must include:
- Entry points with file:line references
- Step-by-step execution flow with data transformations
- Key components and responsibilities
- Architecture insights
- List of 5-10 essential files to read for deep understanding
```

## Phase 3: Clarifying Questions

**Goal:** Fill in gaps and resolve ALL ambiguities before designing.

**CRITICAL: Do NOT skip this phase.**

1. Review codebase findings and original feature request
2. Identify underspecified aspects: edge cases, error handling, integration points, scope boundaries, backward compatibility, performance needs
3. Present all questions in a clear, organized list using the Question tool
4. **Wait for answers before proceeding**

If user says "whatever you think is best", provide your recommendation and get explicit confirmation.

## Phase 4: Architecture Design

**Goal:** Design multiple implementation approaches with trade-offs.

Launch 2-3 **general** subagents in parallel with different focuses:
- **Minimal changes** - Smallest change, maximum reuse
- **Clean architecture** - Maintainability, elegant abstractions
- **Pragmatic balance** - Speed + quality

### Code Architect Agent Prompt Template

```
You are a senior software architect who delivers comprehensive, actionable architecture blueprints.

Process:
1. Codebase Pattern Analysis - Extract existing patterns, conventions, and decisions
2. Architecture Design - Design complete feature architecture with decisive choices
3. Complete Blueprint - Specify every file to create/modify, component responsibilities, data flow

Output must include:
- Patterns & conventions found (with file:line references)
- Architecture decision with rationale and trade-offs
- Component design (file paths, responsibilities, dependencies, interfaces)
- Implementation map with specific files to create/modify
- Data flow from entry points through transformations to outputs
- Build sequence as phased checklist
```

After reviewing all approaches:
1. Form opinion on which fits best
2. Present comparison with trade-offs
3. Include **your recommendation with reasoning**
4. Ask which approach user prefers

## Phase 5: Implementation

**Goal:** Build the feature.

**DO NOT START WITHOUT USER APPROVAL.**

1. Wait for explicit user approval
2. Read all relevant files identified in previous phases
3. Implement following chosen architecture
4. Follow codebase conventions strictly (check AGENTS.md / CLAUDE.md)
5. Write clean, well-documented code
6. Update todos as progress is made

## Phase 6: Quality Review

**Goal:** Ensure code is simple, DRY, elegant, and functionally correct.

Launch 3 **general** subagents in parallel with different review focuses:

1. **Simplicity/DRY/Elegance** - Code quality and maintainability
2. **Bugs/Correctness** - Functional correctness and logic errors
3. **Conventions/Abstractions** - Project standards and patterns

### Code Reviewer Agent Prompt Template

```
You are an expert code reviewer. Review code against project guidelines with high precision to minimize false positives.

Review scope: Unstaged changes from git diff (or specified files).

Core responsibilities:
- Project guidelines compliance (AGENTS.md / CLAUDE.md rules)
- Bug detection (logic errors, null handling, race conditions, security)
- Code quality (duplication, error handling, accessibility, test coverage)

Confidence scoring (0-100):
- 0-25: Likely false positive
- 50: Real but minor issue
- 75: Important, verified issue
- 100: Definite critical issue

Only report issues with confidence >= 80.

Output: For each issue provide description, confidence score, file:line, specific guideline or bug explanation, and concrete fix suggestion. Group by severity (Critical vs Important).
```

After consolidating findings:
1. Present findings to user
2. Ask what to do: fix now, fix later, or proceed as-is
3. Address issues based on user decision

## Phase 7: Summary

**Goal:** Document what was accomplished.

1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified
   - Suggested next steps

## Integration with Other Skills

- **Before feature-dev:** Use `superpowers:brainstorming` for creative/design-heavy features
- **After feature-dev:** Use `superpowers:commit-and-push` to commit the work
- **During Phase 6:** Consider `superpowers:requesting-code-review` for additional rigor

## Key Principles

- **Ask clarifying questions early** - Ambiguities resolved in Phase 3 prevent rework
- **Understand before acting** - Read code patterns before writing
- **Read agent-identified files** - Build deep context before proceeding
- **Simple and elegant** - Prioritize readable, maintainable code
- **Track with TodoWrite** - Update progress throughout all phases
