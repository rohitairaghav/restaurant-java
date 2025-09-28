# Setting Up Authentication Users for Testing

## Why Login Isn't Working

The test data we created includes user profiles in the database, but **Supabase authentication requires actual user accounts** in the `auth.users` table. The profiles we inserted are just metadata - they don't create login credentials.

## Solution Options

### Option 1: Manual Creation via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Navigate to Authentication > Users**
3. **Click "Add User"** and create these test users:

| Email | Password | Role | Restaurant |
|-------|----------|------|------------|
| `manager@demobistro.com` | `Demo123!` | Manager | Demo Italian Bistro |
| `staff@demobistro.com` | `Demo123!` | Staff | Demo Italian Bistro |
| `chef@pizzapalace.com` | `Demo123!` | Manager | Test Pizza Palace |
| `server@sushi.com` | `Demo123!` | Staff | Sample Sushi Bar |

4. **Copy the User IDs** from the dashboard
5. **Update the user_profiles table** to link them:

```sql
-- Run these SQL commands in Supabase SQL Editor after creating the auth users
-- Replace the UUIDs with the actual user IDs from the dashboard

UPDATE user_profiles
SET id = 'ACTUAL_USER_ID_FROM_DASHBOARD_1'
WHERE email = 'manager@demobistro.com';

UPDATE user_profiles
SET id = 'ACTUAL_USER_ID_FROM_DASHBOARD_2'
WHERE email = 'staff@demobistro.com';

UPDATE user_profiles
SET id = 'ACTUAL_USER_ID_FROM_DASHBOARD_3'
WHERE email = 'chef@pizzapalace.com';

UPDATE user_profiles
SET id = 'ACTUAL_USER_ID_FROM_DASHBOARD_4'
WHERE email = 'server@sushi.com';
```

### Option 2: Automated Script (Requires Service Role Key)

If you have the service role key:

1. **Add to `.env.local`**:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Run the script**:
```bash
npm run db:create-auth-users
```

To get the service role key:
- Go to Settings > API in your Supabase dashboard
- Copy the "service_role" key (not the anon key)

### Option 3: Quick Test with Single User

Create just one user manually for immediate testing:

1. **Supabase Dashboard > Authentication > Users > Add User**
   - Email: `manager@demobistro.com`
   - Password: `Demo123!`
   - Auto Confirm: Yes

2. **Copy the generated User ID**

3. **Run this SQL in Supabase SQL Editor**:
```sql
UPDATE user_profiles
SET id = 'PASTE_USER_ID_HERE'
WHERE email = 'manager@demobistro.com';
```

## After Setup

Once you create the auth users and link them to profiles, you can:

✅ **Login** with any of the test credentials
✅ **See real data** instead of hardcoded responses
✅ **Test all functionality** with actual database operations
✅ **Create stock transactions** with real user attribution
✅ **Generate alerts** based on actual inventory levels

## Troubleshooting

**Error: "Invalid login credentials"**
- Make sure the auth user was created in Supabase Auth
- Verify the password is correct
- Check that email confirmation is enabled

**Error: "User not found in profiles"**
- Run the UPDATE SQL commands to link auth users to profiles
- Verify the user_profiles table has the correct user ID

**Error: "Access denied"**
- Check that RLS policies are properly configured
- Verify the user has a restaurant_id in their profile

## Next Steps

After login works, you can test:
1. **Inventory Management** - Add/edit items with real suppliers
2. **Stock Tracking** - Create transactions that update inventory
3. **Alerts** - View low stock and out-of-stock notifications
4. **Multi-tenant** - Switch between different restaurant accounts