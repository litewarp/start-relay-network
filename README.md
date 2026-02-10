# start-relay-network

A monorepo for Start Relay Network, powered by [moonrepo](https://moonrepo.dev) and [bun](https://bun.sh).

## Structure

```
examples/     # Example applications and demos
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
bun test

# Type check
bun typecheck

# Lint
bun lint

# Format
bun format
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
