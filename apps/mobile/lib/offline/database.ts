import * as SQLite from 'expo-sqlite';
import type { InventoryItem, StockTransaction } from '@restaurant-inventory/shared';

export interface OfflineTransaction extends Omit<StockTransaction, 'id'> {
  id?: string;
  synced: boolean;
}

class OfflineDatabase {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabase('restaurant_inventory.db');
    this.initializeTables();
  }

  private initializeTables() {
    this.db.transaction(tx => {
      // Inventory items table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          cost_per_unit REAL NOT NULL,
          current_stock REAL DEFAULT 0,
          min_threshold REAL NOT NULL,
          supplier_id TEXT,
          restaurant_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Stock transactions table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS stock_transactions (
          id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('in', 'out')),
          quantity REAL NOT NULL,
          reason TEXT NOT NULL,
          notes TEXT,
          user_id TEXT NOT NULL,
          restaurant_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `);
    });
  }

  async cacheInventoryItems(items: InventoryItem[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          // Clear existing items
          tx.executeSql('DELETE FROM inventory_items;');

          // Insert new items
          items.forEach(item => {
            tx.executeSql(
              `INSERT INTO inventory_items
               (id, name, category, unit, cost_per_unit, current_stock, min_threshold, supplier_id, restaurant_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.id,
                item.name,
                item.category,
                item.unit,
                item.cost_per_unit,
                item.current_stock,
                item.min_threshold,
                item.supplier_id,
                item.restaurant_id,
                item.created_at,
                item.updated_at,
              ]
            );
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM inventory_items ORDER BY name',
          [],
          (_, { rows }) => {
            const items: InventoryItem[] = [];
            for (let i = 0; i < rows.length; i++) {
              items.push(rows.item(i));
            }
            resolve(items);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async addOfflineTransaction(transaction: Omit<OfflineTransaction, 'id'>): Promise<void> {
    const id = `offline_${Date.now()}_${Math.random()}`;

    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT INTO stock_transactions
             (id, item_id, type, quantity, reason, notes, user_id, restaurant_id, created_at, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              transaction.item_id,
              transaction.type,
              transaction.quantity,
              transaction.reason,
              transaction.notes || null,
              transaction.user_id,
              transaction.restaurant_id,
              transaction.created_at,
              0, // not synced
            ]
          );

          // Update local inventory
          const stockChange = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
          tx.executeSql(
            'UPDATE inventory_items SET current_stock = MAX(0, current_stock + ?) WHERE id = ?',
            [stockChange, transaction.item_id]
          );
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM stock_transactions WHERE synced = 0 ORDER BY created_at',
          [],
          (_, { rows }) => {
            const transactions: OfflineTransaction[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              transactions.push({
                ...row,
                synced: Boolean(row.synced),
              });
            }
            resolve(transactions);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async markTransactionSynced(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            'UPDATE stock_transactions SET synced = 1 WHERE id = ?',
            [id]
          );
        },
        error => reject(error),
        () => resolve()
      );
    });
  }
}

export const offlineDB = new OfflineDatabase();