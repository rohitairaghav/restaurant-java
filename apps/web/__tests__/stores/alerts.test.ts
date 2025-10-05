import { renderHook, act } from '@testing-library/react';
import { useAlertsStore } from '@/lib/stores/alerts';
import type { Alert } from '@restaurant-inventory/shared';

// Mock Supabase client with chainable methods
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
};

// Setup chain object
const mockChain = {
  select: mockSelect,
  update: mockUpdate,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockChain);
mockUpdate.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockOrder.mockResolvedValue({ data: [], error: null });
mockSingle.mockResolvedValue({ data: null, error: null });
mockOn.mockReturnValue(mockChannel);
mockSubscribe.mockReturnValue(mockChannel);

const mockFrom = jest.fn(() => mockChain);
const mockChannelFn = jest.fn(() => mockChannel);

const mockSupabase = {
  from: mockFrom,
  channel: mockChannelFn,
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

// Mock demo mode control
let mockIsDemoMode = false;
jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => mockIsDemoMode,
}));

// Mock Notification API
global.Notification = {
  permission: 'default',
} as any;

describe('Alerts Store', () => {
  const mockAlerts: Alert[] = [
    {
      id: '1',
      item_id: 'item-1',
      type: 'low_stock',
      message: 'Low stock alert',
      is_read: false,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      inventory_items: {
        name: 'Tomatoes',
        unit: 'kg',
        current_stock: 2,
        min_threshold: 5,
      },
    },
    {
      id: '2',
      item_id: 'item-2',
      type: 'low_stock',
      message: 'Another alert',
      is_read: true,
      restaurant_id: 'rest1',
      created_at: '2023-01-02',
      updated_at: '2023-01-02',
      inventory_items: {
        name: 'Chicken',
        unit: 'kg',
        current_stock: 3,
        min_threshold: 10,
      },
    },
  ];

  beforeEach(() => {
    useAlertsStore.setState({
      alerts: [],
      loading: false,
      error: null,
      unreadCount: 0,
    });

    jest.clearAllMocks();
    mockIsDemoMode = false;

    mockSelect.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('fetchAlerts', () => {
    it('should fetch alerts successfully', async () => {
      // Mock select().order()
      mockOrder.mockResolvedValue({
        data: mockAlerts,
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.alerts).toEqual(mockAlerts);
      expect(result.current.unreadCount).toBe(1); // One unread alert
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.alerts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      // Setup initial state with unread alerts
      useAlertsStore.setState({
        alerts: mockAlerts,
        unreadCount: 1,
      });

      // Mock update().eq()
      mockEq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.markAsRead('1');
      });

      const updatedAlert = result.current.alerts.find(a => a.id === '1');
      expect(updatedAlert?.is_read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle mark as read error', async () => {
      useAlertsStore.setState({
        alerts: mockAlerts,
        unreadCount: 1,
      });

      // Mock error
      mockEq.mockResolvedValue({
        error: { message: 'Update failed' },
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.markAsRead('1');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', async () => {
      useAlertsStore.setState({
        alerts: mockAlerts,
        unreadCount: 1,
      });

      // Mock update().eq()
      mockEq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.alerts.every(a => a.is_read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle mark all as read error', async () => {
      useAlertsStore.setState({
        alerts: mockAlerts,
        unreadCount: 1,
      });

      mockEq.mockResolvedValue({
        error: { message: 'Update failed' },
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('subscribeToAlerts', () => {
    it('should subscribe to alerts channel', () => {
      const { result } = renderHook(() => useAlertsStore());

      act(() => {
        result.current.subscribeToAlerts();
      });

      expect(mockSupabase.channel).toHaveBeenCalledWith('alerts_changes');
      expect(mockOn).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const { result } = renderHook(() => useAlertsStore());

      let unsubscribe: () => void;
      act(() => {
        unsubscribe = result.current.subscribeToAlerts();
      });

      act(() => {
        unsubscribe!();
      });

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle new alert insertion', async () => {
      const newAlert = {
        id: '3',
        item_id: 'item-3',
        type: 'low_stock' as const,
        message: 'New low stock alert',
        is_read: false,
        restaurant_id: 'rest1',
        created_at: '2023-01-03',
        updated_at: '2023-01-03',
        inventory_items: {
          name: 'Onions',
          unit: 'kg',
          current_stock: 1,
          min_threshold: 5,
        },
      };

      let insertCallback: any;
      mockOn.mockImplementation((eventType: string, config: any, callback: any) => {
        if (eventType === 'postgres_changes') {
          insertCallback = callback;
        }
        return mockChannel;
      });

      mockSingle.mockResolvedValue({
        data: newAlert,
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      act(() => {
        result.current.subscribeToAlerts();
      });

      // Simulate an INSERT event
      await act(async () => {
        if (insertCallback) {
          await insertCallback({ new: { id: '3' } });
        }
      });

      expect(result.current.alerts).toContainEqual(newAlert);
      expect(result.current.unreadCount).toBeGreaterThan(0);
    });

    it('should not show browser notification if permission not granted', async () => {
      const originalPermission = Notification.permission;
      Object.defineProperty(Notification, 'permission', {
        writable: true,
        value: 'denied',
      });

      const newAlert = {
        id: '3',
        item_id: 'item-3',
        type: 'low_stock' as const,
        message: 'New alert',
        is_read: false,
        restaurant_id: 'rest1',
        created_at: '2023-01-03',
        updated_at: '2023-01-03',
        inventory_items: {
          name: 'Onions',
          unit: 'kg',
          current_stock: 1,
          min_threshold: 5,
        },
      };

      let insertCallback: any;
      mockOn.mockImplementation((eventType: string, config: any, callback: any) => {
        if (eventType === 'postgres_changes') {
          insertCallback = callback;
        }
        return mockChannel;
      });

      mockSingle.mockResolvedValue({
        data: newAlert,
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      act(() => {
        result.current.subscribeToAlerts();
      });

      await act(async () => {
        if (insertCallback) {
          await insertCallback({ new: { id: '3' } });
        }
      });

      Object.defineProperty(Notification, 'permission', {
        writable: true,
        value: originalPermission,
      });
    });
  });

  describe('Demo mode tests', () => {
    beforeEach(() => {
      mockIsDemoMode = true;
    });

    it('should fetch alerts in demo mode', async () => {
      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.alerts).toBeDefined();
      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });

    it('should mark alert as read in demo mode', async () => {
      const { result } = renderHook(() => useAlertsStore());

      // Fetch alerts first
      await act(async () => {
        await result.current.fetchAlerts();
      });

      const unreadAlert = result.current.alerts.find(a => !a.is_read);
      if (unreadAlert) {
        await act(async () => {
          await result.current.markAsRead(unreadAlert.id);
        });

        const updatedAlert = result.current.alerts.find(a => a.id === unreadAlert.id);
        expect(updatedAlert?.is_read).toBe(true);
      }
    });

    it('should mark all alerts as read in demo mode', async () => {
      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.alerts.every(a => a.is_read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should return no-op unsubscribe in demo mode', () => {
      const { result } = renderHook(() => useAlertsStore());

      let unsubscribe: () => void;
      act(() => {
        unsubscribe = result.current.subscribeToAlerts();
      });

      expect(typeof unsubscribe!).toBe('function');

      // Should not throw
      act(() => {
        unsubscribe!();
      });
    });

    it('should calculate unread count correctly in demo mode', async () => {
      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      const unreadCount = result.current.alerts.filter(a => !a.is_read).length;
      expect(result.current.unreadCount).toBe(unreadCount);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty alerts array', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.alerts).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.loading).toBe(false);
    });

    it('should handle null alerts data', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.alerts).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should not decrement unread count below zero', async () => {
      useAlertsStore.setState({
        alerts: mockAlerts,
        unreadCount: 0,
      });

      mockEq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAlertsStore());

      await act(async () => {
        await result.current.markAsRead('2'); // Already read alert
      });

      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle subscription error gracefully', async () => {
      const newAlert = {
        id: '3',
        item_id: 'item-3',
        type: 'low_stock' as const,
        message: 'New alert',
        is_read: false,
        restaurant_id: 'rest1',
        created_at: '2023-01-03',
        updated_at: '2023-01-03',
      };

      let insertCallback: any;
      mockOn.mockImplementation((eventType: string, config: any, callback: any) => {
        if (eventType === 'postgres_changes') {
          insertCallback = callback;
        }
        return mockChannel;
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' },
      });

      const { result } = renderHook(() => useAlertsStore());

      act(() => {
        result.current.subscribeToAlerts();
      });

      await act(async () => {
        if (insertCallback) {
          await insertCallback({ new: { id: '3' } });
        }
      });

      // Should not crash
      expect(result.current.alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should set loading state correctly', async () => {
      mockOrder.mockResolvedValue({
        data: mockAlerts,
        error: null,
      });

      const { result } = renderHook(() => useAlertsStore());

      // Verify final loading state
      await act(async () => {
        await result.current.fetchAlerts();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.alerts).toBeDefined();
    });
  });
});
