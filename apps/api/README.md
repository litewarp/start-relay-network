# API

Postgraphile v5 RC GraphQL API with PostgreSQL database.

## Setup

```bash
# Start PostgreSQL database
moon run api:db:up

# Run API dev server
moon run api:dev
```

The API will be available at:
- GraphQL endpoint: http://localhost:4000/graphql
- GraphiQL IDE: http://localhost:4000/graphiql

## Database

PostgreSQL runs in Docker. Migrations are automatically applied on container start.

```bash
# Start database
moon run api:db:up

# Stop database
moon run api:db:down

# Reset database (delete all data)
moon run api:db:reset
```
