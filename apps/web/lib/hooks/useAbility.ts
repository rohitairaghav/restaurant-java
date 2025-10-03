import { useAuthStore } from '../stores/auth';
import type { AppAbility, Actions, Subjects } from '@restaurant-inventory/shared';

/**
 * Custom hook to access CASL abilities in React components
 *
 * @returns AppAbility - The current user's ability instance
 *
 * @example
 * ```typescript
 * function InventoryActions({ item }: { item: InventoryItem }) {
 *   const ability = useAbility();
 *
 *   if (!ability.can('delete', 'InventoryItem')) {
 *     return null; // Hide delete button
 *   }
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export function useAbility(): AppAbility {
  return useAuthStore((state) => state.ability);
}

/**
 * Custom hook to check a specific permission
 *
 * @param action - The action to check (create, read, update, delete, manage)
 * @param subject - The subject/resource to check permission for
 * @returns boolean - Whether the user has the permission
 *
 * @example
 * ```typescript
 * function DeleteButton({ item }: { item: InventoryItem }) {
 *   const canDelete = useCan('delete', 'InventoryItem');
 *
 *   if (!canDelete) return null;
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export function useCan(action: Actions, subject: Subjects): boolean {
  const ability = useAbility();
  return ability.can(action, subject);
}

/**
 * Custom hook to check if user cannot perform an action
 *
 * @param action - The action to check
 * @param subject - The subject/resource to check permission for
 * @returns boolean - Whether the user cannot perform the action
 *
 * @example
 * ```typescript
 * function EditForm() {
 *   const cannotUpdatePricing = useCannot('update', 'InventoryItem');
 *
 *   return (
 *     <input
 *       type="number"
 *       disabled={cannotUpdatePricing}
 *       placeholder="Price"
 *     />
 *   );
 * }
 * ```
 */
export function useCannot(action: Actions, subject: Subjects): boolean {
  const ability = useAbility();
  return ability.cannot(action, subject);
}

/**
 * Custom hook to get the current user from auth store
 *
 * @returns User | null - The authenticated user or null
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

/**
 * Custom hook to check if current user is a manager
 *
 * @returns boolean - Whether the user is a manager
 */
export function useIsManager(): boolean {
  const user = useCurrentUser();
  return user?.role === 'manager';
}

/**
 * Custom hook to check if current user is staff
 *
 * @returns boolean - Whether the user is staff
 */
export function useIsStaff(): boolean {
  const user = useCurrentUser();
  return user?.role === 'staff';
}
