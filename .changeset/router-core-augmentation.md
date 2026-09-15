---
"@litewarp/start-relay-network": patch
---

Fix loader return types: augment `SerializableExtensions` on `@tanstack/router-core` (where the interface is declared) instead of the `@tanstack/react-router` re-export, so route loaders returning a `PreloadedQuery` typecheck again. Adds `@tanstack/router-core` as a peer dependency.
