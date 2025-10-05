# Quick Fix: User Creation RLS Error

## Problem
Getting error: **"new row violates row-level security policy for table 'user_profiles'"**

## Quick Solution (No Liquibase Required)

Since Liquibase is not set up yet, apply the fix directly in Supabase:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Open your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy and Run This SQL

```sql
-- Add RLS policies for managers to manage users in their restaurant

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Managers can view restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can create restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can update restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can delete restaurant users" ON user_profiles;

-- 1. Managers can view all users in their restaurant
CREATE POLICY "Managers can view restaurant users" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
    );

-- 2. Managers can insert new users into their restaurant (FIXES THE ERROR)
CREATE POLICY "Managers can create restaurant users" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
    );

-- 3. Managers can update users in their restaurant (cannot change own role)
CREATE POLICY "Managers can update restaurant users" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS manager
            WHERE manager.id = auth.uid()
            AND manager.role = 'manager'
            AND manager.restaurant_id = user_profiles.restaurant_id
        )
        AND (
            -- Either updating someone else, or updating self without changing role
            user_profiles.id != auth.uid()
            OR (user_profiles.id = auth.uid() AND user_profiles.role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
        )
    );

-- 4. Managers can delete users in their restaurant (except themselves)
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

-- Verify policies were created successfully
SELECT
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
AND policyname LIKE '%Manager%'
ORDER BY policyname;
```

### Step 3: Click "Run"

You should see a success message and the verification query should show 4 policies:
- Managers can create restaurant users
- Managers can delete restaurant users
- Managers can update restaurant users
- Managers can view restaurant users

### Step 4: Test User Creation

1. Go back to your application
2. Log in as a manager
3. Navigate to **"User Administration"**
4. Click **"Add User"**
5. Fill in:
   - Email: `newuser@example.com`
   - Password: `password123`
   - Role: `staff`
6. Click **"Add User"**

Should work now! ✅

## What This Does

These policies allow managers to:
- ✅ Create new users in their restaurant
- ✅ View all users in their restaurant
- ✅ Update any user in their restaurant
- ✅ Delete any user in their restaurant (except themselves)

While maintaining security:
- ✅ Managers can only manage users in their own restaurant
- ✅ Managers cannot delete their own account
- ✅ Managers cannot change their own role
- ✅ Staff cannot create/delete users

## Troubleshooting

### If You Get "Policy Already Exists" Error

The SQL script includes `DROP POLICY IF EXISTS` statements, but if you still get an error:

1. **Drop policies manually first:**
```sql
DROP POLICY "Managers can view restaurant users" ON user_profiles;
DROP POLICY "Managers can create restaurant users" ON user_profiles;
DROP POLICY "Managers can update restaurant users" ON user_profiles;
DROP POLICY "Managers can delete restaurant users" ON user_profiles;
```

2. **Then run the CREATE POLICY statements again**

### If Still Getting RLS Error

1. **Verify you're logged in as a manager:**
```sql
SELECT id, email, role, restaurant_id
FROM user_profiles
WHERE id = auth.uid();
```
Should show `role = 'manager'`

2. **Check RLS is enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_profiles';
```
Should show `rowsecurity = true`

3. **Test the policy logic:**
```sql
-- This should return true for managers
SELECT EXISTS (
    SELECT 1 FROM user_profiles AS manager
    WHERE manager.id = auth.uid()
    AND manager.role = 'manager'
) AS am_i_manager;
```

## About Liquibase Setup (Optional)

If you want to set up Liquibase for future migrations:

1. **Copy the example file:**
```bash
cd supabase/liquibase
cp liquibase.properties.example liquibase.properties
```

2. **Edit `liquibase.properties`:**
```properties
url=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
username=postgres
password=YOUR_DATABASE_PASSWORD
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference (from project settings)
- `YOUR_DATABASE_PASSWORD` with your database password

3. **Test Liquibase:**
```bash
npm run db:status
```

4. **Apply migrations:**
```bash
npm run db:update
```

But for now, **the SQL script above is the fastest solution!**

---

**Status**: ✅ Ready to apply
**Time**: 2 minutes
**No Liquibase needed**: Apply directly in Supabase SQL Editor
