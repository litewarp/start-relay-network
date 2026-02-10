# @start-relay-network/adapter

Custom integration enabling SSR streaming of Relay queries within TanStack
Start. Supports `@defer` and `@stream` directives with progressive hydration.

## How It Works

1. Route loader calls `context.preloadQuery(query, vars)`
2. Server starts GraphQL fetch, captures responses in a ReplaySubject
3. PreloadedQuery metadata sent to client immediately
4. GraphQL responses stream to client via custom transport
5. Client hydrates with ReplaySubject -- no duplicate fetches

## Exports

- `.` -- all public APIs (`src/index.tsx`)

## Key Files

- `src/router-with-relay.tsx` -- router wrapper
- `src/preloaded-query.ts` -- query preloading
- `src/transport.ts` -- SSR streaming transport
- `src/network.ts` -- network layer with caching
