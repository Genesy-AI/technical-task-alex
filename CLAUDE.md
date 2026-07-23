# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TinyEnginy — a lead management app (CRM-lite): import leads via CSV, list/edit/delete them, verify their emails, and generate outreach messages from templates. Two independent packages: `backend/` (Express + Prisma + Temporal) and `frontend/` (React + Vite). No shared package/workspace root — each has its own `package.json`, lockfile, and `.nvmrc` (Node v22).

## Commands

Run from within `backend/` or `frontend/` respectively (there is no root-level script runner).

**Backend** (`backend/`)
```
pnpm install              # install deps
pnpm migrate:dev          # apply Prisma migrations to local SQLite (backend/prisma/dev.db)
pnpm gen:prisma           # regenerate Prisma client (needed after schema.prisma changes)
pnpm run dev              # start API server (nodemon, src/index.ts) on port 4000
pnpm build                # tsc -p .
pnpm test                 # vitest (single run)
pnpm test:watch           # vitest watch mode
npx vitest run src/utils/messageGenerator.test.ts   # run a single test file
pnpm format                # prettier --write .
```
Requires a local Temporal dev server (`temporal server start-dev`) running on `localhost:7233` — both the Express process (as a Temporal client) and the worker (`src/worker.ts`, started inline from `src/index.ts` via `runTemporalWorker()`) connect to it. Without Temporal running, `/leads/verify-emails` will fail to connect.

**Frontend** (`frontend/`)
```
pnpm install
pnpm run dev               # Vite dev server
pnpm build                 # tsc -b && vite build
pnpm lint                  # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
pnpm test                  # vitest (single run)
pnpm test:watch
npx vitest run src/utils/csvParser.test.ts   # run a single test file
pnpm format
```
Frontend talks to the backend at a fixed base URL configured in `src/utils/axios.ts` (backend runs on port 4000) — no env var indirection.

## Architecture

### Backend (`backend/src`)

- `index.ts` — the entire HTTP API lives in this one file as inline Express route handlers (no controller/service layering). All routes are under `/leads`: CRUD, `/leads/bulk` (CSV import), `/leads/generate-messages` (template → message, synchronous), `/leads/verify-emails` (kicks off a Temporal workflow per lead, synchronously awaited in a loop — not fire-and-forget).
- `worker.ts` — boots the Temporal `Worker`, pointing at `workflowsPath: ./workflows` and `activities: ./workflows/activities`. Started as a side effect of importing `index.ts` (`runTemporalWorker()` call at the bottom), so the API server and the Temporal worker run in the same Node process.
- `workflows/workflows.ts` — Temporal workflow definitions. Activities are proxied via `proxyActivities<typeof activities>({ startToCloseTimeout: ... })`; workflows must only call activities/Temporal APIs, never Node APIs or Prisma directly (standard Temporal determinism constraint).
- `workflows/activities/` — activity implementations (the actual side-effecting code, e.g. `verifyEmail` in `utils.ts`). This is where new provider-calling activities for future workflows (e.g. phone enrichment) should go, following the existing `proxyActivities` + activity-function pattern.
- `prisma/schema.prisma` — single `lead` model (SQLite). Run `pnpm migrate:dev` after editing, then `pnpm gen:prisma`.
- Task queue name is `myQueue`, namespace `default`, both hardcoded in `index.ts` and `worker.ts`.

### Frontend (`frontend/src`)

- `api/` — hand-rolled typed API client, not generated. `api/utils.ts` defines `endpoint(method, path)` (path can be a string or a function of the input for dynamic routes like `/leads/${id}`), which wraps `axiosInstance`. `api/modules/leads.ts` composes the `leadsApi` object from `endpoint()` calls; per-endpoint request/response types live under `api/types/leads/*.ts`. To add a new backend route, add a type file, wire it into `modules/leads.ts`, and it becomes available as `api.leads.<name>`.
- `api/mutations/useApiMutation.ts` — a generic wrapper over TanStack Query's `useMutation` that looks up shared mutation options (optimistic update / cache invalidation logic) by dotted path (e.g. `useApiMutation('leads.create')`) from the `apiMutationsOptions` map in the same file. Only `leads.create` currently has custom optimistic-update logic (see `onMutate`/`onError`/`onSettled` there); other mutations are called directly via `useMutation({ mutationFn: api.leads.X })` in components without going through this wrapper. When adding optimistic behavior for a new endpoint, extend `apiMutationsOptions`, keeping the TanStack Query cache key convention `['leads', 'getMany']`.
- `components/` — flat, no subfolders: `LeadsList.tsx` (main table + selection + actions), `CsvImportModal.tsx` (drag-drop/file-picker import preview + bulk import), `MessageTemplateModal.tsx` (template-based message composition for selected leads).
- `utils/csvParser.ts` — CSV parsing/validation (via PapaParse) is done client-side before hitting `/leads/bulk`; header matching is case-insensitive and strips non-letters (`normalizedHeader`), so new CSV-importable fields must be added both here and in the corresponding backend field allowlist in `index.ts`'s `/leads/bulk` handler.
- Styling is Tailwind v4 (via `@tailwindcss/vite`), utility classes inline in JSX — no separate component styling files or CSS modules.

### Cross-cutting notes

- The three field lists (Prisma schema, backend bulk-import allowlist, frontend `CsvParser`/`CsvLead` interface, and `messageGenerator.ts`'s `availableFields`) are independent and must be kept in sync manually when adding a lead field — there's no single source of truth.
- `docs/` contains sample CSVs (`leads-ok-*.csv`, `leads-with-errors.csv`, `leads-ok-missing fields.csv`) used for manually testing the import flow, plus `ui-wireframes.png`/`.excalidraw` for the message-composition UX.
- No shared Zod/schema validation layer — request validation in `index.ts` is manual (`typeof`/`Array.isArray` checks per route).
