import { create } from 'zustand';
import type { InventoryItem, InventoryItemInput, Supplier } from '@restaurant-inventory/shared';

// Extended type for adding items with initial stock
type InventoryItemInputWithStock = InventoryItemInput & { current_stock: number };
import { canUpdateFields, canAccessRestaurant, PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { isDemoMode } from '../demo-mode';
import { mockInventoryItems, mockSuppliers } from '../mock-data';
import { useAuthStore } from './auth';

interface InventoryState {
  items: InventoryItem[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  addItem: (item: InventoryItemInputWithStock) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'>>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  checkItemHasTransactions: (id: string) => Promise<boolean>;
  checkItemHasAlerts: (id: string) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  suppliers: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ items: mockInventoryItems, loading: false });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, suppliers(name)')
        .order('name');

      if (error) throw error;
      set({ items: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSuppliers: async () => {
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        set({ suppliers: mockSuppliers });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ suppliers: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addItem: async (item: InventoryItemInputWithStock) => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create a new item with demo data
        const newItem = {
          ...item,
          id: `item-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Find supplier name for display
        const supplier = mockSuppliers.find(s => s.id === item.supplier_id);
        const itemWithSupplier = {
          ...newItem,
          suppliers: supplier ? { name: supplier.name } : null
        };

        set(state => ({
          items: [...state.items, itemWithSupplier],
          loading: false
        }));
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select('*, suppliers(name)')
        .single();

      if (error) throw error;

      set(state => ({
        items: [...state.items, data],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    set({ loading: true, error: null });
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'InventoryItem')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      // Field-level permission check
      const updateFields = Object.keys(updates);
      if (!canUpdateFields(user, 'InventoryItem', updateFields)) {
        throw new Error(PERMISSION_ERRORS.RESTRICTED_FIELDS);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => {
          const updatedItems = state.items.map(item => {
            if (item.id === id) {
              return { ...item, ...updates, updated_at: new Date().toISOString() };
            }
            return item;
          });

          return { items: updatedItems, loading: false };
        });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select('*, suppliers(name)')
        .single();

      if (error) throw error;

      set(state => ({
        items: state.items.map(item => item.id === id ? data : item),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteItem: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('delete', 'InventoryItem')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        set(state => ({
          items: state.items.filter(item => item.id !== id),
          loading: false
        }));
        return;
      }

      // Check if item has stock transactions or alerts before deletion
      const hasTransactions = await get().checkItemHasTransactions(id);
      const hasAlerts = await get().checkItemHasAlerts(id);
      
      if (hasTransactions && hasAlerts) {
        throw new Error('Cannot delete inventory item that has stock transactions and alerts. Please delete all related stock transactions and alerts first.');
      } else if (hasTransactions) {
        throw new Error('Cannot delete inventory item that has stock transactions. Please delete all related stock transactions first.');
      } else if (hasAlerts) {
        throw new Error('Cannot delete inventory item that has alerts. Please delete all related alerts first.');
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  checkItemHasTransactions: async (id: string) => {
    try {
      if (isDemoMode()) {
        // In demo mode, simulate some items having transactions
        const mockTransactions = [
          { item_id: '1' },
          { item_id: '2' }
        ];
        return mockTransactions.some(t => t.item_id === id);
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('stock_transactions')
        .select('id')
        .eq('item_id', id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking transactions:', error);
      return false;
    }
  },

  checkItemHasAlerts: async (id: string) => {
    try {
      if (isDemoMode()) {
        // In demo mode, simulate some items having alerts
        const mockAlerts = [
          { item_id: '1' },
          { item_id: '3' }
        ];
        return mockAlerts.some(a => a.item_id === id);
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('alerts')
        .select('id')
        .eq('item_id', id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking alerts:', error);
      return false;
    }
  },

  addSupplier: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'Supplier')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const newSupplier = {
          ...supplier,
          id: `supplier-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set(state => ({
          suppliers: [...state.suppliers, newSupplier]
        }));
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        suppliers: [...state.suppliers, data]
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateSupplier: async (id: string, updates: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'>>) => {
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'Supplier')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        set(state => ({
          suppliers: state.suppliers.map(supplier =>
            supplier.id === id
              ? { ...supplier, ...updates, updated_at: new Date().toISOString() }
              : supplier
          )
        }));
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        suppliers: state.suppliers.map(supplier =>
          supplier.id === id ? data : supplier
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteSupplier: async (id: string) => {
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('delete', 'Supplier')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        set(state => ({
          suppliers: state.suppliers.filter(supplier => supplier.id !== id)
        }));
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        suppliers: state.suppliers.filter(supplier => supplier.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));