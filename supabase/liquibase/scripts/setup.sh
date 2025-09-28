#!/bin/bash

# Liquibase Setup Script for Restaurant Inventory Management
# This script helps you set up and run Liquibase operations

echo "🍴 Restaurant Inventory Management - Liquibase Setup"
echo "===================================================="

# Check if Liquibase is installed
if ! command -v liquibase &> /dev/null; then
    echo "❌ Liquibase is not installed. Please install it first:"
    echo "   - Download from: https://github.com/liquibase/liquibase/releases"
    echo "   - Or install via package manager:"
    echo "     macOS: brew install liquibase"
    echo "     Linux: apt-get install liquibase"
    echo "     Windows: choco install liquibase"
    exit 1
fi

echo "✅ Liquibase found: $(liquibase --version)"

# Check if PostgreSQL driver exists
LIQUIBASE_DIR="supabase/liquibase"
DRIVER_PATH="$LIQUIBASE_DIR/lib/postgresql-42.6.0.jar"

if [ ! -f "$DRIVER_PATH" ]; then
    echo "📦 Downloading PostgreSQL JDBC driver..."
    mkdir -p "$LIQUIBASE_DIR/lib"
    curl -L "https://jdbc.postgresql.org/download/postgresql-42.6.0.jar" -o "$DRIVER_PATH"
    echo "✅ PostgreSQL driver downloaded"
fi

# Check if properties file is configured
PROPS_FILE="$LIQUIBASE_DIR/liquibase.properties"
if grep -q "YOUR_SUPABASE_DB_PASSWORD" "$PROPS_FILE"; then
    echo "⚠️  Please configure your database credentials in:"
    echo "   $PROPS_FILE"
    echo ""
    echo "   Update the following:"
    echo "   - password=YOUR_SUPABASE_DB_PASSWORD"
    echo "   - url=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
    echo ""
    echo "   You can find these credentials in your Supabase dashboard:"
    echo "   Settings > Database > Connection string"
    exit 1
fi

echo "✅ Configuration looks good!"
echo ""
echo "Available commands:"
echo "  npm run db:status    - Check current database status"
echo "  npm run db:update    - Apply pending changes"
echo "  npm run db:rollback  - Rollback last changeset"
echo "  npm run db:validate  - Validate changelog"
echo ""
echo "🚀 Ready to manage your database schema with Liquibase!"