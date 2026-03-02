# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for Start Relay Network - a TanStack Start adapter for React Relay with SSR streaming support. The project demonstrates integration between PostGraphile (GraphQL API), TanStack Start (React SSR framework), and React Relay.

## Architecture

### Monorepo Structure

Managed by **moonrepo** with **bun** as the package manager and runtime.

- `apps/api` - Standalone PostGraphile v5 GraphQL API (Express). Owns the Postgres Docker setup, migrations, and the exported `schema.graphql` that relay-compiler reads. The web app no longer calls it at runtime.
- `apps/web` - TanStack Start frontend application demonstrating Relay integration (with MDX docs under `/docs`). It embeds a PostGraphile handler at `/api/graphql` via a custom server entry (`src/server/entry.ts`), so it only needs Postgres, not the API app.
- `packages/start-relay-adapter` - Core library for TanStack Start + Relay SSR integration, published as `@litewarp/start-relay-network`

### Key Technologies

- **Runtime**: Bun (not Node.js) - use `bun` commands, not `npm`/`node`
- **API Layer**: PostGraphile v5 with grafserv and PostgreSQL
- **Frontend**: TanStack Start (React Router + SSR), React 19, Vite
- **GraphQL Client**: React Relay with SSR streaming support via start-relay-adapter
- **Testing**: Vitest (unit)
- **Code Quality**: oxlint + oxfmt (not ESLint/Prettier), TypeScript native preview for type checking

### start-relay-adapter Package

The core package (`packages/start-relay-adapter`) provides:

- **Environment**: `createRelayEnvironment()` builds the Relay environment, network, and query registry (`environment.ts`)
- **Network Layer**: Server and client fetch functions backed by per-query `ReplaySubject` records (`network/`, `cache/`)
- **Middleware**: Request/response middleware pipeline, `createMiddleware()` helper (`middleware/`)
- **Preloaders**: Server and client `preloadQuery` implementations (`preload/`)
- **Transport**: Streams GraphQL responses to the client and hydrates `PreloadedQuery` objects (`transport/`)
- **Router Integration**: `integrateRelayWithRouter()` / `setupRouterRelayIntegration()` wire the transport and serialization adapters into the TanStack router (`setup/`)
- **Response transforms**: Separate entry points `./transforms/incremental-delivery` and `./transforms/grafast-relay`

Key exports: `createRelayEnvironment`, `integrateRelayWithRouter`, `setupRouterRelayIntegration`, `createMiddleware`, `PreloadedQuery`, `RelayRouterContext`

The package augments `SerializableExtensions` on `@tanstack/router-core` (not `@tanstack/react-router`, which only re-exports it) so loaders returning a `PreloadedQuery` pass TanStack's serializability check. `@tanstack/router-core` is therefore a peer dependency.

### API Application Structure

PostGraphile v5 setup in `apps/api/src/index.ts`:

- Exposes GraphQL endpoint on port 4000
- Uses schema `app_public` from PostgreSQL (Star Wars sample data)
- GraphiQL IDE available at `/graphiql` when `GRAPHILE_ENV=development`
- Reads `CONNECTION_STRING` / `SUPERUSER_CONNECTION_STRING` from `apps/api/.env` (see `.env.example`; local Postgres runs on port 6432, database `starwars`)
- Bun auto-loads `.env`, so `GRAPHILE_ENV=development` also turns on watch mode and rewrites `apps/api/schema.graphql` on startup. Do not point a dev-mode API at a remote database.

Database management via Docker Compose (Docker Desktop must be running):

- `moon run api:db-up` - Start PostgreSQL container
- `moon run api:db-down` - Stop container
- `moon run api:reset` - Drop and recreate the `starwars` database from `apps/api/migrations/`

### Web App Structure

Located in `apps/web/`:

- **Routing**: TanStack Start with file-based routing (`src/routes/`)
- **Route Tree**: Auto-generated at `src/routeTree.gen.ts` (do not edit manually)
- **Router Setup**: `src/router.tsx` configures router with error boundaries and 404 handling
- **Styling**: Tailwind CSS v4 with HeroUI
- **Relay artifacts**: `src/__generated__/` is produced by `moon run web:relay` (relay-compiler) from `apps/api/schema.graphql`. Re-run it after changing queries or the schema.
- **Embedded GraphQL**: `src/server/entry.ts` intercepts `POST /api/graphql` and hands it to `src/server/graphile-handler.ts` (Grafast execute with inlined Relay response transforms and multipart streaming); everything else goes to the TanStack Start handler. The preset lives in `src/server/graphile.config.ts`. Import graphile presets by name (`import { PostGraphileAmberPreset } ...`); default imports arrive as a CommonJS namespace under Vite SSR. The Start plugin resolves `server.entry` relative to `srcDirectory`. The server-side Relay environment resolves `/api/graphql` against the incoming request URL with `getRequestUrl()`.

## Common Development Commands

### Running the Project

```bash
# Start all dev servers (API + web app)
bun dev

# Run API only (starts the Postgres container first)
moon run api:dev

# Run web app only
moon run web:dev
```

### Testing

```bash
# Run all unit tests (Vitest). Use `bun run test`, NOT `bun test`:
# `bun test` invokes Bun's built-in runner, which cannot resolve the `#@/` import alias.
bun run test
moon run start-relay-adapter:test

# Watch mode
moon run :test-watch

# With coverage
moon run :test-coverage
```

### Code Quality

```bash
# Type checking (uses TypeScript native preview)
bun typecheck

# Lint with oxlint
bun lint
moon run :lint-fix          # Auto-fix

# Format with oxfmt
bun format                  # Check only
moon run :format-write      # Auto-format
```

Generated files (`__generated__/`, `routeTree.gen.ts`, `schema.graphql`, changesets, changelogs) are excluded from formatting via `ignorePatterns` in `.oxfmtrc.json`.

### Building

```bash
# Build all packages
bun build

# Build specific project
moon run web:build
```

## Moon Task System

Moon manages tasks across the monorepo. Tasks are defined in:

- `.moon/tasks/node.yml` - Shared tasks for all Node.js/TypeScript projects
- Individual `moon.yml` files in each app/package

Common task patterns:

```bash
# Run task for all projects
moon run :task-name

# Run task for specific project
moon run <project-name>:task-name

# View all projects
moon query projects

# View task graph
moon query tasks
```

## Development Workflow

1. **Setup**: Run `proto use` to install toolchain (moon, bun), then `bun install`
2. **API Development**: Copy `apps/api/.env.example` to `.env`, then `moon run api:dev` (starts the Postgres container and the API). First time, run `moon run api:reset` to load the schema and seed data.
3. **Frontend Development**: Ensure Postgres is running (`moon run api:db-up`), copy `apps/web/.env.example` to `.env`, then `moon run web:dev`. The web server answers GraphQL itself at `/api/graphql`; the API app is only needed for GraphiQL or to regenerate `schema.graphql`.
4. **Tests**: Unit tests with Vitest (`bun run test`)
5. **CI**: `.github/workflows/ci.yml` runs format check, lint, typecheck, test, and build on pushes and PRs; `deploy.yml` runs Neon migrations and deploys to Vercel on pushes to `main`

## Toolchain Management

Uses **proto** for toolchain version management:

- Versions are defined in `.prototools`
- Run `proto use` to sync installed versions with project requirements

## Version Management

Uses **Changesets** for package versioning:

```bash
# After making changes, create a changeset
bun changeset

# Version packages (updates package.json + CHANGELOG)
bun changeset:version

# Publish to npm (if applicable)
bun changeset:publish
```

## Important Patterns

### File-Based Routing (TanStack Start)

Routes in `apps/web/src/routes/` map to URLs:

- `index.tsx` → `/`
- `film.$id.tsx` → `/film/:id` (dynamic segment; demonstrates `@defer`)
- `docs.tsx` + `docs/*.tsx` → `/docs/...` (MDX content from `src/content/`)
- `_pathlessLayout/...` → pathless layout routes
- `__root.tsx` → Root layout wrapping all routes

The `routeTree.gen.ts` file is auto-generated - never edit it directly.

### Relay Integration

The `start-relay-adapter` integrates Relay with TanStack Start:

1. Create the environment with `createRelayEnvironment({ url, responseTransforms, isServer })` (see `apps/web/src/lib/relay/environment.ts`)
2. Pass `environment` and `preloadQuery` into the router context and call `integrateRelayWithRouter({ router, environment })` (see `apps/web/src/router.tsx`)
3. In route loaders, call `context.preloadQuery(query, variables)` and return the `PreloadedQuery`; read it with `usePreloadedQuery` in the component
4. Customize requests with middleware via `createMiddleware()` rather than fetch options

### Test Files

Test files should be colocated with source:

- Unit tests: `*.test.ts` or `*.spec.ts`
- Test directories: `__tests__/` folders

## Configuration Files

- `.oxlintrc.json` - Linting rules (oxlint, not ESLint)
- `.oxfmtrc.json` - Formatting rules (oxfmt, not Prettier)
- `vitest.config.ts` - Vitest configuration at workspace root
- `.prototools` - Toolchain version pinning (proto). Note: `@moonrepo/cli` in `package.json` may be newer than the proto-pinned `moon`; CI uses the package version via `bun run moon`.
- `tsconfig.json` - TypeScript configuration per package
