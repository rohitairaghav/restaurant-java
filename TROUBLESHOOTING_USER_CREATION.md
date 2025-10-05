# Troubleshooting User Creation

## Issue: "Email address ... is invalid"

If you're seeing this error when trying to create a user, here are the possible causes and solutions:

### Possible Causes

1. **Email Already Exists**
   - The email might already be registered in Supabase Auth
   - Check: Supabase Dashboard → Authentication → Users

2. **Supabase Email Domain Restrictions**
   - Supabase may have email domain validation enabled
   - Check: Supabase Dashboard → Authentication → Settings → Email Auth → "Allow disposable email addresses"

3. **Invalid Email Format**
   - Email must follow standard format: `user@domain.tld`
   - Special characters or spaces can cause issues

### Solutions

#### 1. Check for Existing Users

Go to your Supabase Dashboard:
```
1. Open Supabase Dashboard
2. Select your project
3. Go to Authentication → Users
4. Search for the email address
5. If found, delete the user or use a different email
```

#### 2. Enable Disposable/Test Email Addresses

If using test emails like `demostaff@demobistro.com`:

```
1. Go to Supabase Dashboard
2. Authentication → Settings
3. Email Auth section
4. Enable "Allow disposable email addresses"
5. Click Save
```

#### 3. Check Supabase Email Provider Settings

```
1. Go to Supabase Dashboard
2. Authentication → Email Templates
3. Verify SMTP settings are configured
4. Or use Supabase's built-in email service
```

#### 4. Try a Standard Email Format

Use a well-known email domain:
- ✅ `user@gmail.com`
- ✅ `user@example.com`
- ✅ `user@company.com`
- ❌ `user@invalidtld` (might be blocked)

### Debugging Steps

#### Step 1: Check Server Logs

The API route now includes detailed logging:

```bash
# In your terminal where the Next.js dev server is running:
# Look for these log messages:

Validating user creation with data: { email: '...', role: '...', restaurant_id: '...' }
Supabase signUp error: { message: '...', ... }
```

#### Step 2: Test with a Different Email

Try creating a user with these test emails:
- `test1@example.com`
- `staff1@example.com`
- `manager1@example.com`

#### Step 3: Check Supabase Auth Users

```sql
-- Run this query in Supabase SQL Editor:
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

#### Step 4: Verify Email in user_profiles

```sql
-- Check if email exists in user_profiles:
SELECT id, email, role, restaurant_id
FROM user_profiles
WHERE email = 'demostaff@demobistro.com';
```

### Workaround: Delete and Recreate

If the email exists but shouldn't:

```sql
-- 1. Find the user ID
SELECT id FROM auth.users WHERE email = 'demostaff@demobistro.com';

-- 2. Delete from user_profiles
DELETE FROM user_profiles WHERE email = 'demostaff@demobistro.com';

-- 3. Delete from auth.users (if you have permissions)
-- Note: This might require service role access
```

Or use Supabase Dashboard:
1. Authentication → Users
2. Find the user
3. Click the three dots (⋮)
4. Select "Delete user"

### Current Error Handling

The API route now provides better error messages:

| Supabase Error | User-Friendly Message |
|----------------|----------------------|
| "already registered" | "A user with this email already exists" |
| "invalid" / "Invalid" | "Invalid email format. Please use a valid email address like user@example.com" |
| Other errors | Original Supabase error message |

### API Route Improvements

The `/api/users` endpoint now:

1. ✅ Checks if email already exists in `user_profiles`
2. ✅ Trims and lowercases email before validation
3. ✅ Logs validation attempts (check console)
4. ✅ Provides clearer error messages
5. ✅ Returns 409 Conflict for duplicate emails

### Testing

To test user creation:

```typescript
// Test with curl:
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "staff",
    "restaurant_id": "YOUR_RESTAURANT_ID"
  }'
```

### Common Email Validation Rules

Supabase validates emails based on:
- ✅ Has @ symbol
- ✅ Has domain after @
- ✅ Has TLD (e.g., .com, .org)
- ✅ No spaces or invalid characters
- ❌ May reject certain domains (disposable email providers)

### Recommended Email Formats for Testing

For demo/test purposes, use these patterns:
```
manager@{yourcompany}.com
staff@{yourcompany}.com
user1@example.com
test.user@example.com
```

Avoid:
```
user@localhost (no TLD)
user@test (no TLD)
user+tag@domain.com (plus addressing might be blocked)
```

### Still Having Issues?

1. **Check Supabase Status**: https://status.supabase.com
2. **Review Supabase Logs**: Dashboard → Logs → Auth Logs
3. **Enable Debug Mode**: Set `NEXT_PUBLIC_SUPABASE_DEBUG=true` in `.env.local`
4. **Check Browser Console**: Look for detailed error messages
5. **Check Network Tab**: Inspect the `/api/users` request/response

### Production Considerations

For production:

1. **Disable Detailed Logging**: Remove console.log statements
2. **Rate Limit User Creation**: Prevent abuse
3. **Email Verification**: Enable email confirmation
4. **Domain Whitelist**: Only allow company email domains
5. **CAPTCHA**: Add CAPTCHA to prevent bot signups

---

**Last Updated**: 2025-10-03
**Related**: [USER_ADMINISTRATION.md](./USER_ADMINISTRATION.md)
