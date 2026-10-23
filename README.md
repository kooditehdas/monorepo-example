# monorepo-example

A monorepo built with the [Kooditehdas factory](https://github.com/kooditehdas/factory): a Go HTTP API and a React client in one repository.

| Folder | What | Factory profile |
|---|---|---|
| [api/](api) | Go `net/http` JSON API: `GET /health`, `GET /version` | `go` |
| [web/](web) | React + TypeScript client (Vite) that shows the API's health and version | `node-ts` |

## Develop

```bash
cd api && go run ./cmd/server     # API on :8080
cd web && npm ci && npm run dev   # client on :5173, /api/* goes to the API
```

Checks: in `api/`, `golangci-lint run`, `go vet ./...`, `go test -race ./...`, `go build ./...`. In `web/`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and the Playwright tests with `npm run test:e2e` (run `npx playwright install chromium` once). CI runs each package as its own job (`api`, `web`).

## Working with the factory

The packages are listed in [factory.yaml](factory.yaml). The factory installs the Go version from `api/go.mod` and the Node version from `web/.nvmrc`, and the agent runs each package's checks with `factory-check <package> <check>`.

1. Open an issue with the **Feature** template.
2. A maintainer adds `ai-ready` (implement now) or `ai-plan` (plan first, then add `ai-approved`).
3. The factory opens a PR from an `ai/issue-<n>-…` branch, CI runs, and the AI reviewer comments once.
4. Ask for changes with a PR comment starting `@factory`, e.g. `@factory fix review findings 1 and 3`, or `@factory run the tests for web`. Ask for a fresh AI review with `@factory review`.
5. A human approves and merges.

Agent rules live in [AGENTS.md](AGENTS.md).
