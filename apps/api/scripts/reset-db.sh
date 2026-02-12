#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="start-relay-network-postgres"
DB_NAME="starwars"
DB_USER="postgres"
DB_PORT="6432"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$SCRIPT_DIR/.."
MIGRATIONS_DIR="$API_DIR/migrations"

echo "Starting postgres container..."
docker compose -f "$API_DIR/docker-compose.yml" up -d

echo "Waiting for postgres to be ready..."
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" > /dev/null 2>&1; do
  sleep 1
done

echo "Dropping database '$DB_NAME' (if it exists)..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME"

echo "Creating database '$DB_NAME'..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER"

echo "Running migration: 001_schema.sql"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATIONS_DIR/001_schema.sql"

echo "Running migration: 002_seed.sql"
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATIONS_DIR/002_seed.sql"

echo "Done! Database '$DB_NAME' has been reset on localhost:$DB_PORT"
