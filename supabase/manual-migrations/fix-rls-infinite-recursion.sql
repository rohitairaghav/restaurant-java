-- Fix: Infinite Recursion in user_profiles RLS Policies
-- The issue: Policies were querying user_profiles within user_profiles policies
-- Solution: Use a function to break the recursion

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Managers can view restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can create restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can update restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can delete restaurant users" ON user_profiles;

-- Step 2: Create a helper function to get current user's role and restaurant
-- This function is marked STABLE to be evaluated once per query, avoiding recursion
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    user_id uuid,
    user_role text,
    user_restaurant_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        id,
        role,
        restaurant_id
    FROM user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Step 3: Create new policies using the helper function

-- Policy 1: Users can view their own profile
CREATE POLICY "Users view own profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "Users update own profile" ON user_profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Policy 3: Managers can view all users in their restaurant
CREATE POLICY "Managers view restaurant users" ON user_profiles
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    );

-- Policy 4: Managers can create users in their restaurant
CREATE POLICY "Managers create restaurant users" ON user_profiles
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    );

-- Policy 5: Managers can update users in their restaurant (except changing own role)
CREATE POLICY "Managers update restaurant users" ON user_profiles
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
        -- Prevent changing own role
        AND (
            id != auth.uid()
            OR role = (SELECT user_role FROM get_my_profile())
        )
    );

-- Policy 6: Managers can delete users in their restaurant (except themselves)
CREATE POLICY "Managers delete restaurant users" ON user_profiles
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
        AND id != auth.uid()
    );

-- Step 4: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO anon;

-- Step 5: Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN qual IS NOT NULL THEN 'Has USING'
        ELSE 'No USING'
    END as using_clause,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Step 6: Test the function (should return your profile)
SELECT * FROM get_my_profile();
