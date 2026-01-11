import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import type { User } from './types';

/**
 * Define available actions in the system
 */
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Define resources (subjects) in the system
 */
export type Subjects =
  | 'InventoryItem'
  | 'Supplier'
  | 'StockTransaction'
  | 'Alert'
  | 'Restaurant'
  | 'AuditLog'
  | 'UserProfile'
  | 'Recipe'
  | 'Sale'
  | 'all';

/**
 * Application-wide ability type
 */
export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Define abilities based on user role and context
 *
 * @param user - The authenticated user (null for unauthenticated)
 * @returns AppAbility - CASL ability instance with defined permissions
 *
 * @example
 * ```typescript
 * const ability = defineAbilitiesFor(user);
 *
 * if (ability.can('delete', 'InventoryItem')) {
 *   // User can delete inventory items
 * }
 * ```
 */
export function defineAbilitiesFor(user: User | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user) {
    // Unauthenticated users have no permissions
    return build();
  }

  if (user.role === 'manager') {
    // Managers have full control over their restaurant's data
    can('manage', 'all');

    // However, audit logs are read-only (system-managed)
    cannot('create', 'AuditLog');
    cannot('update', 'AuditLog');
    cannot('delete', 'AuditLog');

    // Managers can manage users in their restaurant
    can(['create', 'read', 'update', 'delete'], 'UserProfile');

    // Managers can only access data from their own restaurant
    // This is enforced at the RLS level as well
  }

  if (user.role === 'staff') {
    // Staff can read most resources from their restaurant
    can('read', ['InventoryItem', 'Supplier', 'Alert', 'StockTransaction']);

    // Can create and update inventory items (but not delete)
    can(['create', 'update'], 'InventoryItem');

    // Can create stock transactions (moving stock in/out)
    can('create', 'StockTransaction');

    // Can update stock transactions (with time and field restrictions)
    can('update', 'StockTransaction');

    // Can mark alerts as read
    can('update', 'Alert', ['is_read']);

    // Cannot delete inventory items (only managers)
    cannot('delete', 'InventoryItem');

    // Cannot manage suppliers (manager-only)
    cannot(['create', 'update', 'delete'], 'Supplier');

    // Cannot access audit logs
    cannot('read', 'AuditLog');
    cannot(['create', 'update', 'delete'], 'AuditLog');

    // Cannot modify restaurant settings
    cannot(['create', 'update', 'delete'], 'Restaurant');

    // Cannot manage other user profiles
    cannot(['create', 'update', 'delete'], 'UserProfile');

    // Recipe permissions for staff
    can(['read', 'create', 'update'], 'Recipe');
    cannot('delete', 'Recipe');

    // Sale permissions for staff
    can(['read', 'create', 'update'], 'Sale');
    cannot('delete', 'Sale');
  }

  return build();
}

/**
 * Field-level permission checks for partial updates
 * Prevents staff from modifying sensitive fields
 *
 * @param user - The authenticated user
 * @param subject - The resource type being updated
 * @param fields - Array of field names being updated
 * @returns boolean - Whether the user can update these specific fields
 *
 * @example
 * ```typescript
 * const updates = { name: 'New Name', cost_per_unit: 10 };
 * const canUpdate = canUpdateFields(user, 'InventoryItem', Object.keys(updates));
 *
 * if (!canUpdate) {
 *   throw new Error('You cannot update pricing fields');
 * }
 * ```
 */
export function canUpdateFields(
  user: User | null,
  subject: 'InventoryItem' | 'StockTransaction' | 'Alert',
  fields: string[]
): boolean {
  if (!user) return false;

  // Managers can update any field
  if (user.role === 'manager') return true;

  if (user.role === 'staff') {
    // Staff cannot update pricing or supplier fields on inventory items
    if (subject === 'InventoryItem') {
      const restrictedFields = ['cost_per_unit', 'supplier_id', 'restaurant_id'];
      const hasRestrictedFields = fields.some(f => restrictedFields.includes(f));
      return !hasRestrictedFields;
    }

    // Staff can only update certain fields on stock transactions
    if (subject === 'StockTransaction') {
      const allowedFields = ['quantity', 'notes', 'reason'];
      const allFieldsAllowed = fields.every(f => allowedFields.includes(f));
      return allFieldsAllowed;
    }

    // Staff can only update is_read field on alerts
    if (subject === 'Alert') {
      const allowedFields = ['is_read'];
      const allFieldsAllowed = fields.every(f => allowedFields.includes(f));
      return allFieldsAllowed;
    }
  }

  return false;
}

/**
 * Time-based permission check for updating stock transactions
 * Staff can only update recent transactions (within 24 hours)
 *
 * @param user - The authenticated user
 * @param transactionDate - The created_at date of the transaction
 * @returns boolean - Whether the user can update this transaction based on time
 *
 * @example
 * ```typescript
 * const canUpdate = canUpdateTransaction(user, transaction.created_at);
 *
 * if (!canUpdate) {
 *   throw new Error('Cannot update transactions older than 24 hours');
 * }
 * ```
 */
export function canUpdateTransaction(
  user: User | null,
  transactionDate: string
): boolean {
  if (!user) return false;

  // Managers can update any transaction
  if (user.role === 'manager') return true;

  // Staff can only update transactions created in the last 24 hours
  if (user.role === 'staff') {
    const transactionTime = new Date(transactionDate).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (now - transactionTime) <= twentyFourHours;
  }

  return false;
}

/**
 * Check if user can access resources from a specific restaurant
 * Provides an additional layer of restaurant isolation beyond RLS
 *
 * @param user - The authenticated user
 * @param resourceRestaurantId - The restaurant_id of the resource being accessed
 * @returns boolean - Whether the user can access this restaurant's data
 */
export function canAccessRestaurant(
  user: User | null,
  resourceRestaurantId: string
): boolean {
  if (!user) return false;
  return user.restaurant_id === resourceRestaurantId;
}

/**
 * Permission error messages for better UX
 */
export const PERMISSION_ERRORS = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  MANAGER_ONLY: 'Only managers can perform this action',
  RESTRICTED_FIELDS: 'You cannot update these fields. Contact your manager.',
  TRANSACTION_TOO_OLD: 'Cannot update transactions older than 24 hours. Contact your manager.',
  WRONG_RESTAURANT: 'You can only access data from your own restaurant',
  AUDIT_LOG_READONLY: 'Audit logs are read-only and system-managed',
} as const;
