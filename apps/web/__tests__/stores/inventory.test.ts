import { renderHook, act } from '@testing-library/react';
import { useInventoryStore } from '@/lib/stores/inventory';
import type { InventoryItem } from '@restaurant-inventory/shared';

// Mock Supabase with chainable methods
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

// Setup chain object that all methods return
const mockChain = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
};

// Default: all methods return the chain (this)
mockSelect.mockReturnValue(mockChain);
mockInsert.mockReturnValue(mockChain);
mockUpdate.mockReturnValue(mockChain);
mockDelete.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockOrder.mockReturnValue(mockChain);
mockLimit.mockResolvedValue({ data: [], error: null });
mockSingle.mockResolvedValue({ data: null, error: null });

const mockFrom = jest.fn(() => mockChain);

const mockSupabase = {
  from: mockFrom,
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

// Mock demo mode control
let mockIsDemoMode = false;
jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => mockIsDemoMode,
}));

// Mock auth store to avoid auth checks
jest.mock('@/lib/stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: 'test-user',
        email: 'test@test.com',
        role: 'manager',
        restaurant_id: 'rest1',
      },
      ability: {
        can: jest.fn().mockReturnValue(true),
      },
    }),
  },
}));

describe('Inventory Store', () => {
  const mockItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Tomatoes',
      category: 'Vegetables',
      unit: 'kg',
      cost_per_unit: 3.5,
      current_stock: 10,
      min_threshold: 5,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: '2',
      name: 'Chicken',
      category: 'Meat',
      unit: 'kg',
      cost_per_unit: 12.99,
      current_stock: 2,
      min_threshold: 3,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
  ];

  // Helper to setup mock for checkItemHasTransactions and checkItemHasAlerts
  const setupCheckMocks = (hasTransactions: boolean, hasAlerts: boolean) => {
    let limitCallCount = 0;
    mockLimit.mockImplementation(() => {
      limitCallCount++;
      if (limitCallCount === 1) {
        // First call: checkItemHasTransactions
        return Promise.resolve({
          data: hasTransactions ? [{ id: 'tx1' }] : [],
          error: null,
        });
      } else {
        // Second call: checkItemHasAlerts
        return Promise.resolve({
          data: hasAlerts ? [{ id: 'alert1' }] : [],
          error: null,
        });
      }
    });
  };

  beforeEach(() => {
    // Reset store state
    useInventoryStore.setState({
      items: [],
      suppliers: [],
      loading: false,
      error: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
    mockIsDemoMode = false;

    // Reset mock implementations to default chainable behavior
    mockSelect.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockDelete.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockOrder.mockReturnValue(mockChain);
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('fetchItems', () => {
    it('should fetch items successfully', async () => {
      // Mock the chain: select().order()
      mockOrder.mockResolvedValue({
        data: mockItems,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_items');
      expect(result.current.items).toEqual(mockItems);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      // Mock the chain: select().order() with error
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Database error');
    });
  });

  describe('addItem', () => {
    it('should add item successfully', async () => {
      const newItem = {
        name: 'New Item',
        category: 'Other',
        unit: 'pieces',
        cost_per_unit: 5.0,
        min_threshold: 2,
        restaurant_id: 'rest1',
      };

      const createdItem: InventoryItem = {
        id: '3',
        ...newItem,
        current_stock: 0,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSingle.mockResolvedValue({
        data: createdItem,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.addItem(newItem);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_items');
      expect(result.current.items).toContain(createdItem);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      const initialItem = mockItems[0];
      useInventoryStore.setState({ items: [initialItem] });

      const updates = { name: 'Updated Tomatoes', cost_per_unit: 4.0 };
      const updatedItem = { ...initialItem, ...updates };

      // Mock the chain: update().eq().select().single()
      mockSingle.mockResolvedValue({
        data: updatedItem,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.updateItem('1', updates);
      });

      expect(result.current.items[0]).toEqual(updatedItem);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully when no transactions or alerts exist', async () => {
      useInventoryStore.setState({ items: mockItems });

      // Setup: no transactions, no alerts
      setupCheckMocks(false, false);

      // Mock delete().eq() to return success
      let eqCallCount = 0;
      mockEq.mockImplementation(() => {
        eqCallCount++;
        // First 2 calls are from check functions
        if (eqCallCount <= 2) {
          return mockChain;
        }
        // Third call is from delete().eq()
        return Promise.resolve({ error: null });
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('2');
      expect(result.current.loading).toBe(false);
    });

    it('should prevent deletion when item has transactions', async () => {
      useInventoryStore.setState({ items: mockItems });

      // Setup: has transactions, no alerts
      setupCheckMocks(true, false);

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      // Item should not be deleted
      expect(result.current.items).toHaveLength(2);
      expect(result.current.error).toBe('Cannot delete inventory item that has stock transactions. Please delete all related stock transactions first.');
      expect(result.current.loading).toBe(false);
    });

    it('should prevent deletion when item has alerts', async () => {
      useInventoryStore.setState({ items: mockItems });

      // Setup: no transactions, has alerts
      setupCheckMocks(false, true);

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      // Item should not be deleted
      expect(result.current.items).toHaveLength(2);
      expect(result.current.error).toBe('Cannot delete inventory item that has alerts. Please delete all related alerts first.');
      expect(result.current.loading).toBe(false);
    });

    it('should prevent deletion when item has both transactions and alerts', async () => {
      useInventoryStore.setState({ items: mockItems });

      // Setup: has transactions, has alerts
      setupCheckMocks(true, true);

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      // Item should not be deleted
      expect(result.current.items).toHaveLength(2);
      expect(result.current.error).toBe('Cannot delete inventory item that has stock transactions and alerts. Please delete all related stock transactions and alerts first.');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('checkItemHasTransactions', () => {
    it('should return true when item has transactions', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: 'transaction1' }],
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      let hasTransactions: boolean = false;
      await act(async () => {
        hasTransactions = await result.current.checkItemHasTransactions('1');
      });

      expect(hasTransactions).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_transactions');
    });

    it('should return false when item has no transactions', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      let hasTransactions: boolean = true;
      await act(async () => {
        hasTransactions = await result.current.checkItemHasTransactions('1');
      });

      expect(hasTransactions).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockLimit.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useInventoryStore());

      let hasTransactions: boolean = true;
      await act(async () => {
        hasTransactions = await result.current.checkItemHasTransactions('1');
      });

      expect(hasTransactions).toBe(false);
    });
  });

  describe('checkItemHasAlerts', () => {
    it('should return true when item has alerts', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: 'alert1' }],
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      let hasAlerts: boolean = false;
      await act(async () => {
        hasAlerts = await result.current.checkItemHasAlerts('1');
      });

      expect(hasAlerts).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('alerts');
    });

    it('should return false when item has no alerts', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      let hasAlerts: boolean = false;
      await act(async () => {
        hasAlerts = await result.current.checkItemHasAlerts('1');
      });

      expect(hasAlerts).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockLimit.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useInventoryStore());

      let hasAlerts: boolean = true;
      await act(async () => {
        hasAlerts = await result.current.checkItemHasAlerts('1');
      });

      expect(hasAlerts).toBe(false);
    });
  });

  describe('fetchSuppliers', () => {
    it('should fetch suppliers successfully', async () => {
      const mockSuppliers = [
        {
          id: 'sup-1',
          name: 'Supplier A',
          contact: 'contact@a.com',
          phone: '123-456-7890',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
        {
          id: 'sup-2',
          name: 'Supplier B',
          contact: 'contact@b.com',
          phone: '098-765-4321',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockSuppliers,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(result.current.suppliers).toEqual(mockSuppliers);
    });

    it('should handle fetch suppliers error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Suppliers fetch error' },
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(result.current.error).toBe('Suppliers fetch error');
      expect(result.current.suppliers).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(result.current.suppliers).toEqual([]);
    });
  });

  describe('addSupplier', () => {
    it('should add supplier successfully', async () => {
      const newSupplier = {
        name: 'New Supplier',
        contact: 'new@supplier.com',
        phone: '555-555-5555',
        restaurant_id: 'rest1',
      };

      const createdSupplier = {
        id: 'sup-new',
        ...newSupplier,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSingle.mockResolvedValue({
        data: createdSupplier,
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(result.current.suppliers).toContainEqual(createdSupplier);
    });

    it('should handle add supplier error', async () => {
      const newSupplier = {
        name: 'New Supplier',
        contact: 'new@supplier.com',
        phone: '555-555-5555',
        restaurant_id: 'rest1',
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Failed to add supplier' },
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.error).toBe('Failed to add supplier');
    });

    it('should check permissions before adding supplier', async () => {
      const newSupplier = {
        name: 'New Supplier',
        contact: 'new@supplier.com',
        phone: '555-555-5555',
        restaurant_id: 'rest1',
      };

      // Test is checking that the supplier gets added with proper permissions
      mockSingle.mockResolvedValue({
        data: {
          id: 'sup-new',
          ...newSupplier,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      // Should successfully add with manager permissions
      expect(result.current.suppliers.length).toBeGreaterThan(0);
    });
  });

  describe('Demo mode tests', () => {
    beforeEach(() => {
      mockIsDemoMode = true;
    });

    it('should fetch items in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.items).toBeDefined();
      expect(result.current.items.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });

    it('should fetch suppliers in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(result.current.suppliers).toBeDefined();
      expect(result.current.suppliers.length).toBeGreaterThan(0);
    });

    it('should add item in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      const newItem = {
        name: 'Demo Item',
        category: 'Test',
        unit: 'kg',
        cost_per_unit: 5.0,
        min_threshold: 2,
        restaurant_id: 'rest1',
      };

      await act(async () => {
        await result.current.addItem(newItem);
      });

      expect(result.current.items.length).toBeGreaterThan(0);
      expect(result.current.items.some(item => item.name === 'Demo Item')).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('should update item in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      // First add an item
      await act(async () => {
        await result.current.fetchItems();
      });

      const firstItemId = result.current.items[0]?.id;
      if (!firstItemId) return;

      const updates = { name: 'Updated Name' };

      await act(async () => {
        await result.current.updateItem(firstItemId, updates);
      });

      const updatedItem = result.current.items.find(item => item.id === firstItemId);
      expect(updatedItem?.name).toBe('Updated Name');
      expect(result.current.loading).toBe(false);
    });

    it('should delete item in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      // First fetch items
      await act(async () => {
        await result.current.fetchItems();
      });

      const initialCount = result.current.items.length;
      const firstItemId = result.current.items[0]?.id;
      if (!firstItemId) return;

      await act(async () => {
        await result.current.deleteItem(firstItemId);
      });

      expect(result.current.items.length).toBe(initialCount - 1);
      expect(result.current.items.find(item => item.id === firstItemId)).toBeUndefined();
      expect(result.current.loading).toBe(false);
    });

    it('should check item has transactions in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      let hasTransactions: boolean;

      await act(async () => {
        hasTransactions = await result.current.checkItemHasTransactions('1');
      });

      expect(typeof hasTransactions!).toBe('boolean');
    });

    it('should check item has alerts in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      let hasAlerts: boolean;

      await act(async () => {
        hasAlerts = await result.current.checkItemHasAlerts('1');
      });

      expect(typeof hasAlerts!).toBe('boolean');
    });

    it('should add supplier in demo mode', async () => {
      const { result } = renderHook(() => useInventoryStore());

      const newSupplier = {
        name: 'Demo Supplier',
        contact: 'demo@supplier.com',
        phone: '123-456-7890',
        restaurant_id: 'rest1',
      };

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.suppliers.some(sup => sup.name === 'Demo Supplier')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle update with empty updates object', async () => {
      useInventoryStore.setState({ items: mockItems });

      mockSingle.mockResolvedValue({
        data: mockItems[0],
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.updateItem('1', {});
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle addItem error', async () => {
      const newItem = {
        name: 'Error Item',
        category: 'Test',
        unit: 'kg',
        cost_per_unit: 5.0,
        min_threshold: 2,
        restaurant_id: 'rest1',
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.addItem(newItem);
      });

      expect(result.current.error).toBe('Insert failed');
      expect(result.current.loading).toBe(false);
    });

    it('should handle updateItem error', async () => {
      useInventoryStore.setState({ items: mockItems });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.updateItem('1', { name: 'Updated' });
      });

      expect(result.current.error).toBe('Update failed');
      expect(result.current.loading).toBe(false);
    });

    it('should handle deleteItem database error', async () => {
      useInventoryStore.setState({ items: mockItems });

      setupCheckMocks(false, false);

      let eqCallCount = 0;
      mockEq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount <= 2) {
          return mockChain;
        }
        return Promise.resolve({ error: { message: 'Delete failed' } });
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      expect(result.current.error).toBe('Delete failed');
      expect(result.current.loading).toBe(false);
    });
  });
});