# Technical Roadmap

This roadmap captures improvement ideas for the frontend and backend. The goal is to make the codebase easier to extend, easier to test, and safer to change as lead enrichment workflows and lead data fields continue to grow.

## Frontend

### Adopt TanStack Table for Lead Tables

The frontend already uses the TanStack ecosystem through TanStack Query. Adding TanStack Table would give the leads table a dedicated table model instead of keeping sorting, selection, column rendering, and row state directly inside the component.

Expected benefits:

- Centralized table configuration for columns, cells, and row selection.
- Easier support for future table features such as sorting, filtering, pagination, column visibility, and row-level actions.
- Cleaner separation between data fetching, table state, and rendering.
- A more scalable foundation as lead fields continue to expand.

Suggested next steps:

- Add `@tanstack/react-table`.
- Extract the current leads table from `LeadsList` into a dedicated table component.
- Define lead column metadata in one place so new fields can be added consistently.
- Preserve the current selection and bulk-action behavior during the migration.

### Expand Frontend Unit Test Coverage

The frontend already has useful tests around CSV parsing and email verification toast utilities. The next step is to cover the user-facing workflows that combine components, mutations, and API responses.

Suggested coverage:

- Lead table selection behavior, including select all, partial selection, and clearing selection after actions.
- CSV import modal behavior for valid files, invalid files, duplicate rows, and import summaries.
- Message template modal behavior, including field insertion and mutation outcomes.
- Email verification feedback, including success, partial failure, full failure, and network error states.
- API module behavior around request payloads and response mapping.

### Review Componentization and Shared Utilities

Some components currently own several responsibilities at once, especially where UI state, mutation state, formatting, and rendering live together. A componentization pass should reduce duplication and make future features easier to add.

Suggested focus areas:

- Split large workflow components into smaller units with clear ownership.
- Extract repeated modal behavior such as backdrop click handling, escape key handling, and portal rendering.
- Extract table-specific UI primitives once TanStack Table is introduced.
- Keep formatting helpers, field metadata, and lead display rules in shared utilities where reuse is expected.
- Use tooling such as Fallow, or a similar duplication and dead-code analysis tool, to identify repeated logic and unnecessary code paths before refactoring.

## Backend

### Move Endpoints into Discoverable Route Modules

The backend currently keeps Express setup, route registration, validation, business logic, Temporal client creation, and server startup in `backend/src/index.ts`. Splitting endpoints into smaller modules would improve discoverability and make each route easier to reason about.

Suggested structure:

```text
backend/src/
  app.ts
  index.ts
  routes/
    leads.routes.ts
  handlers/
    leads/
      createLead.ts
      getLead.ts
      getLeads.ts
      updateLead.ts
      deleteLead.ts
      deleteLeads.ts
      bulkImportLeads.ts
      generateMessages.ts
      verifyEmails.ts
  services/
    leads/
    temporal/
```

Expected benefits:

- Faster navigation from endpoint to implementation.
- Smaller files with clearer ownership.
- Easier handler-level tests without needing to boot the HTTP server.
- Cleaner separation between transport concerns, validation, persistence, and workflow orchestration.

### Create Testable Handlers

Handlers should contain the functional behavior for each endpoint and receive dependencies explicitly, such as Prisma services or Temporal workflow services. Express routes can then stay thin and focus on request and response wiring.

Suggested next steps:

- Define handler functions for each endpoint.
- Pass dependencies into handlers instead of importing long-lived infrastructure directly where practical.
- Normalize validation and error responses.
- Add tests around handlers using mocked dependencies.

### Expand Backend Unit and Temporal Test Coverage

The backend has a test for message generation, but the highest-risk behavior now lives in route workflows, bulk import, and Temporal orchestration.

Suggested coverage:

- Lead creation, update, deletion, and bulk deletion behavior.
- Bulk import validation, duplicate handling, trimming, and partial failure reporting.
- Message generation endpoint behavior for missing leads, invalid templates, partial failures, and persistence errors.
- Email verification behavior for success, failed activities, timeouts, and partial batch outcomes.
- Temporal workflow tests for activity retries, timeout behavior, idempotent workflow IDs, and early completion rules.

### Reuse Temporal Client and Connection

The email verification endpoint currently opens a Temporal connection and creates a client inside the request handler. That adds per-request overhead and makes connection lifecycle harder to manage.

Suggested next steps:

- Create a Temporal client factory or service under `backend/src/services/temporal`.
- Initialize and reuse a shared `Connection` and `Client` for the application lifecycle.
- Close the connection during graceful shutdown instead of after each request.
- Make Temporal namespace, task queue, and address configurable through environment variables.
- Use deterministic workflow IDs where idempotency is required, rather than including `Date.now()` in the workflow ID.

Expected benefits:

- Lower request latency and less connection churn.
- More reliable Temporal usage under concurrent requests.
- Easier tests because workflow execution can be mocked behind a service interface.
- Better alignment with future workflows such as phone enrichment.

## Cross-Cutting Priorities

### Improve Configuration Boundaries

Move hardcoded infrastructure settings, such as Temporal address, namespace, task queue, API base URLs, and server port, into validated configuration. This will make local development, testing, and deployment easier to reason about.

### Standardize Error Handling

Introduce a consistent error response shape across backend endpoints. The frontend can then show better user-facing feedback without relying on raw thrown error messages.

### Keep Feature Growth Data-Driven

Lead fields are likely to continue growing. Shared field metadata should drive CSV parsing, table columns, message-template fields, API types, and backend persistence mapping where possible. This avoids updating the same concept in several places for every new lead field.

## Proposed Order

1. Extract backend app, routes, handlers, and services without changing behavior.
2. Add focused backend handler tests around existing behavior.
3. Introduce a reusable Temporal service and deterministic workflow IDs where appropriate.
4. Add Temporal-focused tests for verification and future enrichment workflows.
5. Add TanStack Table and extract the leads table.
6. Expand frontend component and workflow tests.
7. Run a componentization and utility cleanup pass using duplication/dead-code tooling to guide the work.

## Open Discussion Points

- Should the roadmap file be renamed to `IMPROVEMENTS.md` to match the take-home brief, or should `roadmap.md` remain the canonical document?
- Should backend route modules be organized by resource, by use case, or by workflow boundary?
- How far should the first TanStack Table migration go: table rendering only, or also sorting/filtering/pagination?
- Which test layer should be prioritized first for Temporal: pure workflow tests, handler tests with mocked workflow execution, or end-to-end local Temporal tests?
