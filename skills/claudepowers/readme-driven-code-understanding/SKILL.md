---
name: readme-driven-code-understanding
description: Use when exploring or modifying models, classes, modules, or utility code that has README.md documentation at package/submodule level - read the nearest relevant README.md files before diving into code, use them to map behavior and flow, and update impacted README.md files after code changes with concise behavior-focused notes (no code snippets).
---

# README-Driven Code Understanding

## Overview
Use README files as the first-pass map for understanding code structure, responsibilities, and flow.

Goal:
- Reduce token usage and repeated code summarization.
- Start from high-signal docs, then read only the code required.
- Keep docs synchronized after changes.

## When to Use
Use this skill when the task involves any of the following:
- Understanding a specific model/class/module.
- Tracing behavior across submodules or utility classes.
- Making code changes in areas that already maintain README.md documentation.
- Summarizing architecture or behavior without loading unnecessary code.

## Checklist
1. Identify scope: target model/class/module and nearby package boundaries.
2. Locate README chain:
- Start at the closest directory README.md.
- Walk upward to parent package README.md if needed.
- Include child/submodule README.md files only when the task touches them.
3. Read README files first and extract:
- Purpose and responsibilities.
- Flow/order of operations.
- Public entry points (file paths, class names, method names).
- Known constraints or conventions.
4. Validate unclear or suspicious points against source code.
5. Perform the requested analysis or implementation with minimal additional file reads.
6. If code changed, update impacted README.md files before finishing (mandatory).
7. Verify README updates are concise, accurate, snippet-free, and aligned with latest code.

## Details

### README-first exploration protocol
- Prefer README.md as navigation and context bootstrap.
- Treat README as guidance, not absolute truth.
- If README conflicts with code, trust code and fix README.
- Only open code files needed to resolve uncertainty or implement changes.

### README scope selection
- Choose the minimal set of README files that fully covers the task.
- Typical order:
1. Nearest folder README.md
2. Parent package README.md
3. Specific submodule README.md (only when touched)

### README update rules after changes
When implementation changes behavior, structure, or flow, update docs in the same turn. This is mandatory.

Keep updates short and high-signal:
- Describe what the class/module does and why it exists.
- Describe data/control flow in plain language.
- Reference code with file paths and method/function names.
- Prefer bullets and small sections.

Do not include:
- Code snippets.
- Long API dumps.
- Repetition of obvious implementation details.

### Recommended README content pattern
Use this compact structure where applicable:
- Purpose
- Responsibilities
- Flow
- Key entry points (path + symbol names)
- Dependencies/relationships
- Related READMEs (links/pointers to parent, child, or peer module READMEs)
- Change notes (only meaningful behavior updates)

### Parent/child and interdependency pointer rules
- Allow README.md files to reference other README.md files for related modules.
- In parent README.md files, keep child internals minimal; add pointers to child README.md files instead of duplicating details.
- In child README.md files, include a pointer back to the parent README.md when relevant.
- For cross-module dependencies, add short pointers to peer README.md files in `Related READMEs`.
- Keep pointers path-based and concise.

### Completion gate
Before marking work complete, confirm:
- Relevant README.md files were read for context.
- Changed code paths have matching README updates.
- README statements match actual behavior.
- No code snippets were added to README.
- README reflects latest code for the touched scope (parent/child/peer links included if applicable).

## Anti-patterns
- Reading many source files first and checking README later.
- Treating README as always correct without verification.
- Updating code but leaving README stale.
- Writing verbose documentation that duplicates code.
- Adding code snippets to README when path/symbol references are enough.
