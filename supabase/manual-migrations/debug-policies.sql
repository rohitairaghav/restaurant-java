-- Check what policies currently exist
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check if helper function exists
SELECT
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_my_profile';

-- Test the helper function as the current user
SELECT * FROM get_my_profile();
