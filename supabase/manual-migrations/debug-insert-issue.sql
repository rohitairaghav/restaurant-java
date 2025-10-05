-- Run this while logged in as the manager who is trying to create users

-- 1. Check current user's auth.uid()
SELECT auth.uid() as my_auth_id;

-- 2. Check what get_my_profile() returns
SELECT
    user_id,
    user_role,
    user_restaurant_id
FROM get_my_profile();

-- 3. Check the actual user_profiles record for current user
SELECT
    id,
    email,
    role,
    restaurant_id
FROM user_profiles
WHERE id = auth.uid();

-- 4. Test if the INSERT policy condition would pass
-- Replace 'YOUR_RESTAURANT_ID' with the restaurant_id you're trying to insert
SELECT
    CASE
        WHEN 'YOUR_RESTAURANT_ID'::uuid IN (
            SELECT user_restaurant_id
            FROM get_my_profile()
            WHERE user_role = 'manager'
        ) THEN 'POLICY WOULD PASS'
        ELSE 'POLICY WOULD FAIL'
    END as policy_check;

-- 5. Check all INSERT policies on user_profiles
SELECT
    policyname,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'INSERT';
