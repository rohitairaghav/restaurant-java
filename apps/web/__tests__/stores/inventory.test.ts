import { renderHook, act } from '@testing-library/react';
import { useInventoryStore } from '@/lib/stores/inventory';
import type { InventoryItem } from '@restaurant-inventory/shared';

import { createClient } from '@/lib/supabase';

// Supabase is mocked globally in jest.setup.js
const mockSupabase = createClient() as any;

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
  });

  describe('fetchItems', () => {
    it('should fetch items successfully', async () => {
      mockSupabase.from().order.mockReturnThis();
      mockSupabase.from().single.mockResolvedValue({
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
      mockSupabase.from().order.mockReturnThis();
      mockSupabase.from().single.mockResolvedValue({
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

      mockSupabase.from().single.mockResolvedValue({
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

      mockSupabase.from().single.mockResolvedValue({
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
    it('should delete item successfully', async () => {
      useInventoryStore.setState({ items: mockItems });

      mockSupabase.from().eq.mockReturnThis();
      mockSupabase.from().single.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteItem('1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('2');
      expect(result.current.loading).toBe(false);
    });
  });
});