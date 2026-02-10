-- Create app_public schema
CREATE SCHEMA IF NOT EXISTS app_public;

-- Example table
CREATE TABLE IF NOT EXISTS app_public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example data
INSERT INTO app_public.users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com')
ON CONFLICT (email) DO NOTHING;
