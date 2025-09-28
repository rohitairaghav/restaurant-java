import Dexie, { Table } from 'dexie';
import type { InventoryItem, StockTransaction, Alert } from '@restaurant-inventory/shared';

export interface OfflineTransaction extends StockTransaction {
  synced?: boolean;
}

export class OfflineDatabase extends Dexie {
  inventoryItems!: Table<InventoryItem>;
  stockTransactions!: Table<OfflineTransaction>;
  alerts!: Table<Alert>;

  constructor() {
    super('RestaurantInventoryDB');

    this.version(1).stores({
      inventoryItems: 'id, name, category, restaurant_id, updated_at',
      stockTransactions: 'id, item_id, type, restaurant_id, created_at, synced',
      alerts: 'id, item_id, restaurant_id, is_read, created_at',
    });
  }
}

export const offlineDB = new OfflineDatabase();