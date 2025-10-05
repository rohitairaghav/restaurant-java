# User Administration Feature

This document describes the User Administration feature that allows managers to create, update, and delete users within their restaurant.

## Overview

The User Administration feature provides a secure, role-based interface for managing users in the Restaurant Inventory Management System. Only managers have access to this functionality, enforced at multiple security layers.

## Features

### ✅ Complete CRUD Operations

- **Create Users**: Add new manager or staff users with email/password
- **View Users**: List all users in the restaurant with role badges
- **Update Users**: Modify user email and role (with restrictions)
- **Delete Users**: Remove users from the system (with safeguards)

### 🔒 Security Features

1. **Manager-Only Access**: Only managers can access the User Administration screen
2. **Permission Checks**: Multiple layers of authorization (CASL + RLS)
3. **Self-Protection**: Users cannot delete their own account or change their own role
4. **Restaurant Isolation**: Managers can only manage users in their restaurant
5. **Input Validation**: Zod schemas validate all user inputs
6. **Password Security**: Minimum 6 characters, confirmed during creation

## Architecture

### Files Structure

```
apps/web/
├── app/dashboard/users/
│   └── page.tsx                          # Main user admin page
├── components/users/
│   ├── AddUserModal.tsx                  # Add user modal
│   ├── EditUserModal.tsx                 # Edit user modal
│   └── DeleteUserConfirmation.tsx        # Delete confirmation
├── lib/stores/
│   └── users.ts                          # Zustand store for user management
└── __tests__/stores/
    └── users.test.ts                     # User store tests

packages/shared/
├── abilities.ts                          # CASL permissions for users
└── validation.ts                         # Zod schemas for user operations
```

### State Management

The user administration feature uses **Zustand** for state management:

```typescript
interface UsersState {
  users: User[];              // List of users
  loading: boolean;           // Loading state
  error: string | null;       // Error message

  fetchUsers: () => Promise<void>;
  addUser: (user: UserInput) => Promise<void>;
  updateUser: (id: string, updates: UserUpdate) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}
```

## Usage

### Accessing User Administration

1. **Sign in as a manager** (staff users will not see this option)
2. **Navigate to "User Administration"** in the sidebar
3. The page displays all users in your restaurant

### Adding a New User

1. Click **"Add User"** button
2. Fill in the form:
   - Email address
   - Password (minimum 6 characters)
   - Confirm password
   - Role (Manager or Staff)
3. Click **"Add User"**

The new user will receive an account and can immediately log in with the provided credentials.

### Editing a User

1. Click **"Edit"** next to a user in the table
2. Modify the user's:
   - Email address
   - Role (unless it's your own account)
3. Click **"Update User"**

**Note**: You cannot change your own role to prevent privilege escalation/removal.

### Deleting a User

1. Click **"Delete"** next to a user in the table
2. Review the warning message
3. Confirm by clicking **"Delete User"**

**Note**: You cannot delete your own account. The delete button is hidden for the current user.

## Permission Matrix

| Action        | Manager | Staff | Notes                              |
|---------------|---------|-------|------------------------------------|
| View Users    | ✅      | ❌    | Manager-only access                |
| Add Users     | ✅      | ❌    | Can only add to own restaurant     |
| Edit Users    | ✅      | ❌    | Cannot change own role             |
| Delete Users  | ✅      | ❌    | Cannot delete own account          |

## Security Layers

The user administration feature implements **defense-in-depth security**:

### 1. Client-Side Authorization (CASL)

```typescript
// From abilities.ts
if (user.role === 'manager') {
  can(['create', 'read', 'update', 'delete'], 'UserProfile');
}

if (user.role === 'staff') {
  cannot(['create', 'update', 'delete'], 'UserProfile');
}
```

### 2. Route Protection

```typescript
// In page.tsx
useEffect(() => {
  if (currentUser && !isManager) {
    router.push('/dashboard');
  }
}, [currentUser, isManager, router]);
```

### 3. Store-Level Validation

```typescript
// In users.ts
addUser: async (userInput: UserInput) => {
  const { user, ability } = useAuthStore.getState();

  if (!ability.can('create', 'UserProfile')) {
    throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
  }

  if (userInput.restaurant_id !== user.restaurant_id) {
    throw new Error(PERMISSION_ERRORS.WRONG_RESTAURANT);
  }

  // Proceed with creation...
}
```

### 4. Input Validation (Zod)

```typescript
// From validation.ts
export const UserCreateSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['manager', 'staff']),
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
});
```

### 5. Database RLS (Supabase)

Row-level security policies ensure users can only access data from their restaurant at the database level.

### 6. Self-Protection Checks

```typescript
// Cannot delete yourself
if (id === user.id) {
  throw new Error('Cannot delete your own account');
}

// Cannot change your own role
if (id === user.id && updates.role && updates.role !== user.role) {
  throw new Error('Cannot change your own role');
}
```

## UI Components

### Main User Table

Displays all users with:
- Email address (with "You" indicator for current user)
- Role badge (Manager = purple, Staff = green)
- Created date
- Action buttons (Edit/Delete)

### Add User Modal

Form fields:
- Email (validated for format)
- Password (minimum 6 characters)
- Confirm Password (must match)
- Role selector (Manager/Staff dropdown)

### Edit User Modal

Form fields:
- Email (editable)
- Role selector (disabled for current user)

### Delete Confirmation Modal

- User email display
- Warning message with icon
- Confirmation buttons (Cancel/Delete)

## Demo Mode

The user administration feature works in demo mode with mock data:

```typescript
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'manager@demo.com',
    role: 'manager',
    restaurant_id: 'demo-restaurant',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'staff@demo.com',
    role: 'staff',
    restaurant_id: 'demo-restaurant',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];
```

All operations (add, update, delete) are simulated with mock data and network delays.

## Testing

Tests are provided in [__tests__/stores/users.test.ts](apps/web/__tests__/stores/users.test.ts):

```bash
npm test -- --testPathPattern="users.test"
```

**Test Coverage**:
- ✅ Fetch users (manager access)
- ✅ Deny access to staff
- ✅ Add user successfully
- ✅ Prevent adding to different restaurant
- ✅ Update user successfully
- ✅ Prevent changing own role
- ✅ Delete user successfully
- ✅ Prevent deleting own account

## API Operations

### Create User

Uses **Supabase Admin API** for user creation:

```typescript
// 1. Create auth user
const { data: authData } = await supabase.auth.admin.createUser({
  email: userInput.email,
  password: userInput.password,
  email_confirm: true,
});

// 2. Create user profile
const { data: profile } = await supabase
  .from('user_profiles')
  .insert({
    id: authData.user.id,
    email: userInput.email,
    role: userInput.role,
    restaurant_id: userInput.restaurant_id,
  });
```

### Update User

Updates both profile and auth email:

```typescript
// 1. Update profile
await supabase
  .from('user_profiles')
  .update(updates)
  .eq('id', id);

// 2. Update auth email if changed
if (updates.email) {
  await supabase.auth.admin.updateUserById(id, {
    email: updates.email,
  });
}
```

### Delete User

Deletes both profile and auth user:

```typescript
// 1. Delete profile
await supabase
  .from('user_profiles')
  .delete()
  .eq('id', id);

// 2. Delete auth user
await supabase.auth.admin.deleteUser(id);
```

## Error Handling

All operations include comprehensive error handling:

```typescript
try {
  await addUser(userInput);
} catch (error: any) {
  // Error displayed in UI
  setErrors({ submit: error.message });
}
```

**Common Error Messages**:
- "You must be logged in to perform this action"
- "Only managers can perform this action"
- "You can only access data from your own restaurant"
- "Cannot delete your own account"
- "Cannot change your own role"
- "Invalid email format"
- "Password must be at least 6 characters"
- "Passwords do not match"

## Navigation Integration

The User Administration link appears in the sidebar only for managers:

```typescript
const navItems = [
  // ... other items
  {
    href: '/dashboard/users',
    label: 'User Administration',
    icon: Users,
    roles: ['manager'],  // Only visible to managers
  },
];
```

## Database Schema

The user administration feature uses the existing `user_profiles` table:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'staff')),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Future Enhancements

Potential improvements:

1. **Bulk Operations**: Add/delete multiple users at once
2. **User Invitation**: Send email invitations instead of creating passwords
3. **Password Reset**: Allow managers to trigger password resets
4. **User Activity Logs**: Track user login history and actions
5. **Custom Roles**: Support additional roles beyond manager/staff
6. **User Groups**: Organize users into teams or departments
7. **User Import**: CSV import for bulk user creation
8. **User Suspension**: Temporarily disable users without deleting

## Troubleshooting

### "Access Denied" Error

**Problem**: Non-manager users trying to access the page

**Solution**: This is expected behavior. Only managers can access user administration.

### "Cannot delete your own account"

**Problem**: Trying to delete the currently logged-in user

**Solution**: This is a safeguard. Have another manager delete the account if needed.

### "Cannot change your own role"

**Problem**: Trying to modify your own role

**Solution**: This prevents privilege escalation/removal. Have another manager change your role.

### Email Already Exists

**Problem**: Trying to add a user with an existing email

**Solution**: Each email must be unique across the system. Use a different email address.

## Related Documentation

- [ACCESS_POLICY_FRAMEWORK.md](./ACCESS_POLICY_FRAMEWORK.md) - CASL permission system
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Overall security
- [CLAUDE.md](./CLAUDE.md) - Development guidelines

---

**Last Updated**: 2025-10-03
**Status**: ✅ Complete and Production-Ready
**Access Level**: Manager Only
