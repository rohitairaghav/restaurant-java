-- Check current policies on user_profiles table
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Managers can view restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can create restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can update restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can delete restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Users view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Managers view restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers create restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers update restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers delete restaurant users" ON user_profiles;

-- Create helper function (if not exists)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (user_id uuid, user_role text, user_restaurant_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
    SELECT id, role, restaurant_id
    FROM user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Create new policies using helper function
-- Users can view their own profile
CREATE POLICY "Users view own profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (except role and restaurant_id)
CREATE POLICY "Users update own profile" ON user_profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT user_role FROM get_my_profile())
        AND restaurant_id = (SELECT user_restaurant_id FROM get_my_profile())
    );

-- Managers can view all users in their restaurant
CREATE POLICY "Managers view restaurant users" ON user_profiles
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    );

-- Managers can create users in their restaurant
CREATE POLICY "Managers create restaurant users" ON user_profiles
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    );

-- Managers can update users in their restaurant
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
    );

-- Managers can delete users in their restaurant (except themselves)
CREATE POLICY "Managers delete restaurant users" ON user_profiles
    FOR DELETE
    USING (
        id != auth.uid()
        AND restaurant_id IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        )
    );

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
