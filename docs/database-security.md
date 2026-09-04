# Production Database Security & Least Privilege Configuration Guide

This guide outlines database access controls, Row Level Security (RLS) policies, and role segregation for production deployments of AI Dataset Explorer.

---

## 1. Database Role Segregation (Principle of Least Privilege)

Never connect your web application using the PostgreSQL superuser (`postgres`) or database owner role. Establish dedicated roles with scoped permissions:

```sql
-- 1. Create limited application user
CREATE ROLE app_user WITH LOGIN PASSWORD 'STRONG_RANDOMLY_GENERATED_SECRET' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- 2. Create read-only analytics/reporting user
CREATE ROLE app_readonly WITH LOGIN PASSWORD 'ANALYTICS_RANDOMLY_GENERATED_SECRET' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- 3. Create schema migration runner (used only in CI/CD pipeline)
CREATE ROLE migration_runner WITH LOGIN PASSWORD 'MIGRATION_RANDOMLY_GENERATED_SECRET' NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

---

## 2. Table Grants & Column Restrictions

Grant only necessary operations on specific tables:

```sql
-- Revoke all public defaults
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

-- Grant app_user CRUD access only to application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON users, search_history, saved_datasets TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Grant app_readonly strictly SELECT access
GRANT SELECT ON users, search_history, saved_datasets TO app_readonly;
```

---

## 3. Supabase / PostgreSQL Row Level Security (RLS) Policies

Enable Row Level Security (RLS) on every table:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can only read and write their own saved datasets
CREATE POLICY "Users can view own saved datasets"
  ON saved_datasets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved datasets"
  ON saved_datasets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved datasets"
  ON saved_datasets
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 4. Connection Pool & SSL Enforcement

1. **Enforce TLS / SSL**: Always set `sslmode=require` or `sslmode=verify-full` in your database connection string:
   ```env
   DATABASE_URL="postgresql://app_user:PASSWORD@db.example.com:5432/aiexplorer?sslmode=verify-full&sslrootcert=/path/to/server-ca.pem"
   ```
2. **Connection Limits**: Bound maximum connections per container (e.g. `max: 10`, `idleTimeoutMillis: 30000`) to prevent connection pool exhaustion attacks.
3. **Statement Timeouts**: Set `statement_timeout = '5s'` to eliminate runaway or slow DoS queries.
