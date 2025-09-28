#!/bin/bash

# Test script for restaurant inventory management system

set -e

echo "🧪 Running Restaurant Inventory Tests"
echo "===================================="

# Function to run tests for a package
run_tests() {
    local package_path=$1
    local package_name=$2

    echo ""
    echo "📦 Testing $package_name..."
    echo "────────────────────────────────────"

    if [ -d "$package_path" ]; then
        cd "$package_path"

        if [ "$3" = "--coverage" ]; then
            npm run test:coverage
        elif [ "$3" = "--watch" ]; then
            npm run test:watch
        else
            npm run test
        fi

        cd - > /dev/null
    else
        echo "❌ Package not found: $package_path"
        exit 1
    fi
}

# Check command line arguments
MODE=${1:-""}

case $MODE in
    "--coverage")
        echo "📊 Running tests with coverage..."
        ;;
    "--watch")
        echo "👀 Running tests in watch mode..."
        ;;
    "")
        echo "🏃 Running all tests..."
        ;;
    *)
        echo "❌ Unknown option: $MODE"
        echo "Usage: ./scripts/test.sh [--coverage|--watch]"
        exit 1
        ;;
esac

# Run tests for each package
run_tests "packages/shared" "Shared Utilities" $MODE
run_tests "apps/web" "Web Application" $MODE

echo ""
echo "✅ All tests completed!"

if [ "$MODE" = "--coverage" ]; then
    echo ""
    echo "📊 Coverage reports generated:"
    echo "   • Web app: apps/web/coverage/"
    echo "   • Shared: packages/shared/coverage/"
fi