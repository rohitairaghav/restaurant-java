export interface User {
  id: string;
  email: string;
  role: 'manager' | 'staff';
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_threshold: number;
  supplier_id?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out';
  quantity: number;
  cost?: number;
  reason: 'purchase' | 'delivery' | 'sale' | 'waste' | 'transfer';
  sku?: string;
  notes?: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  item_id: string;
  type: 'low_stock' | 'out_of_stock';
  message: string;
  is_read: boolean;
  restaurant_id: string;
  created_at: string;
}

export interface AnalyticsData {
  daily_usage: { date: string; items: { item_id: string; quantity: number }[] }[];
  weekly_usage: { week: string; items: { item_id: string; quantity: number }[] }[];
  inventory_value: number;
  low_stock_count: number;
}

export type StockTransactionInput = Omit<StockTransaction, 'id' | 'created_at' | 'updated_at'>;
export type StockTransactionUpdate = Partial<Omit<StockTransaction, 'id' | 'created_at' | 'updated_at' | 'restaurant_id' | 'user_id'>>;
export type InventoryItemInput = Omit<InventoryItem, 'id' | 'current_stock' | 'created_at' | 'updated_at'>;
export type SupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;