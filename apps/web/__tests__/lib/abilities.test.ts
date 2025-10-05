import {
  defineAbilitiesFor,
  canUpdateFields,
  canUpdateTransaction,
  canAccessRestaurant,
  PERMISSION_ERRORS,
} from '@restaurant-inventory/shared';
import type { User } from '@restaurant-inventory/shared';

describe('CASL Abilities', () => {
  const mockManager: User = {
    id: 'manager-1',
    email: 'manager@test.com',
    role: 'manager',
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@test.com',
    role: 'staff',
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  describe('defineAbilitiesFor', () => {
    it('should grant no permissions for null user', () => {
      const ability = defineAbilitiesFor(null);

      expect(ability.can('read', 'InventoryItem')).toBe(false);
      expect(ability.can('create', 'InventoryItem')).toBe(false);
      expect(ability.can('update', 'InventoryItem')).toBe(false);
      expect(ability.can('delete', 'InventoryItem')).toBe(false);
    });

    it('should grant full permissions to manager', () => {
      const ability = defineAbilitiesFor(mockManager);

      expect(ability.can('create', 'InventoryItem')).toBe(true);
      expect(ability.can('read', 'InventoryItem')).toBe(true);
      expect(ability.can('update', 'InventoryItem')).toBe(true);
      expect(ability.can('delete', 'InventoryItem')).toBe(true);
      expect(ability.can('create', 'Supplier')).toBe(true);
      expect(ability.can('delete', 'Supplier')).toBe(true);
    });

    it('should restrict manager from modifying audit logs', () => {
      const ability = defineAbilitiesFor(mockManager);

      expect(ability.can('read', 'AuditLog')).toBe(true);
      expect(ability.can('create', 'AuditLog')).toBe(false);
      expect(ability.can('update', 'AuditLog')).toBe(false);
      expect(ability.can('delete', 'AuditLog')).toBe(false);
    });

    it('should grant limited permissions to staff', () => {
      const ability = defineAbilitiesFor(mockStaff);

      // Can read
      expect(ability.can('read', 'InventoryItem')).toBe(true);
      expect(ability.can('read', 'Supplier')).toBe(true);
      expect(ability.can('read', 'StockTransaction')).toBe(true);

      // Can create/update inventory and transactions
      expect(ability.can('create', 'InventoryItem')).toBe(true);
      expect(ability.can('update', 'InventoryItem')).toBe(true);
      expect(ability.can('create', 'StockTransaction')).toBe(true);
      expect(ability.can('update', 'StockTransaction')).toBe(true);

      // Cannot delete inventory
      expect(ability.can('delete', 'InventoryItem')).toBe(false);

      // Cannot manage suppliers
      expect(ability.can('create', 'Supplier')).toBe(false);
      expect(ability.can('update', 'Supplier')).toBe(false);
      expect(ability.can('delete', 'Supplier')).toBe(false);

      // Cannot access audit logs
      expect(ability.can('read', 'AuditLog')).toBe(false);
    });
  });

  describe('canUpdateFields', () => {
    it('should allow manager to update any fields', () => {
      expect(canUpdateFields(mockManager, 'InventoryItem', ['name', 'cost_per_unit', 'supplier_id'])).toBe(true);
      expect(canUpdateFields(mockManager, 'StockTransaction', ['quantity', 'notes', 'item_id'])).toBe(true);
    });

    it('should restrict staff from updating pricing fields on inventory', () => {
      expect(canUpdateFields(mockStaff, 'InventoryItem', ['name', 'category'])).toBe(true);
      expect(canUpdateFields(mockStaff, 'InventoryItem', ['cost_per_unit'])).toBe(false);
      expect(canUpdateFields(mockStaff, 'InventoryItem', ['supplier_id'])).toBe(false);
      expect(canUpdateFields(mockStaff, 'InventoryItem', ['name', 'cost_per_unit'])).toBe(false);
    });

    it('should restrict staff to specific fields on stock transactions', () => {
      expect(canUpdateFields(mockStaff, 'StockTransaction', ['quantity', 'notes'])).toBe(true);
      expect(canUpdateFields(mockStaff, 'StockTransaction', ['item_id'])).toBe(false);
      expect(canUpdateFields(mockStaff, 'StockTransaction', ['quantity', 'item_id'])).toBe(false);
    });

    it('should restrict staff to is_read field on alerts', () => {
      expect(canUpdateFields(mockStaff, 'Alert', ['is_read'])).toBe(true);
      expect(canUpdateFields(mockStaff, 'Alert', ['message'])).toBe(false);
      expect(canUpdateFields(mockStaff, 'Alert', ['type'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canUpdateFields(null, 'InventoryItem', ['name'])).toBe(false);
    });
  });

  describe('canUpdateTransaction', () => {
    it('should allow manager to update any transaction', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago

      expect(canUpdateTransaction(mockManager, oldDate)).toBe(true);
      expect(canUpdateTransaction(mockManager, recentDate)).toBe(true);
    });

    it('should restrict staff to transactions within 24 hours', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago

      expect(canUpdateTransaction(mockStaff, oldDate)).toBe(false);
      expect(canUpdateTransaction(mockStaff, recentDate)).toBe(true);
    });

    it('should return false for null user', () => {
      const recentDate = new Date().toISOString();
      expect(canUpdateTransaction(null, recentDate)).toBe(false);
    });
  });

  describe('canAccessRestaurant', () => {
    it('should allow access to own restaurant', () => {
      expect(canAccessRestaurant(mockManager, 'rest-1')).toBe(true);
      expect(canAccessRestaurant(mockStaff, 'rest-1')).toBe(true);
    });

    it('should deny access to other restaurant', () => {
      expect(canAccessRestaurant(mockManager, 'rest-2')).toBe(false);
      expect(canAccessRestaurant(mockStaff, 'rest-2')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canAccessRestaurant(null, 'rest-1')).toBe(false);
    });
  });

  describe('PERMISSION_ERRORS', () => {
    it('should have defined error messages', () => {
      expect(PERMISSION_ERRORS.UNAUTHORIZED).toBeDefined();
      expect(PERMISSION_ERRORS.FORBIDDEN).toBeDefined();
      expect(PERMISSION_ERRORS.MANAGER_ONLY).toBeDefined();
      expect(PERMISSION_ERRORS.RESTRICTED_FIELDS).toBeDefined();
      expect(PERMISSION_ERRORS.TRANSACTION_TOO_OLD).toBeDefined();
      expect(PERMISSION_ERRORS.WRONG_RESTAURANT).toBeDefined();
      expect(PERMISSION_ERRORS.AUDIT_LOG_READONLY).toBeDefined();
    });
  });
});
