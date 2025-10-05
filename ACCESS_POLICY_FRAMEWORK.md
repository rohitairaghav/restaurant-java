# Access Policy Framework - CASL Implementation

This document describes the fine-grained access control system implemented using CASL (Can I Access Stuff Logic) for the Restaurant Inventory Management System.

## Overview

The access policy framework provides **defense-in-depth** security with multiple layers:

1. **Client-side authorization** (CASL) - Fast permission checks in UI/stores
2. **Server-side validation** (API routes) - Business logic enforcement
3. **Database-level security** (RLS) - Restaurant data isolation
4. **Input validation** (Zod) - Data integrity
5. **Rate limiting** (Upstash) - API abuse prevention
6. **Audit logging** - Security event tracking

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Client Request                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  1. CASL Permission Check (Client-side)         │
│     - Fast UI-level checks                       │
│     - Hide/disable unauthorized actions          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. Rate Limiting (Upstash Redis)               │
│     - Prevent API abuse                          │
│     - Per-endpoint limits                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. Authentication (Supabase Auth)              │
│     - Verify user identity                       │
│     - Check session validity                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. CASL Authorization (Server-side)            │
│     - Action-level permissions                   │
│     - Field-level restrictions                   │
│     - Time-based rules                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. Input Validation (Zod)                      │
│     - Type safety                                │
│     - Data integrity                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  6. Database RLS (Supabase)                     │
│     - Restaurant isolation                       │
│     - Row-level security                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  7. Audit Logging                                │
│     - Track security events                      │
│     - Monitor access patterns                    │
└─────────────────────────────────────────────────┘
```

## Files Structure

```
packages/shared/
├── abilities.ts              # CASL ability definitions
├── types.ts                  # TypeScript types
└── validation.ts             # Zod schemas

apps/web/lib/
├── stores/
│   ├── auth.ts              # Auth store with ability
│   ├── inventory.ts         # Inventory with permission checks
│   └── stock.ts             # Stock with permission checks
├── hooks/
│   └── useAbility.ts        # React hooks for permissions
└── rate-limit.ts            # Rate limiting middleware

apps/web/__tests__/lib/
└── abilities.test.ts        # CASL tests (16 tests, all passing)
```

## Permission Matrix

### Manager Permissions

| Resource          | Create | Read | Update | Delete | Notes                        |
|-------------------|--------|------|--------|--------|------------------------------|
| InventoryItem     | ✅     | ✅   | ✅     | ✅     | Full control                 |
| Supplier          | ✅     | ✅   | ✅     | ✅     | Full control                 |
| StockTransaction  | ✅     | ✅   | ✅     | ✅     | No time restrictions         |
| Alert             | ✅     | ✅   | ✅     | ✅     | Full control                 |
| Restaurant        | ✅     | ✅   | ✅     | ✅     | Own restaurant only          |
| AuditLog          | ❌     | ✅   | ❌     | ❌     | Read-only, system-managed    |
| UserProfile       | ✅     | ✅   | ✅     | ✅     | Full control                 |

### Staff Permissions

| Resource          | Create | Read | Update | Delete | Notes                        |
|-------------------|--------|------|--------|--------|------------------------------|
| InventoryItem     | ✅     | ✅   | ✅*    | ❌     | *Cannot update pricing       |
| Supplier          | ❌     | ✅   | ❌     | ❌     | Read-only                    |
| StockTransaction  | ✅     | ✅   | ✅*    | ❌     | *Only within 24 hours        |
| Alert             | ❌     | ✅   | ✅*    | ❌     | *Only `is_read` field        |
| Restaurant        | ❌     | ✅   | ❌     | ❌     | Read-only                    |
| AuditLog          | ❌     | ❌   | ❌     | ❌     | No access                    |
| UserProfile       | ❌     | ✅   | ❌     | ❌     | Read-only (own profile)      |

## Field-Level Permissions

### InventoryItem

**Manager**: Can update all fields

**Staff**:
- ✅ Can update: `name`, `category`, `unit`, `min_threshold`, `current_stock`
- ❌ Cannot update: `cost_per_unit`, `supplier_id`, `restaurant_id`

### StockTransaction

**Manager**: Can update all fields

**Staff**:
- ✅ Can update: `quantity`, `notes`, `reason`
- ❌ Cannot update: `item_id`, `type`, `user_id`, `restaurant_id`
- ⏰ Time restriction: Only transactions created within last 24 hours

### Alert

**Manager**: Can update all fields

**Staff**:
- ✅ Can update: `is_read`
- ❌ Cannot update: `type`, `message`, `item_id`

## Usage Examples

### 1. Client-Side UI Permission Checks

```typescript
import { useCan, useIsManager } from '@/lib/hooks/useAbility';

function InventoryActions({ item }: { item: InventoryItem }) {
  const canDelete = useCan('delete', 'InventoryItem');
  const isManager = useIsManager();

  return (
    <>
      {canDelete && (
        <button onClick={() => handleDelete(item.id)}>
          Delete Item
        </button>
      )}

      {isManager && (
        <button onClick={() => handleEditSupplier()}>
          Manage Suppliers
        </button>
      )}
    </>
  );
}
```

### 2. Programmatic Permission Checks in Stores

```typescript
import { useAuthStore } from '@/lib/stores/auth';
import { canUpdateFields, PERMISSION_ERRORS } from '@restaurant-inventory/shared';

async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const { user, ability } = useAuthStore.getState();

  // 1. Check basic permission
  if (!ability.can('update', 'InventoryItem')) {
    throw new Error(PERMISSION_ERRORS.FORBIDDEN);
  }

  // 2. Check field-level permissions
  const updateFields = Object.keys(updates);
  if (!canUpdateFields(user, 'InventoryItem', updateFields)) {
    throw new Error(PERMISSION_ERRORS.RESTRICTED_FIELDS);
  }

  // 3. Proceed with update
  await supabase.from('inventory_items').update(updates).eq('id', id);
}
```

### 3. Server-Side API Route Validation

```typescript
// app/api/inventory/[id]/route.ts
import { defineAbilitiesFor, canUpdateFields } from '@restaurant-inventory/shared';
import { rateLimit } from '@/lib/rate-limit';
import { validateInput, InventoryItemUpdateSchema } from '@restaurant-inventory/shared';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, 'api');
  if (!rateLimitResult.success) {
    return new Response('Too many requests', { status: 429 });
  }

  // 2. Authentication
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 3. Get user profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // 4. Authorization (CASL)
  const ability = defineAbilitiesFor(userProfile);
  if (!ability.can('update', 'InventoryItem')) {
    return new Response('Forbidden', { status: 403 });
  }

  // 5. Input validation (Zod)
  const body = await request.json();
  const validatedData = validateInput(InventoryItemUpdateSchema, body);

  // 6. Field-level permissions (CASL)
  if (!canUpdateFields(userProfile, 'InventoryItem', Object.keys(validatedData))) {
    return new Response('Cannot update pricing fields', { status: 403 });
  }

  // 7. Database operation (RLS enforces restaurant isolation)
  const { data, error } = await supabase
    .from('inventory_items')
    .update(validatedData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return Response.json(data);
}
```

### 4. Using CASL with @casl/react

```typescript
import { Can } from '@casl/react';
import { useAbility } from '@/lib/hooks/useAbility';

function InventoryItemCard({ item }: { item: InventoryItem }) {
  const ability = useAbility();

  return (
    <div>
      <h3>{item.name}</h3>

      <Can I="update" this={item} ability={ability}>
        <button>Edit</button>
      </Can>

      <Can I="delete" this={item} ability={ability}>
        <button>Delete</button>
      </Can>
    </div>
  );
}
```

## Time-Based Permissions

Staff members can only update stock transactions created within the last 24 hours:

```typescript
import { canUpdateTransaction } from '@restaurant-inventory/shared';

const transaction = { created_at: '2024-01-01T10:00:00Z' };
const canUpdate = canUpdateTransaction(staffUser, transaction.created_at);

if (!canUpdate) {
  throw new Error(PERMISSION_ERRORS.TRANSACTION_TOO_OLD);
}
```

## Restaurant Isolation

All permissions are scoped to the user's restaurant:

```typescript
import { canAccessRestaurant } from '@restaurant-inventory/shared';

const user = { restaurant_id: 'rest-1' };
const resource = { restaurant_id: 'rest-2' };

if (!canAccessRestaurant(user, resource.restaurant_id)) {
  throw new Error(PERMISSION_ERRORS.WRONG_RESTAURANT);
}
```

## Testing

The access policy framework includes comprehensive tests:

```bash
npm test -- --testPathPattern="abilities.test"
```

**Test Coverage**:
- ✅ 16 tests, all passing
- Permission checks for null users
- Manager permissions (full access)
- Staff permissions (restricted)
- Field-level restrictions
- Time-based restrictions
- Restaurant isolation
- Error messages

## Error Messages

Standardized error messages for better UX:

```typescript
export const PERMISSION_ERRORS = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  MANAGER_ONLY: 'Only managers can perform this action',
  RESTRICTED_FIELDS: 'You cannot update these fields. Contact your manager.',
  TRANSACTION_TOO_OLD: 'Cannot update transactions older than 24 hours. Contact your manager.',
  WRONG_RESTAURANT: 'You can only access data from your own restaurant',
  AUDIT_LOG_READONLY: 'Audit logs are read-only and system-managed',
};
```

## Integration with Existing Security

### Complements Supabase RLS

CASL provides **business logic** layer while RLS provides **data isolation**:

- **CASL**: "Staff cannot update pricing fields"
- **RLS**: "Users can only access their restaurant's data"

### Works with Zod Validation

CASL checks **authorization**, Zod checks **data integrity**:

- **CASL**: "Can this user update this field?"
- **Zod**: "Is the data valid and type-safe?"

### Integrates with Rate Limiting

Both protect different attack vectors:

- **CASL**: Prevents unauthorized actions
- **Rate Limiting**: Prevents API abuse

## Offline Support

CASL works entirely client-side, so permissions function even when offline. When syncing:

1. Client-side CASL validates before queuing
2. Server validates again when processing sync
3. RLS enforces at database level

## Performance Considerations

- **Client-side checks**: Near-instant (pure JavaScript)
- **Ability instances**: Cached in Zustand store
- **No database queries**: CASL rules are in-memory
- **Minimal bundle size**: ~15KB (gzipped)

## Future Enhancements

1. **Granular RLS Policies**: Sync RLS policies with CASL rules
2. **Dynamic Permissions**: Load abilities from database
3. **Permission Analytics**: Track denied actions for UX improvements
4. **Custom Roles**: Support additional roles beyond manager/staff
5. **Permission History**: Audit trail of permission changes

## References

- [CASL Documentation](https://casl.js.org/v6/en/)
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Overall security overview
- [packages/shared/abilities.ts](./packages/shared/abilities.ts) - Ability definitions
- [apps/web/lib/hooks/useAbility.ts](./apps/web/lib/hooks/useAbility.ts) - React hooks

---

**Last Updated**: 2025-10-03
**Implementation Status**: ✅ Complete
**Test Coverage**: 16/16 tests passing
