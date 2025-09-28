import { create } from 'zustand';
import type { AnalyticsData } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { isDemoMode } from '../demo-mode';
import { mockInventoryItems, mockStockTransactions } from '../mock-data';

interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAnalytics: (period: 'daily' | 'weekly') => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchAnalytics: async (period: 'daily' | 'weekly') => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Calculate inventory value from mock data
        const inventoryValue = mockInventoryItems.reduce((total, item) => {
          return total + (item.current_stock * item.cost_per_unit);
        }, 0);

        // Count low stock items
        const lowStockCount = mockInventoryItems.filter(
          item => item.current_stock <= item.min_threshold
        ).length;

        // Generate mock usage data
        const usageData = period === 'daily'
          ? [
              {
                date: 'Today',
                items: [
                  { item_id: 'item-1', quantity: 4.5 },
                  { item_id: 'item-2', quantity: 7.0 }
                ]
              },
              {
                date: 'Yesterday',
                items: [
                  { item_id: 'item-3', quantity: 5.0 },
                  { item_id: 'item-6', quantity: 2.5 }
                ]
              }
            ]
          : [
              {
                week: 'This Week',
                items: [
                  { item_id: 'item-1', quantity: 15.0 },
                  { item_id: 'item-2', quantity: 25.0 }
                ]
              }
            ];

        const analyticsData: AnalyticsData = {
          daily_usage: period === 'daily' ? usageData : [],
          weekly_usage: period === 'weekly' ? usageData : [],
          inventory_value: inventoryValue,
          low_stock_count: lowStockCount,
        };

        set({ data: analyticsData, loading: false });
        return;
      }

      const supabase = createClient();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (period === 'daily') {
        startDate.setDate(endDate.getDate() - 7); // Last 7 days
      } else {
        startDate.setDate(endDate.getDate() - 30); // Last 30 days
      }

      // Fetch stock out transactions for usage analysis
      const { data: transactions, error: transactionsError } = await supabase
        .from('stock_transactions')
        .select(`
          created_at,
          quantity,
          item_id,
          inventory_items(name, unit)
        `)
        .eq('type', 'out')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (transactionsError) throw transactionsError;

      // Fetch current inventory value
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('current_stock, cost_per_unit');

      if (itemsError) throw itemsError;

      // Calculate inventory value
      const inventoryValue = items?.reduce((total, item) => {
        return total + (item.current_stock * item.cost_per_unit);
      }, 0) || 0;

      // Count low stock items
      const { count: lowStockCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .lte('current_stock', supabase.rpc('min_threshold'));

      // Process usage data
      const usageMap = new Map<string, Map<string, number>>();

      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const dateKey = period === 'daily'
          ? date.toDateString()
          : `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleString('default', { month: 'short' })}`;

        if (!usageMap.has(dateKey)) {
          usageMap.set(dateKey, new Map());
        }

        const itemMap = usageMap.get(dateKey)!;
        const currentQty = itemMap.get(transaction.item_id) || 0;
        itemMap.set(transaction.item_id, currentQty + transaction.quantity);
      });

      // Format usage data
      const usageArray = Array.from(usageMap.entries()).map(([dateKey, itemMap]) => ({
        [period === 'daily' ? 'date' : 'week']: dateKey,
        items: Array.from(itemMap.entries()).map(([item_id, quantity]) => ({
          item_id,
          quantity
        }))
      }));

      const analyticsData: AnalyticsData = {
        daily_usage: period === 'daily' ? usageArray : [],
        weekly_usage: period === 'weekly' ? usageArray : [],
        inventory_value: inventoryValue,
        low_stock_count: lowStockCount || 0,
      };

      set({ data: analyticsData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));