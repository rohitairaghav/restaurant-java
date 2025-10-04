# Database Migration Guide

## Overview

This project has two Liquibase changelog files:

1. **`db.changelog-master.xml`** - Incremental development migrations (26+ changesets)
2. **`db.changelog-production.xml`** - Consolidated production schema (4 changesets)

## When to Use Which Changelog

### Use `db.changelog-master.xml` if:
- You're working on an **existing database** that already has some migrations applied
- You're continuing development from where you left off
- You need to track incremental changes during development

### Use `db.changelog-production.xml` if:
- You're deploying to a **fresh production environment** (new Supabase project)
- You want a **clean, consolidated schema** without development artifacts
- You're setting up a new staging/QA environment

## Production Deployment (Fresh Database)

For a **new production deployment**, use the consolidated schema:

### Step 1: Update Liquibase Configuration

Edit `supabase/liquibase/liquibase.properties`:

```properties
# Point to production changelog
changeLogFile=changelogs/db.changelog-production.xml

# Add your production Supabase credentials
url=jdbc:postgresql://db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres?ssl=true&sslmode=require
username=postgres
password=<YOUR_SUPABASE_DB_PASSWORD>
```

### Step 2: Run Migration

```bash
npm run db:update
```

This will execute only **4 changesets** instead of 26+:
- `prod-1`: Core database schema (all tables)
- `prod-2`: Performance indexes
- `prod-3`: Triggers and functions
- `prod-4`: Row-Level Security policies

## Development Workflow (Existing Database)

For **existing development databases**, continue using the incremental approach:

### Step 1: Keep Existing Configuration

Use `supabase/liquibase/liquibase.properties`:

```properties
# Point to master changelog (incremental)
changeLogFile=changelogs/db.changelog-master.xml

# Your development Supabase credentials
url=jdbc:postgresql://db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres?ssl=true&sslmode=require
username=postgres
password=<YOUR_SUPABASE_DB_PASSWORD>
```

### Step 2: Run Migration

```bash
npm run db:update
```

This will apply any pending changesets from the 26+ incremental migrations.

## Migration Commands

```bash
# Check what migrations are pending
npm run db:status

# Apply all pending migrations
npm run db:update

# Rollback the last migration
npm run db:rollback

# Validate changelog syntax
npm run db:validate

# View migration history
npm run db:history
```

## Production Schema Contents

The consolidated production schema (`production-schema.xml`) includes:

### Tables
- `restaurants` - Restaurant information
- `user_profiles` - User roles and associations
- `suppliers` - Supplier information
- `inventory_items` - Product inventory with SKU
- `stock_transactions` - Stock movements with audit trail
- `alerts` - Low stock/out of stock notifications
- `audit_logs` - Security audit trail

### Indexes
- Performance indexes on foreign keys, timestamps, and frequently queried columns

### Functions & Triggers
- `update_updated_at_column()` - Auto-update timestamps
- `update_stock_on_transaction()` - Auto-update inventory on transactions
- `check_stock_alert()` - Auto-create alerts on low stock
- `log_audit_trail()` - Security audit logging

### Row-Level Security
- Service role has full access
- Authenticated users: Simple authentication-based policies
- Authorization handled by CASL on server side
- Restaurant-scoped data isolation

## Key Differences

| Aspect | Development (master) | Production (consolidated) |
|--------|---------------------|---------------------------|
| Changesets | 26+ incremental | 4 consolidated |
| Use Case | Existing databases | Fresh deployments |
| History | Full dev history | Clean schema only |
| Complexity | Complex with fixes | Simplified final state |
| RLS Policies | Multiple iterations | Final working version |

## Important Notes

1. **Never switch between changelogs on the same database** - Liquibase tracks which changesets have been applied
2. **Production changelog uses context `prod-fresh`** - This prevents accidental execution on dev databases
3. **CASL handles authorization** - RLS policies are intentionally simple for authentication only
4. **Both approaches achieve the same final schema** - Just different paths to get there

## Troubleshooting

### If you accidentally ran the wrong changelog:

1. Check what's been applied:
   ```bash
   npm run db:history
   ```

2. If needed, rollback specific changesets:
   ```bash
   npm run db:rollback
   ```

3. Update `liquibase.properties` to the correct changelog

4. Re-run migrations:
   ```bash
   npm run db:update
   ```

### Checksum validation errors:

If you see checksum errors, it means a changeset was modified after being applied:

```bash
# Clear checksums (dangerous - only in development!)
liquibase clear-checksums
```

**Production**: Never modify applied changesets. Always create new ones.
