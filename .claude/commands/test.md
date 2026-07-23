---
description: Run and/or write Vitest coverage for recently changed code, diagnosing any failures.
argument-hint: <what changed / what to cover, optional>
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

Run and/or write tests for recently implemented changes in this repo, and diagnose any failures.

Scope: $ARGUMENTS (if empty, infer from recent changes — `git status`/`git diff` — or ask what changed)

Both packages use Vitest (`pnpm test` in `backend/` or `frontend/`, `pnpm test:watch` for watch mode, `npx vitest run <path>` for a single file).

Your job:
1. Run the relevant test suite(s) for whatever changed (backend and/or frontend — they're independent, run both if both changed).
2. If tests fail, diagnose the root cause by reading the implementation, not just the test — figure out whether the test or the implementation is wrong before "fixing" either.
3. Write focused tests for changed/new behavior that isn't yet covered, colocated the way existing tests are (check for an existing `*.test.ts`/`*.test.tsx` next to the file you're covering, and follow its style/assertions conventions).
4. Don't chase unrelated pre-existing failures — note them, don't fix them, unless asked.

Rules:
- Don't weaken assertions or delete tests to make a suite pass — fix the underlying cause.
- Don't mock around Temporal/Prisma just to dodge a hard-to-test path unless that's already the existing pattern in the file.
- No test for behavior that can't happen — mirror the "no speculative validation" stance in CLAUDE.md.

Report back: what you ran, pass/fail state, what you added or changed and why, and any pre-existing failures you left alone.
