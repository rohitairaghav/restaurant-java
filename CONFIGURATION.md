# Configuration Guide

This document describes how to configure Supabase connections across all applications in this monorepo.

## Centralized Configuration

All Supabase connections use the centralized configuration module located at:
- `packages/shared/config.ts`

This ensures:
- ✅ Consistent validation across all apps
- ✅ No hardcoded credentials
- ✅ Type-safe configuration
- ✅ Clear error messages when configuration is missing

## Environment Variables

### Web Application (Next.js)

Create `apps/web/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For admin operations only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Environment
NODE_ENV=development
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (only for admin scripts)

### Mobile Application (React Native/Expo)

Create `apps/mobile/.env`:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Environment
NODE_ENV=development
```

**Security Note:** The mobile app previously had hardcoded credentials as fallbacks. These have been removed. You **must** set environment variables.

### Database Migrations (Liquibase)

Edit `supabase/liquibase/liquibase.properties`:

```properties
# Supabase PostgreSQL connection
url=jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres
username=postgres
password=your-database-password
```

**Where to find these values:**
1. Go to Supabase Dashboard > Settings > Database
2. Find "Connection string" section
3. Use the connection details to construct the JDBC URL

**Security:** Never commit `liquibase.properties` with real credentials. Use environment variables or a secrets manager in production.

## Configuration Functions

### Web Applications

```typescript
import { getSupabaseConfigWeb } from '@restaurant-inventory/shared';

const config = getSupabaseConfigWeb();
// Returns: { url: string, anonKey: string, serviceRoleKey?: string }
```

### Mobile Applications

```typescript
import { getSupabaseConfigMobile } from '@restaurant-inventory/shared';

const config = getSupabaseConfigMobile();
// Returns: { url: string, anonKey: string }
```

### Server-Side Operations

```typescript
import { getSupabaseConfigServer } from '@restaurant-inventory/shared';

const config = getSupabaseConfigServer();
// Returns: { url: string, anonKey: string, serviceRoleKey?: string }
```

## Security Best Practices

### ✅ DO:

1. **Use environment variables** - Never hardcode credentials
2. **Use anon key for client-side** - The anon key respects Row Level Security
3. **Use service role key only for admin operations** - Server-side scripts only
4. **Validate environment variables** - The centralized config does this automatically
5. **Use HTTPS** - All Supabase URLs must use HTTPS
6. **Keep secrets out of version control** - Add `.env*` to `.gitignore`

### ❌ DON'T:

1. **Don't commit credentials** - Never commit `.env.local` or `liquibase.properties` with real values
2. **Don't use service role key in client code** - It bypasses Row Level Security
3. **Don't hardcode credentials** - Always use environment variables
4. **Don't share service role keys** - Keep them secret and rotate regularly
5. **Don't use HTTP** - Always use HTTPS for Supabase connections

## Connection Files

### Web App - Client Components
- **File:** `apps/web/lib/supabase.ts`
- **Uses:** `getSupabaseConfigWeb()`
- **For:** Client-side React components and Zustand stores

### Web App - API Routes
- **File:** `apps/web/lib/supabase-server.ts`
- **Uses:** `getSupabaseConfigWeb()`
- **For:** Next.js API route handlers (server-side)

### Mobile App
- **File:** `apps/mobile/lib/supabase.ts`
- **Uses:** `getSupabaseConfigMobile()`
- **For:** React Native/Expo mobile application

### Admin Scripts
- **File:** `supabase/liquibase/scripts/create-auth-users.js`
- **Uses:** `getSupabaseConfigServer()`
- **For:** Server-side admin operations (requires service role key)

## Validation

The centralized configuration automatically validates:

1. **Required variables are set** - Throws clear error if missing
2. **URL format** - Validates HTTPS and Supabase domain pattern
3. **JWT format** - Validates anon key is a valid JWT token
4. **Platform-specific hints** - Error messages include setup instructions

## Troubleshooting

### "Required environment variable is not set"

**Solution:** Check that you've created the appropriate `.env` file and set the required variables.

### "Invalid Supabase URL format"

**Solution:** Ensure the URL:
- Starts with `https://`
- Contains `.supabase.co` in the hostname
- Is properly formatted

### "Supabase anon key must be a valid JWT token"

**Solution:** Ensure you're using the **anon/public** key, not the service role key. The anon key is a JWT token with 3 parts separated by dots.

### Mobile app fails to connect

**Solution:** 
1. Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
2. Restart the Expo development server after changing environment variables
3. Clear the app cache if needed

## Migration from Old Configuration

If you're upgrading from the old configuration:

1. **Remove hardcoded credentials** - Already done in mobile app
2. **Update imports** - All files now use centralized config
3. **Set environment variables** - Create `.env.local` files as described above
4. **Test connections** - Verify all apps can connect to Supabase

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

