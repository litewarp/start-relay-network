# start-relay-network

A monorepo for Start Relay Network, powered by [moonrepo](https://moonrepo.dev) and [bun](https://bun.sh).

## Structure

```
apps/         # Applications
packages/     # Shared packages and libraries
```

## Setup

```bash
# Install proto (if not already installed)
curl -fsSL https://moonrepo.dev/install/proto.sh | bash

# Install toolchain versions (moon, bun, node)
proto use

# Install dependencies
bun install
```

## Development

```bash
# Run all dev servers
bun dev

# Build all packages
bun build

# Run tests
bun test                    # Run all tests
moon run :test-watch        # Watch mode
moon run :test-coverage     # With coverage

# Type check
bun typecheck

# Lint
bun lint                    # Check for issues
moon run :lint-fix          # Auto-fix issues

# Format
bun format                  # Check formatting
moon run :format-write      # Auto-format
```

## Testing

Tests are powered by [Vitest](https://vitest.dev/). Each package can have its own test files:

```bash
# Create a test file
# packages/example/src/index.test.ts

import { describe, it, expect } from 'vitest';

describe('example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

## Changesets

Version management and changelogs are handled by [Changesets](https://github.com/changesets/changesets).

```bash
# 1. Make changes to packages
# 2. Create a changeset
bun changeset

# 3. Commit changeset with your changes
git add .changeset/
git commit -m "Add new feature"

# 4. When ready to release, version packages
bun changeset:version

# 5. Publish to npm (if public packages)
bun changeset:publish
```

## Moon Commands

```bash
# Run a task for all projects
moon run :build

# Run a task for a specific project
moon run <project>:<task>

# List all projects
moon query projects

# View task graph
moon query tasks
```
