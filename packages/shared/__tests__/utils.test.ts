import {
  calculateStockBalance,
  isLowStock,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../utils';
import type { InventoryItem, StockTransaction } from '../types';

describe('Utils', () => {
  describe('calculateStockBalance', () => {
    const mockItem: InventoryItem = {
      id: '1',
      name: 'Test Item',
      category: 'Test',
      unit: 'kg',
      cost_per_unit: 10,
      current_stock: 0,
      min_threshold: 5,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    it('should calculate correct balance with stock in transactions', () => {
      const transactions: StockTransaction[] = [
        {
          id: '1',
          item_id: '1',
          type: 'in',
          quantity: 10,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
        },
        {
          id: '2',
          item_id: '1',
          type: 'in',
          quantity: 5,
          reason: 'delivery',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-02',
        },
      ];

      const balance = calculateStockBalance(mockItem, transactions);
      expect(balance).toBe(15);
    });

    it('should calculate correct balance with stock out transactions', () => {
      const transactions: StockTransaction[] = [
        {
          id: '1',
          item_id: '1',
          type: 'in',
          quantity: 20,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
        },
        {
          id: '2',
          item_id: '1',
          type: 'out',
          quantity: 8,
          reason: 'sale',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-02',
        },
      ];

      const balance = calculateStockBalance(mockItem, transactions);
      expect(balance).toBe(12);
    });

    it('should return 0 for items with no transactions', () => {
      const balance = calculateStockBalance(mockItem, []);
      expect(balance).toBe(0);
    });

    it('should ignore transactions for other items', () => {
      const transactions: StockTransaction[] = [
        {
          id: '1',
          item_id: '2', // Different item
          type: 'in',
          quantity: 100,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
        },
        {
          id: '2',
          item_id: '1',
          type: 'in',
          quantity: 5,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-02',
        },
      ];

      const balance = calculateStockBalance(mockItem, transactions);
      expect(balance).toBe(5);
    });
  });

  describe('isLowStock', () => {
    it('should return true when current stock is below threshold', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'Test Item',
        category: 'Test',
        unit: 'kg',
        cost_per_unit: 10,
        current_stock: 3,
        min_threshold: 5,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      expect(isLowStock(item)).toBe(true);
    });

    it('should return true when current stock equals threshold', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'Test Item',
        category: 'Test',
        unit: 'kg',
        cost_per_unit: 10,
        current_stock: 5,
        min_threshold: 5,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      expect(isLowStock(item)).toBe(true);
    });

    it('should return false when current stock is above threshold', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'Test Item',
        category: 'Test',
        unit: 'kg',
        cost_per_unit: 10,
        current_stock: 10,
        min_threshold: 5,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      expect(isLowStock(item)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-50.75)).toBe('-$50.75');
    });

    it('should handle very small amounts', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
    });
  });

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Dec 25, 2023/);
    });

    it('should format date strings correctly', () => {
      const formatted = formatDate('2023-06-15T14:30:00Z');
      expect(formatted).toMatch(/Jun 15, 2023/);
    });
  });

  describe('formatDateTime', () => {
    it('should format Date objects with time correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Dec 25, 2023/);
      expect(formatted).toMatch(/AM|PM/);
    });

    it('should format date strings with time correctly', () => {
      const formatted = formatDateTime('2023-06-15T14:30:00Z');
      expect(formatted).toMatch(/Jun 15, 2023/);
      expect(formatted).toMatch(/AM|PM/);
    });
  });
});