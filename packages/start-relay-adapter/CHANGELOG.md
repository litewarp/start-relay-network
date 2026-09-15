# @litewarp/start-relay-network

## 1.0.0

### Major Changes

- 736664e: Upgrade peer dependencies: Relay 21 (`react-relay` / `relay-runtime` `^21.0.1`), TanStack Router `^1.170.36`, TanStack Start `^1.168.54`, React `^19.3.0`. Relay 21 ships first-party TypeScript declarations, so `@types/react-relay` and `@types/relay-runtime` are no longer needed and have been removed.
  
  Internal type imports now come from the `relay-runtime` package index instead of `relay-runtime/lib/...` deep paths, which have no declarations in Relay 21.
  
  The `graphql` peer dependency has been removed: the package never imported it (Relay does not depend on graphql-js at runtime), so consumers can use whichever graphql-js major their server requires.
- c7c379a: Prepare for first publish

### Patch Changes

- 1ba25c0: Fix loader return types: augment `SerializableExtensions` on `@tanstack/router-core` (where the interface is declared) instead of the `@tanstack/react-router` re-export, so route loaders returning a `PreloadedQuery` typecheck again. Adds `@tanstack/router-core` as a peer dependency.
- 7813aaf: Replace `debug` package with a simple built-in logger to avoid CJS/ESM interop issues in the browser

## 1.0.0-beta.7

### Major Changes

- Beta refactor: remove getFetchOptions, fix PreloadedQuery types, add createMiddleware

## 1.0.0-alpha.6

### Patch Changes

- e5f8e12: remove debug from package.json because claude can't be trusted

## 1.0.0-alpha.5

### Patch Changes

- d27d5d0: Remove debug from bundled dependencies

## 1.0.0-alpha.3

### Patch Changes

- Externalize `debug` package from bundle so it is not compiled into the browser build

## 1.0.0-alpha.2

### Major Changes

- c7c379a: Prepare for first publish

### Minor Changes

- ab804bf: Synchronizing Changests

## 1.0.0

### Major Changes

- c7c379a: Prepare for first publish

### Minor Changes

- npm package improvements
