---
description: Explore the codebase for a task and produce a concrete implementation plan, without editing anything.
argument-hint: <task description>
allowed-tools: Read, Glob, Grep, Bash
---

Explore the codebase for this task and produce a concrete implementation plan. Do not edit any files.

Task: $ARGUMENTS

This repo is TinyEnginy (`backend/` Express+Prisma+Temporal, `frontend/` React+Vite — see CLAUDE.md for architecture).

Rules:
- Read-only. Do not run Bash commands that mutate state (no installs, migrations, git commits, file writes). `git log`/`git diff`/`git status`/read-only greps are fine.
- Actually open and read the relevant files — don't guess from file names alone.
- Cross-check anything the task touches against the cross-cutting notes in CLAUDE.md (e.g. the four independent lead-field lists that must be kept in sync manually).

Output a plan with:
1. **Understanding** — what the task requires, in your own words, and any ambiguity found.
2. **Affected files** — concrete paths, with what changes in each and why.
3. **Order of operations** — sequence of changes (e.g. schema → migration → backend route → frontend type → component).
4. **Risks / edge cases** — anything that could break silently (manual-sync field lists, Temporal determinism constraints, etc.).
5. **Open questions** — anything that needs a decision from the user before implementing.

Do not start implementing. Present the plan and stop.
