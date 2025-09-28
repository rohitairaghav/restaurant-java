# Liquibase Database Management

This directory contains Liquibase configuration for managing database schema changes for the Restaurant Inventory Management system.

## 📁 Directory Structure

```
supabase/liquibase/
├── README.md                           # This file
├── liquibase.properties               # Database connection configuration
├── changelogs/                        # Database changelog files
│   ├── db.changelog-master.xml       # Master changelog file
│   └── v1.0.0/                       # Version 1.0.0 changes
│       ├── 01-initial-schema.xml     # Tables and basic structure
│       ├── 02-rls-policies.xml       # Row Level Security policies
│       ├── 03-triggers-functions.xml # Database triggers and functions
│       └── 04-indexes.xml            # Performance indexes
└── scripts/
    └── setup.sh                      # Setup and validation script
```

## 🚀 Quick Start

### 1. Install Liquibase

**macOS (Homebrew):**
```bash
brew install liquibase
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install liquibase
```

**Windows (Chocolatey):**
```bash
choco install liquibase
```

**Manual Installation:**
- Download from [Liquibase Releases](https://github.com/liquibase/liquibase/releases)
- Extract and add to your PATH

### 2. Configure Database Connection

Edit `liquibase.properties` and update the following:

```properties
# Update with your Supabase credentials
url=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
username=postgres
password=YOUR_SUPABASE_DB_PASSWORD
```

**To find your Supabase credentials:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Settings > Database
3. Copy the connection string and extract the details

### 3. Run Setup

```bash
# From the web app directory
npm run db:setup

# Or directly
cd supabase/liquibase && ./scripts/setup.sh
```

### 4. Apply Database Changes

```bash
# Apply all pending changes
npm run db:update

# Check current status
npm run db:status
```

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `npm run db:setup` | Run setup validation | Initial setup check |
| `npm run db:status` | Show pending changes | See what will be applied |
| `npm run db:update` | Apply all pending changes | Deploy schema updates |
| `npm run db:rollback` | Rollback last changeset | Undo last change |
| `npm run db:rollback-to` | Rollback to specific date | `npm run db:rollback-to 2023-12-01` |
| `npm run db:validate` | Validate changelog syntax | Check for errors |
| `npm run db:generate-docs` | Generate documentation | Create HTML docs |
| `npm run db:diff` | Compare to another database | See differences |
| `npm run db:history` | Show change history | See applied changes |

## 🗂️ Schema Structure

### Tables Created

1. **restaurants** - Restaurant information
2. **user_profiles** - User profiles with roles (manager/staff)
3. **suppliers** - Supplier contact information
4. **inventory_items** - Inventory items with stock tracking
5. **stock_transactions** - Stock movement history (in/out)
6. **alerts** - Low stock and out-of-stock notifications

### Security Features

- **Row Level Security (RLS)** - Multi-tenant data isolation
- **Role-based Access** - Manager vs staff permissions
- **Secure Policies** - Restaurant-specific data access

### Automation

- **Auto-updating timestamps** - `updated_at` columns
- **Stock calculations** - Automatic stock level updates
- **Alert generation** - Low stock notifications
- **Performance indexes** - Optimized queries

## 🔄 Version Management

### Current Version: v1.0.0

The initial release includes:
- ✅ Core schema (tables, relationships)
- ✅ Row Level Security policies
- ✅ Business logic triggers
- ✅ Performance indexes

### Future Versions

New features will be added as versioned changesets:
```
changelogs/
├── v1.0.0/  # Initial release
├── v1.1.0/  # Future enhancements
└── v2.0.0/  # Major updates
```

### Adding New Changes

1. Create new changeset file in appropriate version directory
2. Add `<include>` reference in `db.changelog-master.xml`
3. Test with `npm run db:validate`
4. Apply with `npm run db:update`

## 🛡️ Best Practices

### Before Making Changes

```bash
# Always check current status first
npm run db:status

# Validate your changes
npm run db:validate

# Backup production data before major changes
```

### Making Changes

1. **Use specific changeset IDs** - Sequential numbers work well
2. **Add meaningful comments** - Explain what each change does
3. **Include rollback instructions** - Plan for reverting changes
4. **Test in development first** - Never test directly in production

### Rollback Strategy

```bash
# Rollback last change
npm run db:rollback

# Rollback to specific date
npm run db:rollback-to 2023-12-01

# Check what will be rolled back
npm run db:status
```

## 🐛 Troubleshooting

### Common Issues

**1. Connection Failed**
```
Cause: Incorrect database credentials
Solution: Check liquibase.properties configuration
```

**2. Permission Denied**
```
Cause: Database user lacks permissions
Solution: Use postgres user or grant appropriate permissions
```

**3. Changeset Conflicts**
```
Cause: Duplicate changeset IDs or modified existing changesets
Solution: Create new changeset or fix conflicts
```

**4. PostgreSQL Driver Missing**
```
Cause: JDBC driver not found
Solution: Run npm run db:setup to download driver
```

### Getting Help

- Check `npm run db:status` for current state
- Validate syntax with `npm run db:validate`
- Review [Liquibase Documentation](https://docs.liquibase.com/)
- Check Supabase connection in dashboard

## 📚 Resources

- [Liquibase Documentation](https://docs.liquibase.com/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**🍴 Restaurant Inventory Management System**
Database schema management with Liquibase