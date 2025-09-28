import { offlineDB } from './database';
import { createClient } from '../supabase';
import type { StockTransactionInput } from '@restaurant-inventory/shared';

export class SyncManager {
  private static instance: SyncManager;
  private syncInProgress = false;

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      await this.syncStockTransactions();
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncStockTransactions(): Promise<void> {
    const supabase = createClient();

    // Get unsynced transactions
    const unsyncedTransactions = await offlineDB.stockTransactions
      .where('synced')
      .equals(false)
      .toArray();

    for (const transaction of unsyncedTransactions) {
      try {
        // Remove local properties before syncing
        const { id, synced, ...transactionData } = transaction;

        const { error } = await supabase
          .from('stock_transactions')
          .insert(transactionData as StockTransactionInput);

        if (error) {
          console.error('Failed to sync transaction:', error);
          continue;
        }

        // Mark as synced
        await offlineDB.stockTransactions.update(transaction.id, { synced: true });
      } catch (error) {
        console.error('Error syncing transaction:', error);
      }
    }
  }

  async addOfflineTransaction(transaction: StockTransactionInput): Promise<void> {
    const offlineTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random()}`,
      created_at: new Date().toISOString(),
      synced: false,
    };

    await offlineDB.stockTransactions.add(offlineTransaction);

    // Update local inventory
    await this.updateLocalInventory(transaction.item_id, transaction.type, transaction.quantity);
  }

  private async updateLocalInventory(itemId: string, type: 'in' | 'out', quantity: number): Promise<void> {
    const item = await offlineDB.inventoryItems.get(itemId);
    if (item) {
      const newStock = type === 'in'
        ? item.current_stock + quantity
        : item.current_stock - quantity;

      await offlineDB.inventoryItems.update(itemId, {
        current_stock: Math.max(0, newStock),
        updated_at: new Date().toISOString(),
      });
    }
  }

  async cacheInventoryItems(): Promise<void> {
    const supabase = createClient();

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*');

    if (error) throw error;

    if (items) {
      await offlineDB.inventoryItems.clear();
      await offlineDB.inventoryItems.bulkAdd(items);
    }
  }

  async getOfflineInventoryItems() {
    return await offlineDB.inventoryItems.toArray();
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async setupOnlineListener(callback: () => void): Promise<void> {
    window.addEventListener('online', async () => {
      try {
        await this.syncOfflineData();
        callback();
      } catch (error) {
        console.error('Sync failed on reconnection:', error);
      }
    });
  }
}

export const syncManager = SyncManager.getInstance();