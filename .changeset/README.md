# Changesets

This directory contains changeset files that describe changes to the packages in this monorepo.

## Workflow

1. **Make changes** to packages
2. **Create a changeset**: `bun changeset`
   - Select which packages have changed
   - Choose the type of change (major, minor, patch)
   - Write a summary of the changes
3. **Commit** the changeset file along with your changes
4. **Version packages**: `bun changeset:version`
   - Updates package versions and generates CHANGELOGs
5. **Publish**: `bun changeset:publish`
   - Publishes changed packages to npm

## Changeset Commands

```bash
# Create a new changeset
bun changeset

# View changeset status
bun changeset status

# Version packages (bumps versions, updates CHANGELOGs)
bun changeset:version

# Publish to npm
bun changeset:publish

# Add a new changeset in empty mode (no prompts)
bun changeset --empty
```

## Semantic Versioning

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backwards compatible
