# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for Start Relay Network - a TanStack Start adapter for React Relay with SSR streaming support. The project demonstrates integration between PostGraphile (GraphQL API), TanStack Start (React SSR framework), and React Relay.

## Architecture

### Monorepo Structure

Managed by **moonrepo** with **bun** as the package manager and runtime.

- `apps/api` - PostGraphile v5 GraphQL API with PostgreSQL backend
- `apps/example` - TanStack Start frontend application demonstrating Relay integration
- `apps/e2e-testing` - Playwright end-to-end tests
- `packages/start-relay-adapter` - Core library for TanStack Start + Relay SSR integration

### Key Technologies

- **Runtime**: Bun (not Node.js) - use `bun` commands, not `npm`/`node`
- **API Layer**: PostGraphile v5 with grafserv and PostgreSQL
- **Frontend**: TanStack Start (React Router + SSR), React 19, Vite
- **GraphQL Client**: React Relay with SSR streaming support via start-relay-adapter
- **Testing**: Vitest (unit), Playwright (e2e)
- **Code Quality**: oxlint + oxfmt (not ESLint/Prettier), TypeScript native preview for type checking

### start-relay-adapter Package

The core package (`packages/start-relay-adapter`) provides:

- **Query Cache**: Manages Relay query data across client/server boundaries (`query-cache.ts`)
- **Network Layer**: Creates Relay network with SSR support (`network.ts`, `network/`)
- **Preloaders**: Server and client-side data preloading (`create-preloader.ts`, `preload/`)
- **Transport**: Handles data serialization/hydration between server and client (`transport/`)
- **Router Integration**: `setupRouterRelayIntegration()` wires Relay into TanStack Start router

Key exports: `createClientPreloader`, `createServerPreloader`, `createQueryCache`, `createStartRelayNetwork`, `setupRouterRelayIntegration`

### API Application Structure

PostGraphile v5 setup in `apps/api/src/index.ts`:
- Exposes GraphQL endpoint on port 4000
- Uses schema `app_public` from PostgreSQL
- GraphiQL IDE available at `/graphiql`
- Requires PostgreSQL connection via `DATABASE_URL` env var (defaults to `postgres://postgres:postgres@localhost:5432/app`)

Database management via Docker Compose:
- `moon run api:db:up` - Start PostgreSQL container
- `moon run api:db:down` - Stop container
- `moon run api:db:reset` - Reset database (removes volumes)

### Example App Structure

Located in `apps/example/`:
- **Routing**: TanStack Start with file-based routing (`src/routes/`)
- **Route Tree**: Auto-generated at `src/routeTree.gen.ts` (do not edit manually)
- **Router Setup**: `src/router.tsx` configures router with error boundaries and 404 handling
- **Styling**: Tailwind CSS v4

## Common Development Commands

### Running the Project

```bash
# Start all dev servers (API + example app)
bun dev

# Run API only
moon run api:dev

# Run example app only
moon run example:dev
```

### Testing

```bash
# Run all unit tests (Vitest)
bun test

# Watch mode
moon run :test-watch

# With coverage
moon run :test-coverage

# Run Playwright e2e tests
moon run e2e-testing:test

# Playwright UI mode
moon run e2e-testing:test-ui

# Headed mode (see browser)
moon run e2e-testing:test-headed
```

### Code Quality

```bash
# Type checking (uses TypeScript native preview)
bun typecheck

# Lint with oxlint
bun lint
moon run :lint-fix          # Auto-fix

# Format with oxfmt
bun format
moon run :format-write      # Auto-format
```

### Building

```bash
# Build all packages
bun build

# Build specific project
moon run example:build
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
2. **API Development**: Start database with `moon run api:db:up`, then `moon run api:dev`
3. **Frontend Development**: Ensure API is running, then `moon run example:dev`
4. **Tests**: Unit tests with Vitest, e2e tests require both API and frontend running

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

Routes in `apps/example/src/routes/` map to URLs:
- `index.tsx` → `/`
- `users.tsx` → `/users`
- `users.index.tsx` → `/users` (index route)
- `posts.$postId.tsx` → `/posts/:postId` (dynamic segment)
- `posts_.$postId.deep.tsx` → `/posts/:postId/deep` (underscore = pathless layout)
- `__root.tsx` → Root layout wrapping all routes

The `routeTree.gen.ts` file is auto-generated - never edit it directly.

### Relay Integration

The `start-relay-adapter` integrates Relay with TanStack Start:
1. Create query cache with `createQueryCache()`
2. Create network with `createStartRelayNetwork()`
3. Setup router integration with `setupRouterRelayIntegration()`
4. Use `createServerPreloader()` for server-side data fetching
5. Use `createClientPreloader()` for client-side prefetching

### Test Files

Test files should be colocated with source:
- Unit tests: `*.test.ts` or `*.spec.ts`
- Test directories: `__tests__/` folders

## Configuration Files

- `.oxlintrc.json` - Linting rules (oxlint, not ESLint)
- `.oxfmtrc.json` - Formatting rules (oxfmt, not Prettier)
- `vitest.config.ts` - Vitest configuration at workspace root
- `.prototools` - Toolchain version pinning
- `tsconfig.json` - TypeScript configuration per package
