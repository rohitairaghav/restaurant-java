#!/usr/bin/env node

/**
 * Test script to verify Supabase configuration is working correctly
 * 
 * This script checks:
 * 1. Config module exists and exports functions
 * 2. All connection files import correctly
 * 3. Configuration functions are accessible
 * 
 * Note: This doesn't test actual connections (requires env vars)
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchText)) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`❌ ${description} - Content not found: ${searchText}`, 'red');
      return false;
    }
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

log('\n🔍 Testing Supabase Configuration Setup...\n', 'blue');

let allPassed = true;

// Check config module
log('📦 Checking Configuration Module:', 'blue');
allPassed &= checkFile('packages/shared/config.ts', 'Config module exists');
allPassed &= checkFileContent(
  'packages/shared/config.ts',
  'getSupabaseConfigWeb',
  'getSupabaseConfigWeb function exists'
);
allPassed &= checkFileContent(
  'packages/shared/config.ts',
  'getSupabaseConfigMobile',
  'getSupabaseConfigMobile function exists'
);
allPassed &= checkFileContent(
  'packages/shared/config.ts',
  'getSupabaseConfigServer',
  'getSupabaseConfigServer function exists'
);
allPassed &= checkFileContent(
  'packages/shared/index.ts',
  "export * from './config'",
  'Config exported from shared package'
);

// Check web app connections
log('\n🌐 Checking Web App Connections:', 'blue');
allPassed &= checkFile('apps/web/lib/supabase.ts', 'Web client file exists');
allPassed &= checkFileContent(
  'apps/web/lib/supabase.ts',
  'getSupabaseConfigWeb',
  'Web client uses centralized config'
);
allPassed &= checkFile('apps/web/lib/supabase-server.ts', 'Web server file exists');
allPassed &= checkFileContent(
  'apps/web/lib/supabase-server.ts',
  'getSupabaseConfigWeb',
  'Web server uses centralized config'
);

// Check mobile app connections
log('\n📱 Checking Mobile App Connections:', 'blue');
allPassed &= checkFile('apps/mobile/lib/supabase.ts', 'Mobile client file exists');
allPassed &= checkFileContent(
  'apps/mobile/lib/supabase.ts',
  'getSupabaseConfigMobile',
  'Mobile client uses centralized config'
);
// Check that hardcoded credentials are removed
const mobilePath = path.join(__dirname, '..', 'apps/mobile/lib/supabase.ts');
if (fs.existsSync(mobilePath)) {
  const mobileContent = fs.readFileSync(mobilePath, 'utf8');
  if (!mobileContent.includes('ljfnqzlzffvfhsantcqy') && !mobileContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    log('✅ Hardcoded credentials removed from mobile app', 'green');
  } else {
    log('❌ Hardcoded credentials still present in mobile app', 'red');
    allPassed = false;
  }
}

// Check admin scripts
log('\n🔧 Checking Admin Scripts:', 'blue');
allPassed &= checkFile('supabase/liquibase/scripts/create-auth-users.js', 'Admin script exists');
allPassed &= checkFileContent(
  'supabase/liquibase/scripts/create-auth-users.js',
  'getSupabaseConfigServer',
  'Admin script uses centralized config'
);

// Check documentation
log('\n📚 Checking Documentation:', 'blue');
allPassed &= checkFile('CONFIGURATION.md', 'Configuration documentation exists');
allPassed &= checkFile('SECURITY_CONFIGURATION_SUMMARY.md', 'Security summary exists');

// Summary
log('\n' + '='.repeat(50), 'blue');
if (allPassed) {
  log('✅ All configuration checks passed!', 'green');
  log('\n📝 Next Steps:', 'blue');
  log('1. Set environment variables in apps/web/.env.local', 'yellow');
  log('2. Set environment variables in apps/mobile/.env', 'yellow');
  log('3. Update supabase/liquibase/liquibase.properties', 'yellow');
  log('4. Test actual connections with your Supabase project', 'yellow');
} else {
  log('❌ Some checks failed. Please review the errors above.', 'red');
}
log('='.repeat(50) + '\n', 'blue');

process.exit(allPassed ? 0 : 1);

