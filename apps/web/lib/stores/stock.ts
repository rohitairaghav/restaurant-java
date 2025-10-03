import { create } from 'zustand';
import type { StockTransaction, StockTransactionInput, StockTransactionUpdate } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { syncManager } from '../offline/sync';
import { isDemoMode } from '../demo-mode';
import { mockStockTransactions, mockInventoryItems, mockUsers } from '../mock-data';

interface StockState {
  transactions: StockTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: StockTransactionInput) => Promise<void>;
  updateTransaction: (id: string, updates: StockTransactionUpdate, oldQuantity: number) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Transform mock data to include relationships
        const transactionsWithData = mockStockTransactions.map(transaction => {
          const item = mockInventoryItems.find(i => i.id === transaction.item_id);
          const user = mockUsers.find(u => u.id === transaction.user_id);

          return {
            ...transaction,
            inventory_items: { name: item?.name || 'Unknown', unit: item?.unit || 'units' },
            user_profiles: { email: user?.email || 'Unknown' }
          };
        });

        set({ transactions: transactionsWithData, loading: false });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          inventory_items(name, unit),
          user_profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      set({ transactions: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTransaction: async (transaction: StockTransactionInput) => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Demo mode: create mock transaction
        await new Promise(resolve => setTimeout(resolve, 500));

        const item = mockInventoryItems.find(i => i.id === transaction.item_id);
        const user = mockUsers.find(u => u.id === transaction.user_id);

        const mockTransaction = {
          ...transaction,
          id: `demo_${Date.now()}`,
          created_at: new Date().toISOString(),
          inventory_items: { name: item?.name || 'Unknown', unit: item?.unit || 'units' },
          user_profiles: { email: user?.email || 'Unknown' }
        };

        set(state => ({
          transactions: [mockTransaction as any, ...state.transactions],
          loading: false
        }));
        return;
      }

      const isOnline = await syncManager.isOnline();

      if (isOnline) {
        // Online: add to Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from('stock_transactions')
          .insert(transaction)
          .select(`
            *,
            inventory_items(name, unit),
            user_profiles(email)
          `)
          .single();

        if (error) throw error;

        set(state => ({
          transactions: [data, ...state.transactions],
          loading: false
        }));
      } else {
        // Offline: store locally
        await syncManager.addOfflineTransaction(transaction);

        // Create a mock transaction for UI
        const mockTransaction = {
          ...transaction,
          id: `offline_${Date.now()}`,
          created_at: new Date().toISOString(),
          inventory_items: { name: 'Unknown', unit: 'units' },
          user_profiles: { email: 'You (offline)' }
        };

        set(state => ({
          transactions: [mockTransaction as any, ...state.transactions],
          loading: false
        }));
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateTransaction: async (id: string, updates: StockTransactionUpdate, oldQuantity: number) => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Demo mode: update mock transaction
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => ({
          transactions: state.transactions.map(t =>
            t.id === id
              ? { ...t, ...updates, updated_at: new Date().toISOString() }
              : t
          ),
          loading: false
        }));
        return;
      }

      const supabase = createClient();

      // If quantity changed, we need to adjust inventory stock
      if (updates.quantity !== undefined) {
        const transaction = get().transactions.find(t => t.id === id);
        if (transaction) {
          // Calculate the difference in quantity
          const quantityDiff = updates.quantity - oldQuantity;

          // Get current stock
          const { data: item } = await supabase
            .from('inventory_items')
            .select('current_stock')
            .eq('id', transaction.item_id)
            .single();

          if (item) {
            // Adjust stock based on transaction type and quantity difference
            const stockAdjustment = transaction.type === 'in' ? quantityDiff : -quantityDiff;
            const newStock = item.current_stock + stockAdjustment;

            // Update inventory stock
            await supabase
              .from('inventory_items')
              .update({ current_stock: newStock })
              .eq('id', transaction.item_id);
          }
        }
      }

      // Update the transaction
      const { data, error } = await supabase
        .from('stock_transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          inventory_items(name, unit),
          user_profiles(email)
        `)
        .single();

      if (error) throw error;

      set(state => ({
        transactions: state.transactions.map(t => (t.id === id ? data : t)),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));