# @litewarp/start-relay-network

TanStack Start adapter for React Relay with SSR streaming support. Supports
`@defer` and `@stream` with progressive hydration.

## How It Works

1. A route loader calls `context.preloadQuery(query, vars)`.
2. On the server, the network layer starts the GraphQL fetch and captures every
   response in a `ReplaySubject` keyed by the query.
3. The `PreloadedQuery` is serialized into the router's dehydrated state and sent
   to the client immediately.
4. GraphQL responses stream to the client over a custom transport as they arrive,
   including deferred and streamed payloads.
5. The client hydrates the `PreloadedQuery` against the replayed responses, so no
   query is fetched twice.

## Exports

- `.` -- `createRelayEnvironment`, `integrateRelayWithRouter`,
  `setupRouterRelayIntegration`, `createMiddleware`, and the public types
  (`src/index.tsx`)
- `./transforms/incremental-delivery` -- response transform for the GraphQL
  incremental delivery format (`hasNext` / `incremental`)
- `./transforms/grafast-relay` -- response transform for the Grafast / PostGraphile
  v5 incremental delivery format

## Key Directories

- `src/environment.ts` -- builds the Relay environment and query registry
- `src/network/` -- server and client fetch functions with the query cache
- `src/cache/` -- per-query `ReplaySubject` records
- `src/fetch/` -- multipart response parsing and incremental patch resolution
- `src/middleware/` -- request and response middleware pipeline
- `src/preload/` -- server and client `preloadQuery` implementations and the
  `SerializableExtensions` augmentation for TanStack's loader type check
- `src/transport/` -- SSR streaming transport, serialization adapters, and the
  Relay provider wrapper
- `src/setup/` -- wires the transport and serialization adapters into the router

## Peer Dependencies

React 19, `react-relay` / `relay-runtime` 21, `@tanstack/react-router`,
`@tanstack/react-start`, and `@tanstack/router-core`. The last one is required
because this package augments the `SerializableExtensions` interface that lives
there.
