---
"@litewarp/start-relay-network": major
---

Upgrade peer dependencies: Relay 21 (`react-relay` / `relay-runtime` `^21.0.1`), TanStack Router `^1.170.36`, TanStack Start `^1.168.54`, React `^19.3.0`. Relay 21 ships first-party TypeScript declarations, so `@types/react-relay` and `@types/relay-runtime` are no longer needed and have been removed.

Internal type imports now come from the `relay-runtime` package index instead of `relay-runtime/lib/...` deep paths, which have no declarations in Relay 21.

The `graphql` peer dependency has been removed: the package never imported it (Relay does not depend on graphql-js at runtime), so consumers can use whichever graphql-js major their server requires.
