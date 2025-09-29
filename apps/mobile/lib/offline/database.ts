import type { InventoryItem, StockTransaction } from '@restaurant-inventory/shared';

export interface OfflineTransaction extends Omit<StockTransaction, 'id'> {
  id?: string;
  synced: boolean;
}

class OfflineDatabase {
  private initialized = false;

  constructor() {
    console.log('OfflineDatabase initialized in development mode');
  }

  async cacheInventoryItems(items: InventoryItem[]): Promise<void> {
    console.log('cacheInventoryItems called in development mode', items.length);
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    console.log('getInventoryItems called in development mode');
    return [];
  }

  async addOfflineTransaction(transaction: Omit<OfflineTransaction, 'id'>): Promise<void> {
    console.log('addOfflineTransaction called in development mode', transaction);
  }

  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    console.log('getUnsyncedTransactions called in development mode');
    return [];
  }

  async markTransactionSynced(id: string): Promise<void> {
    console.log('markTransactionSynced called in development mode', id);
  }
}

export const offlineDB = new OfflineDatabase();