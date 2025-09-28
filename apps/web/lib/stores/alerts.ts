import { create } from 'zustand';
import type { Alert } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { isDemoMode } from '../demo-mode';
import { mockAlerts, mockInventoryItems } from '../mock-data';

interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  fetchAlerts: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToAlerts: () => () => void; // Returns unsubscribe function
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchAlerts: async () => {
    set({ loading: true, error: null });
    try {
      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Transform mock data to include inventory item details
        const alertsWithData = mockAlerts.map(alert => {
          const item = mockInventoryItems.find(i => i.id === alert.item_id);
          return {
            ...alert,
            inventory_items: item ? {
              name: item.name,
              unit: item.unit,
              current_stock: item.current_stock,
              min_threshold: item.min_threshold
            } : null
          };
        });

        const unreadCount = alertsWithData.filter(alert => !alert.is_read).length;

        set({
          alerts: alertsWithData,
          unreadCount,
          loading: false
        });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          inventory_items(name, unit, current_stock, min_threshold)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const unreadCount = data?.filter(alert => !alert.is_read).length || 0;

      set({
        alerts: data || [],
        unreadCount,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      if (isDemoMode()) {
        // In demo mode, just update the local state
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === id ? { ...alert, is_read: true } : alert
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, is_read: true } : alert
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      if (isDemoMode()) {
        // In demo mode, just update the local state
        set(state => ({
          alerts: state.alerts.map(alert => ({ ...alert, is_read: true })),
          unreadCount: 0
        }));
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      set(state => ({
        alerts: state.alerts.map(alert => ({ ...alert, is_read: true })),
        unreadCount: 0
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  subscribeToAlerts: () => {
    if (isDemoMode()) {
      // In demo mode, return a no-op unsubscribe function
      return () => {};
    }

    const supabase = createClient();

    const subscription = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          // Fetch the full alert with item details
          supabase
            .from('alerts')
            .select(`
              *,
              inventory_items(name, unit, current_stock, min_threshold)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                set(state => ({
                  alerts: [data, ...state.alerts],
                  unreadCount: state.unreadCount + 1
                }));

                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                  new Notification('Low Stock Alert', {
                    body: data.message,
                    icon: '/favicon.ico'
                  });
                }
              }
            });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
}));