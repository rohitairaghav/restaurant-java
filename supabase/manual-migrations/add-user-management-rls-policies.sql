-- Add RLS policies for User Management
-- This allows managers to create, read, update, and delete users in their restaurant
-- Run this in Supabase SQL Editor if you need to apply changes immediately

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Managers can view restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can create restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can update restaurant users" ON user_profiles;
DROP POLICY IF EXISTS "Managers can delete restaurant users" ON user_profiles;

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

-- Managers can update users in their restaurant (except cannot change own role)
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

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
AND policyname LIKE '%Manager%'
ORDER BY policyname;
