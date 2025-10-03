// Mock the offline database
const mockOfflineDB = {
  stockTransactions: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
  },
  inventoryItems: {
    get: jest.fn(),
    update: jest.fn(),
    clear: jest.fn(),
    bulkAdd: jest.fn(),
    toArray: jest.fn(),
  },
};

jest.mock('@/lib/offline/database', () => ({
  offlineDB: mockOfflineDB,
}));

import { SyncManager } from '@/lib/offline/sync';
import { createClient } from '@/lib/supabase';

// Supabase is mocked globally in jest.setup.js
const mockSupabase = createClient() as any;

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    syncManager = SyncManager.getInstance();
    jest.clearAllMocks();
  });

  describe('addOfflineTransaction', () => {
    it('should add transaction to offline storage', async () => {
      const transaction = {
        item_id: '1',
        type: 'in' as const,
        quantity: 10,
        reason: 'purchase' as const,
        user_id: 'user1',
        restaurant_id: 'rest1',
      };

      const mockItem = {
        id: '1',
        current_stock: 5,
      };

      (mockOfflineDB.stockTransactions.add as jest.Mock).mockResolvedValue(undefined);
      (mockOfflineDB.inventoryItems.get as jest.Mock).mockResolvedValue(mockItem);
      (mockOfflineDB.inventoryItems.update as jest.Mock).mockResolvedValue(undefined);

      await syncManager.addOfflineTransaction(transaction);

      expect(mockOfflineDB.stockTransactions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...transaction,
          id: expect.stringContaining('offline_'),
          created_at: expect.any(String),
          synced: false,
        })
      );

      // Should update local inventory
      expect(mockOfflineDB.inventoryItems.update).toHaveBeenCalledWith('1', {
        current_stock: 15, // 5 + 10
        updated_at: expect.any(String),
      });
    });

    it('should handle stock out transactions', async () => {
      const transaction = {
        item_id: '1',
        type: 'out' as const,
        quantity: 3,
        reason: 'sale' as const,
        user_id: 'user1',
        restaurant_id: 'rest1',
      };

      const mockItem = {
        id: '1',
        current_stock: 10,
      };

      (mockOfflineDB.stockTransactions.add as jest.Mock).mockResolvedValue(undefined);
      (mockOfflineDB.inventoryItems.get as jest.Mock).mockResolvedValue(mockItem);
      (mockOfflineDB.inventoryItems.update as jest.Mock).mockResolvedValue(undefined);

      await syncManager.addOfflineTransaction(transaction);

      expect(mockOfflineDB.inventoryItems.update).toHaveBeenCalledWith('1', {
        current_stock: 7, // 10 - 3
        updated_at: expect.any(String),
      });
    });

    it('should not allow negative stock', async () => {
      const transaction = {
        item_id: '1',
        type: 'out' as const,
        quantity: 15,
        reason: 'sale' as const,
        user_id: 'user1',
        restaurant_id: 'rest1',
      };

      const mockItem = {
        id: '1',
        current_stock: 10,
      };

      (mockOfflineDB.stockTransactions.add as jest.Mock).mockResolvedValue(undefined);
      (mockOfflineDB.inventoryItems.get as jest.Mock).mockResolvedValue(mockItem);
      (mockOfflineDB.inventoryItems.update as jest.Mock).mockResolvedValue(undefined);

      await syncManager.addOfflineTransaction(transaction);

      expect(mockOfflineDB.inventoryItems.update).toHaveBeenCalledWith('1', {
        current_stock: 0, // Math.max(0, 10 - 15)
        updated_at: expect.any(String),
      });
    });
  });

  describe('syncOfflineData', () => {
    it('should sync unsynced transactions', async () => {
      const unsyncedTransactions = [
        {
          id: 'offline_1',
          item_id: '1',
          type: 'in',
          quantity: 5,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          synced: false,
        },
      ];

      (mockOfflineDB.stockTransactions.toArray as jest.Mock).mockResolvedValue(unsyncedTransactions);
      (mockSupabase.from().insert as jest.Mock).mockResolvedValue({ error: null });
      (mockOfflineDB.stockTransactions.update as jest.Mock).mockResolvedValue(undefined);

      await syncManager.syncOfflineData();

      expect(mockSupabase.from).toHaveBeenCalledWith('stock_transactions');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        item_id: '1',
        type: 'in',
        quantity: 5,
        reason: 'purchase',
        user_id: 'user1',
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
      });

      expect(mockOfflineDB.stockTransactions.update).toHaveBeenCalledWith('offline_1', { synced: true });
    });

    it('should handle sync errors gracefully', async () => {
      const unsyncedTransactions = [
        {
          id: 'offline_1',
          item_id: '1',
          type: 'in',
          quantity: 5,
          reason: 'purchase',
          user_id: 'user1',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          synced: false,
        },
      ];

      (mockOfflineDB.stockTransactions.toArray as jest.Mock).mockResolvedValue(unsyncedTransactions);
      (mockSupabase.from().insert as jest.Mock).mockResolvedValue({
        error: { message: 'Network error' }
      });

      // Should not throw, should handle error gracefully
      await expect(syncManager.syncOfflineData()).resolves.not.toThrow();

      // Should not mark as synced if error occurred
      expect(mockOfflineDB.stockTransactions.update).not.toHaveBeenCalled();
    });
  });

  describe('isOnline', () => {
    it('should return navigator online status', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const isOnline = await syncManager.isOnline();
      expect(isOnline).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const isOffline = await syncManager.isOnline();
      expect(isOffline).toBe(false);
    });
  });

  describe('cacheInventoryItems', () => {
    it('should cache inventory items locally', async () => {
      const items = [
        {
          id: '1',
          name: 'Test Item',
          category: 'Test',
          unit: 'kg',
          cost_per_unit: 10,
          current_stock: 5,
          min_threshold: 2,
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
      ];

      mockSupabase.from().select.mockResolvedValue({
        data: items,
        error: null,
      });

      (mockOfflineDB.inventoryItems.clear as jest.Mock).mockResolvedValue(undefined);
      (mockOfflineDB.inventoryItems.bulkAdd as jest.Mock).mockResolvedValue(undefined);

      await syncManager.cacheInventoryItems();

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_items');
      expect(mockOfflineDB.inventoryItems.clear).toHaveBeenCalled();
      expect(mockOfflineDB.inventoryItems.bulkAdd).toHaveBeenCalledWith(items);
    });

    it('should handle cache error', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(syncManager.cacheInventoryItems()).rejects.toEqual({
        message: 'Database error',
      });
    });
  });
});