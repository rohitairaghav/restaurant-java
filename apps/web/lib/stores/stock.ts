import { create } from 'zustand';
import type { StockTransaction, StockTransactionInput, StockTransactionUpdate } from '@restaurant-inventory/shared';
import { canUpdateFields, canUpdateTransaction, PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { syncManager } from '../offline/sync';
import { isDemoMode } from '../demo-mode';
import { mockStockTransactions, mockInventoryItems, mockUsers } from '../mock-data';
import { useAuthStore } from './auth';

interface StockState {
  transactions: StockTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: StockTransactionInput) => Promise<void>;
  updateTransaction: (id: string, updates: StockTransactionUpdate) => Promise<void>;
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

        // Sort by created_at descending (latest first)
        const sortedTransactions = transactionsWithData.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        set({ transactions: sortedTransactions, loading: false });
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
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'StockTransaction')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

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

  updateTransaction: async (id: string, updates: StockTransactionUpdate) => {
    set({ loading: true, error: null });
    try {
      // Permission checks
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'StockTransaction')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      // Field-level permission check
      const updateFields = Object.keys(updates);
      if (!canUpdateFields(user, 'StockTransaction', updateFields)) {
        throw new Error(PERMISSION_ERRORS.RESTRICTED_FIELDS);
      }

      // Get the transaction to check time-based permissions
      const transaction = get().transactions.find(t => t.id === id);
      if (transaction && !canUpdateTransaction(user, transaction.created_at)) {
        throw new Error(PERMISSION_ERRORS.TRANSACTION_TOO_OLD);
      }

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

      // Validate inputs
      if (updates.quantity !== undefined && updates.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Use secure database function for atomic updates
      const { data, error } = await supabase.rpc('update_stock_transaction', {
        transaction_uuid: id,
        new_item_id: updates.item_id || null,
        new_type: updates.type || null,
        new_quantity: updates.quantity || null,
        new_cost: updates.cost || null,
        new_reason: updates.reason || null,
        new_sku: updates.sku || null,
        new_notes: updates.notes || null,
      });

      if (error) throw error;

      // Check the response from the function
      if (data && data.length > 0) {
        const result = data[0];
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      // Fetch the updated transaction
      const { data: updatedTransaction, error: fetchError } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          inventory_items(name, unit),
          user_profiles(email)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      set(state => ({
        transactions: state.transactions.map(t => (t.id === id ? updatedTransaction : t)),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));