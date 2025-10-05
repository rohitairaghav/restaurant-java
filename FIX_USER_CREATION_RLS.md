# Fix User Creation RLS Policy Error

## Problem

Getting error: **"new row violates row-level security policy for table 'user_profiles'"**

This happens because the current RLS policies don't allow managers to insert new user profiles.

## Root Cause

The existing RLS policies for `user_profiles` table only allow:
- ✅ Users to view/update their own profile
- ✅ Service role to do everything
- ❌ **Missing**: Managers to create new user profiles in their restaurant

## Solution

Add RLS policies that allow managers to manage users in their restaurant.

### Option 1: Apply via Supabase SQL Editor (Quickest)

1. **Open Supabase Dashboard**
   - Go to your project
   - Click on "SQL Editor"

2. **Run this SQL script:**

```sql
-- Add RLS policies for User Management

-- Managers can view all users in their restaurant
CREATE POLICY "Managers can view restaurant users" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
    );

-- Managers can insert new users into their restaurant
CREATE POLICY "Managers can create restaurant users" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
    );

-- Managers can update users in their restaurant
CREATE POLICY "Managers can update restaurant users" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
        AND (
            user_profiles.id != auth.uid()
            OR (user_profiles.id = auth.uid() AND user_profiles.role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
        )
    );

-- Managers can delete users in their restaurant (except themselves)
CREATE POLICY "Managers can delete restaurant users" ON user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
        AND user_profiles.id != auth.uid()
    );
```

3. **Click "Run"**

4. **Verify the policies were created:**

```sql
SELECT
    policyname,
    cmd,
    qual IS NOT NULL AS has_using,
    with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

You should see policies like:
- `Managers can view restaurant users`
- `Managers can create restaurant users`
- `Managers can update restaurant users`
- `Managers can delete restaurant users`

### Option 2: Apply via Liquibase (Recommended for Version Control)

If you're using Liquibase for database migrations:

1. **Update Liquibase configuration** (if needed)
   ```bash
   # Edit supabase/liquibase/liquibase.properties
   # Make sure it has your Supabase credentials
   ```

2. **Run Liquibase update**
   ```bash
   npm run db:update
   ```

   Or directly:
   ```bash
   cd supabase/liquibase
   liquibase update
   ```

3. **Verify the migration**
   ```bash
   npm run db:history
   ```

   Should show changeset ID 12 applied.

## What These Policies Do

### 1. **SELECT Policy** - "Managers can view restaurant users"
- Allows managers to view all users in their restaurant
- Staff can still view their own profile (existing policy)

### 2. **INSERT Policy** - "Managers can create restaurant users"
- ✅ Allows managers to create new users
- ✅ Only in their own restaurant
- ❌ Staff cannot create users

### 3. **UPDATE Policy** - "Managers can update restaurant users"
- ✅ Allows managers to update any user in their restaurant
- ✅ Users can still update their own profile
- ❌ Managers cannot change their own role (prevents privilege removal)

### 4. **DELETE Policy** - "Managers can delete restaurant users"
- ✅ Allows managers to delete users in their restaurant
- ❌ Cannot delete themselves (prevents locking out)
- ❌ Staff cannot delete any users

## Security Features

These policies enforce:
- ✅ **Restaurant Isolation**: Managers can only manage users in their restaurant
- ✅ **Self-Protection**: Cannot delete own account or change own role
- ✅ **Role-Based Access**: Only managers can create/delete users
- ✅ **Multi-Tenant**: Each restaurant's users are isolated from others

## Testing

After applying the policies, test user creation:

1. **Log in as a manager**
2. **Go to User Administration**
3. **Click "Add User"**
4. **Fill in the form:**
   - Email: `test@example.com`
   - Password: `password123`
   - Role: `staff`
5. **Click "Add User"**

Should succeed without RLS errors! ✅

## Troubleshooting

### Still Getting RLS Error?

1. **Verify policies exist:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';
   ```

2. **Check you're logged in as manager:**
   ```sql
   SELECT id, email, role FROM user_profiles WHERE id = auth.uid();
   ```
   Should show `role = 'manager'`

3. **Verify restaurant_id matches:**
   ```sql
   -- Check your restaurant_id
   SELECT restaurant_id FROM user_profiles WHERE id = auth.uid();
   ```

4. **Test policy directly:**
   ```sql
   -- This should return true for managers
   SELECT EXISTS (
       SELECT 1 FROM user_profiles AS manager
       WHERE manager.id = auth.uid()
       AND manager.role = 'manager'
   );
   ```

### Policy Not Working?

If policies still don't work:

1. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND tablename = 'user_profiles';
   ```
   Should show `rowsecurity = true`

2. **Recreate policies:**
   - Drop all policies first
   - Then recreate them using the SQL above

3. **Check for conflicting policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

## File Locations

The policy definitions are in:
- **Liquibase**: [supabase/liquibase/changelogs/v1.0.0/12-user-management-policies.xml](supabase/liquibase/changelogs/v1.0.0/12-user-management-policies.xml)
- **Manual SQL**: [supabase/manual-migrations/add-user-management-rls-policies.sql](supabase/manual-migrations/add-user-management-rls-policies.sql)

## Related Documentation

- [USER_ADMINISTRATION.md](./USER_ADMINISTRATION.md) - User admin feature docs
- [ACCESS_POLICY_FRAMEWORK.md](./ACCESS_POLICY_FRAMEWORK.md) - CASL permissions
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Overall security

---

**Status**: ✅ Ready to apply
**Priority**: High - Required for user administration to work
**Estimated Time**: 2 minutes to apply via SQL Editor
