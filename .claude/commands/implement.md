---
description: Implement a task from a given (or already-discussed) plan, running builds/typecheck and the existing test suite as you go.
argument-hint: <plan or task description>
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, NotebookEdit
---

Implement the following, following the plan already established in this conversation (e.g. from `/explore-plan`) if there is one. If no plan exists yet and the task is non-trivial, say so and propose exploring first rather than improvising a design.

Task/plan: $ARGUMENTS

This repo is TinyEnginy (see CLAUDE.md for architecture: `backend/` Express+Prisma+Temporal, `frontend/` React+Vite, no shared workspace root).

Rules:
- Make the smallest change that satisfies the plan. No unrelated refactors, no speculative abstractions, no comments beyond what's needed to explain non-obvious WHY.
- Respect the manual-sync points called out in CLAUDE.md (Prisma schema / backend bulk-import allowlist / frontend CsvParser+CsvLead / messageGenerator's availableFields) whenever a lead field changes.
- After editing, run the relevant build/typecheck for whichever package(s) you touched (`pnpm build` in backend and/or frontend), then run the existing unit test suite (`pnpm test`) for those package(s) — it's cheap and catches regressions early. Fix failures you caused. Don't write new test coverage — that's `/test`.
- If you hit a fork in the plan (an ambiguity, a missing step, a file that doesn't match what the plan assumed), stop and report it rather than silently deciding.

Report back: what you changed (files + one-line purpose each), what you ran to verify it compiles and passes existing tests, and anything the plan didn't cover that you had to decide on your own.
