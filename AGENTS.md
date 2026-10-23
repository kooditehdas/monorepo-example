# Agent instructions

These rules apply to every AI agent working in this repository (implementer and reviewer alike) and to humans.

## Project

A small monorepo with two packages that are built and tested separately:

- `api/`: an HTTP JSON API in Go, using only the standard library (`net/http` with Go 1.22+ routing patterns).
  - `cmd/server/main.go` starts the server with timeouts and graceful shutdown. No business logic.
  - `internal/server/server.go` builds the handler: `New()` registers every route on one `http.ServeMux`. It never listens on a port, so tests use it directly.
  - One file per resource in `internal/server/` (for example `health.go`), registered in `New()` with a method pattern such as `"GET /health"`.
- `web/`: a React client in TypeScript, built with Vite.
  - `src/api.ts` is the only place that calls the API. It requests `/api/<path>`; the Vite dev server forwards that to the Go API at `localhost:8080` without the `/api` prefix (`vite.config.ts`).
  - `src/App.tsx` renders the page. Components are function components with hooks.
  - Tests live in `web/tests/` and use Vitest, jsdom and Testing Library, with `fetch` stubbed. They never call a real API.
  - End-to-end tests live in `web/e2e/` and use Playwright (Chromium) against the Vite dev server, with `/api/*` stubbed by `page.route`. They never call a real API either.

A change to an API response shape needs the matching change in `web/src/api.ts` and tests on both sides, in the same PR.

## Commands

Each package has its own toolchain and commands. Run them inside the package folder, or from anywhere with `factory-check <package> <check>` (the factory installs it for agents; for example `factory-check web test`).

| Purpose   | `api/`                | `web/`              |
| --------- | --------------------- | ------------------- |
| Install   | `go mod download`     | `npm ci`            |
| Format    | `gofmt -w .`          | `npm run format`    |
| Lint      | `golangci-lint run`   | `npm run lint`      |
| Vet / types | `go vet ./...`      | `npm run typecheck` |
| Test      | `go test -race ./...` | `npm test`          |
| Build     | `go build ./...`      | `npm run build`     |
| E2E       | —                     | `npm run test:e2e`  |

All checks of every package you changed must pass before work is considered done. The Node version is in `web/.nvmrc`; the Go version is in `api/go.mod`.

## Conventions

API (`api/`):
- Responses are JSON written with `writeJSON`. Errors use `errorBody{Error: "<message>"}` with a matching status code. Unknown paths and unsupported methods return the JSON 404 from `notFound`.
- Validate request input at the handler boundary: decode with `json.Decoder`, reject unknown or invalid fields with 400, and limit body size with `http.MaxBytesReader`.
- Return errors instead of panicking; wrap them with `fmt.Errorf("...: %w", err)` and compare with `errors.Is`/`errors.As`.
- Use `log/slog` for logging. Never log secrets or full request bodies.
- Tests: table-driven where there are several cases, `t.Helper()` in helpers, and both the success path and at least one failure path for every route.
- Standard library first. A new module dependency needs a clear reason stated in the PR.

Client (`web/`):
- TypeScript is strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); no `any`.
- Keep API types in `src/api.ts` next to the calls that use them. Handle loading and error states in the UI.
- Tests use Testing Library queries by role or text, not CSS selectors, and cover the error path of every API call.
- A change to what the page shows or how the user interacts with it updates the Playwright tests in `web/e2e/`. They use `getByRole`/`getByText` too.
- A new npm dependency needs a clear reason stated in the PR.

## Constraints

- Never commit secrets, tokens or real credentials. API configuration comes from environment variables documented in `api/.env.example`.
- Never weaken, skip or delete tests to make a check pass, and never silence linters (`//nolint`, `biome-ignore`) without an explaining comment.
- Do not change unrelated code, formatting or files.
- Do not edit `.github/`, `factory.yaml` or `.factory/` unless the task explicitly asks for it.

## Definition of done

1. The acceptance criteria in the issue are met.
2. Tests cover the change, in every package it touches.
3. The checks of every changed package pass locally.
4. The change is summarized with any remaining risks or follow-ups.
