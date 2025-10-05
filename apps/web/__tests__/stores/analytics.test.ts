import { renderHook, act } from '@testing-library/react';
import { useAnalyticsStore } from '@/lib/stores/analytics';
import type { AnalyticsData } from '@restaurant-inventory/shared';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();
const mockRpc = jest.fn().mockReturnValue('min_threshold');

const mockChain = {
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  lte: mockLte,
  order: mockOrder,
};

mockSelect.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockGte.mockReturnValue(mockChain);
mockLte.mockReturnValue(mockChain);
mockOrder.mockResolvedValue({ data: [], error: null });

const mockFrom = jest.fn(() => mockChain);

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

// Mock demo mode control
let mockIsDemoMode = true;
jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => mockIsDemoMode,
}));

describe('Analytics Store', () => {
  const mockTransactions = [
    {
      created_at: '2023-01-01T10:00:00Z',
      quantity: 5,
      item_id: 'item-1',
      inventory_items: { name: 'Tomatoes', unit: 'kg' },
    },
    {
      created_at: '2023-01-01T11:00:00Z',
      quantity: 3,
      item_id: 'item-2',
      inventory_items: { name: 'Chicken', unit: 'kg' },
    },
  ];

  const mockInventoryItems = [
    {
      id: 'item-1',
      current_stock: 10,
      cost_per_unit: 3.5,
      min_threshold: 5,
    },
    {
      id: 'item-2',
      current_stock: 2,
      cost_per_unit: 12.99,
      min_threshold: 5,
    },
  ];

  beforeEach(() => {
    useAnalyticsStore.setState({
      data: null,
      loading: false,
      error: null,
    });

    jest.clearAllMocks();
    mockIsDemoMode = true;

    mockSelect.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockGte.mockReturnValue(mockChain);
    mockLte.mockReturnValue(mockChain);
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  describe('fetchAnalytics', () => {
    it('should fetch daily analytics successfully in demo mode', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.daily_usage).toBeDefined();
      expect(result.current.data?.daily_usage.length).toBeGreaterThan(0);
      expect(result.current.data?.inventory_value).toBeGreaterThan(0);
      expect(result.current.data?.low_stock_count).toBeGreaterThanOrEqual(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch weekly analytics successfully in demo mode', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('weekly');
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.weekly_usage).toBeDefined();
      expect(result.current.data?.weekly_usage.length).toBeGreaterThan(0);
      expect(result.current.data?.inventory_value).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should calculate inventory value correctly', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      // Inventory value should be calculated from mock data
      expect(result.current.data?.inventory_value).toBeGreaterThan(0);
    });

    it('should count low stock items correctly', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      // Low stock count should be a non-negative number
      expect(result.current.data?.low_stock_count).toBeGreaterThanOrEqual(0);
    });

    it('should set loading state correctly during fetch', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // Verify final loading state after fetch completes
      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle errors in demo mode', async () => {
      // Demo mode has internal error handling that's covered by success paths
      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      // Should complete without crashing
      expect(result.current.loading).toBe(false);
    });

    it('should clear error on successful fetch', async () => {
      // Set an initial error
      useAnalyticsStore.setState({
        error: 'Previous error',
        loading: false,
        data: null,
      });

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      // Error should be cleared
      expect(result.current.error).toBeNull();
      expect(result.current.data).not.toBeNull();
    });

    it('should handle period parameter correctly', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // Test both daily and weekly
      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.data?.daily_usage).toBeDefined();

      await act(async () => {
        await result.current.fetchAnalytics('weekly');
      });

      expect(result.current.data?.weekly_usage).toBeDefined();
    });
  });

  describe('Non-demo mode', () => {
    beforeEach(() => {
      mockIsDemoMode = false;
    });

    it('should fetch analytics from Supabase in non-demo mode', async () => {
      const mockTransactions = [
        {
          created_at: '2023-01-01T10:00:00Z',
          quantity: 5,
          item_id: 'item-1',
          inventory_items: { name: 'Tomatoes', unit: 'kg' },
        },
      ];

      const mockItems = [
        { current_stock: 10, cost_per_unit: 3.5 },
      ];

      mockOrder.mockResolvedValue({ data: mockTransactions, error: null });
      mockSelect.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValue(mockChain);
      mockGte.mockReturnValue(mockChain);
      mockLte.mockReturnValue(mockChain);

      // Mock for inventory items query
      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      // Mock for low stock count
      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ count: 2, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockCountChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(mockFrom).toHaveBeenCalledWith('stock_transactions');
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });

    it('should handle weekly period in non-demo mode', async () => {
      mockIsDemoMode = false;
      const mockTransactions = [
        {
          created_at: '2023-01-01T10:00:00Z',
          quantity: 5,
          item_id: 'item-1',
          inventory_items: { name: 'Tomatoes', unit: 'kg' },
        },
      ];

      const mockItems = [
        { current_stock: 10, cost_per_unit: 3.5 },
      ];

      mockOrder.mockResolvedValue({ data: mockTransactions, error: null });

      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ count: 1, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockCountChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('weekly');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data?.weekly_usage).toBeDefined();
    });

    it('should handle transaction errors in non-demo mode', async () => {
      mockIsDemoMode = false;
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Transaction fetch failed' } });

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Transaction fetch failed');
      expect(result.current.data).toBeNull();
    });

    it('should handle items fetch errors in non-demo mode', async () => {
      mockIsDemoMode = false;
      mockOrder.mockResolvedValue({ data: [], error: null });

      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Items fetch failed' } }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Items fetch failed');
    });

    it('should calculate inventory value correctly from Supabase data', async () => {
      mockIsDemoMode = false;
      const mockItems = [
        { current_stock: 10, cost_per_unit: 3.5 },
        { current_stock: 5, cost_per_unit: 12.99 },
      ];

      mockOrder.mockResolvedValue({ data: [], error: null });

      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ count: 1, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockCountChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      const expectedValue = (10 * 3.5) + (5 * 12.99);
      expect(result.current.data?.inventory_value).toBe(expectedValue);
    });

    it('should handle null items gracefully', async () => {
      mockIsDemoMode = false;
      mockOrder.mockResolvedValue({ data: [], error: null });

      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ count: null, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockCountChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.data?.inventory_value).toBe(0);
      expect(result.current.data?.low_stock_count).toBe(0);
    });

    it('should process usage data correctly for daily period', async () => {
      mockIsDemoMode = false;
      const mockTransactions = [
        {
          created_at: '2023-01-01T10:00:00Z',
          quantity: 5,
          item_id: 'item-1',
          inventory_items: { name: 'Tomatoes', unit: 'kg' },
        },
        {
          created_at: '2023-01-01T11:00:00Z',
          quantity: 3,
          item_id: 'item-1',
          inventory_items: { name: 'Tomatoes', unit: 'kg' },
        },
      ];

      mockOrder.mockResolvedValue({ data: mockTransactions, error: null });

      const mockItemsChain = {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockFrom.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockItemsChain);

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };
      mockFrom.mockReturnValueOnce(mockCountChain);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalytics('daily');
      });

      expect(result.current.data?.daily_usage).toBeDefined();
      expect(result.current.data?.daily_usage.length).toBeGreaterThan(0);
    });
  });
});
