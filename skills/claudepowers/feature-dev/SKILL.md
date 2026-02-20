---
name: feature-dev
description: Use when implementing new features that touch multiple files, require architectural decisions, or have unclear requirements - provides a structured 7-phase workflow with specialized subagents for codebase exploration, architecture design, and quality review
---

# Feature Development Workflow

## Overview
Systematic 7-phase approach for complex features. Chains existing skills rather than implementing from scratch.

**When to use:** New features touching multiple files, complex integrations, unclear requirements.
**When NOT to use:** Single-file fixes, trivial changes, urgent hotfixes.

## Phases

| # | Phase | Skill to Use | Key Action |
|---|-------|-------------|------------|
| 1 | Discovery | `superpowers:brainstorming` | Understand what needs building |
| 2 | Codebase Exploration | Launch 2-3 `explore` subagents | Map relevant files, patterns, architecture |
| 3 | Clarifying Questions | (manual) | Resolve ALL ambiguities before designing |
| 4 | Architecture Design | Launch 2-3 `general` subagents | Compare minimal/clean/pragmatic approaches |
| 5 | Implementation | `superpowers:executing-plans` or `superpowers:subagent-driven-development` | Build following chosen architecture |
| 6 | Quality Review | `claudepowers:code-review` | Review with parallel agents |
| 7 | Summary | (manual) | Document what was accomplished |

## Phase 2: Codebase Exploration (unique to this skill)

Launch 2-3 explore subagents in parallel targeting different aspects:
- Similar features and their implementation patterns
- High-level architecture of the feature area
- Current implementation of related functionality

Each agent returns 5-10 key files. Read ALL identified files before proceeding.

## Phase 4: Architecture Design (unique to this skill)

Launch 2-3 general subagents with different design focuses:
- **Minimal changes** — smallest change, maximum reuse
- **Clean architecture** — maintainability, elegant abstractions
- **Pragmatic balance** — speed + quality

Present comparison with trade-offs and your recommendation. Wait for user choice.

## Key Principles
- Ask clarifying questions early — ambiguities in Phase 3 prevent rework
- Read agent-identified files — build deep context before proceeding
- DO NOT start Phase 5 without user approval
- Track progress with TodoWrite throughout all phases
