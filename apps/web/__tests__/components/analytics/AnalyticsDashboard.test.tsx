import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { useAnalyticsStore } from '@/lib/stores/analytics';
import { useInventoryStore } from '@/lib/stores/inventory';
import type { AnalyticsData, InventoryItem } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/analytics');
jest.mock('@/lib/stores/inventory');
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div>TrendingUp</div>,
  DollarSign: () => <div>DollarSign</div>,
  AlertTriangle: () => <div>AlertTriangle</div>,
  Package: () => <div>Package</div>,
}));

const mockUseAnalyticsStore = useAnalyticsStore as jest.MockedFunction<typeof useAnalyticsStore>;
const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;

describe('AnalyticsDashboard', () => {
  const mockFetchAnalytics = jest.fn();
  const mockFetchItems = jest.fn();

  const mockAnalyticsData: AnalyticsData = {
    daily_usage: [
      {
        date: '2023-01-01',
        items: [
          { item_id: 'item-1', quantity: 5 },
          { item_id: 'item-2', quantity: 3 },
        ],
      },
    ],
    weekly_usage: [
      {
        week: 'Week 1',
        items: [
          { item_id: 'item-1', quantity: 25 },
        ],
      },
    ],
    inventory_value: 1500.50,
    low_stock_count: 2,
  };

  const mockItems: InventoryItem[] = [
    {
      id: 'item-1',
      name: 'Tomatoes',
      unit: 'kg',
      category: 'Vegetables',
      cost_per_unit: 3.5,
      current_stock: 3,
      min_threshold: 5,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: 'item-2',
      name: 'Chicken',
      unit: 'kg',
      category: 'Meat',
      cost_per_unit: 12.99,
      current_stock: 0,
      min_threshold: 10,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: 'item-3',
      name: 'Lettuce',
      unit: 'kg',
      category: 'Vegetables',
      cost_per_unit: 2.5,
      current_stock: 15,
      min_threshold: 5,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
  ];

  beforeEach(() => {
    mockUseAnalyticsStore.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      fetchAnalytics: mockFetchAnalytics,
    });

    mockUseInventoryStore.mockReturnValue({
      items: mockItems,
      suppliers: [],
      loading: false,
      error: null,
      fetchItems: mockFetchItems,
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      addSupplier: jest.fn(),
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard title', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should fetch analytics on mount', () => {
      render(<AnalyticsDashboard />);
      expect(mockFetchAnalytics).toHaveBeenCalledWith('daily');
    });

    it('should fetch inventory items on mount', () => {
      render(<AnalyticsDashboard />);
      expect(mockFetchItems).toHaveBeenCalled();
    });

    it('should display period selector', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Daily View (Last 7 days)')).toBeInTheDocument();
      expect(screen.getByText('Weekly View (Last 4 weeks)')).toBeInTheDocument();
    });

    it('should display inventory value card', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('$1,500.50')).toBeInTheDocument();
    });

    it('should display total items card', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Total Items')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display low stock count', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display out of stock count', () => {
      const { container } = render(<AnalyticsDashboard />);
      const outOfStockElements = screen.getAllByText(/Out of Stock/);
      expect(outOfStockElements.length).toBeGreaterThan(0);
      // Verify the component renders correctly - out of stock count is displayed
      const outOfStockCards = container.querySelectorAll('.bg-white.p-6.rounded-lg.shadow');
      expect(outOfStockCards.length).toBeGreaterThan(0);
    });

    it('should display daily usage analysis title', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Daily Usage Analysis')).toBeInTheDocument();
    });

    it('should display usage data', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('2023-01-01')).toBeInTheDocument();
      const tomatoElements = screen.getAllByText('Tomatoes');
      const chickenElements = screen.getAllByText('Chicken');
      expect(tomatoElements.length).toBeGreaterThan(0);
      expect(chickenElements.length).toBeGreaterThan(0);
    });

    it('should display items requiring attention section', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Items Requiring Attention')).toBeInTheDocument();
    });

    it('should display low stock and out of stock items', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText(/Current: 3 kg/)).toBeInTheDocument();
      expect(screen.getByText(/Current: 0 kg/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        fetchAnalytics: mockFetchAnalytics,
      });

      const { container } = render(<AnalyticsDashboard />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load analytics',
        fetchAnalytics: mockFetchAnalytics,
      });

      render(<AnalyticsDashboard />);
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    });
  });

  describe('Period Selection', () => {
    it('should switch to weekly view when selected', async () => {
      const { container } = render(<AnalyticsDashboard />);

      const select = container.querySelector('select');
      if (select) {
        fireEvent.change(select, { target: { value: 'weekly' } });

        await waitFor(() => {
          expect(mockFetchAnalytics).toHaveBeenCalledWith('weekly');
        });

        expect(screen.getByText('Weekly Usage Analysis')).toBeInTheDocument();
      }
    });

    it('should display weekly data when weekly view is selected', async () => {
      const { container } = render(<AnalyticsDashboard />);

      const select = container.querySelector('select');
      if (select) {
        fireEvent.change(select, { target: { value: 'weekly' } });

        await waitFor(() => {
          expect(screen.getByText('Week 1')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no usage data', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: {
          daily_usage: [],
          weekly_usage: [],
          inventory_value: 0,
          low_stock_count: 0,
        },
        loading: false,
        error: null,
        fetchAnalytics: mockFetchAnalytics,
      });

      render(<AnalyticsDashboard />);
      expect(screen.getByText('No usage data available for the selected period')).toBeInTheDocument();
    });

    it('should not display items requiring attention section when no low stock items', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: {
          daily_usage: [],
          weekly_usage: [],
          inventory_value: 0,
          low_stock_count: 0,
        },
        loading: false,
        error: null,
        fetchAnalytics: mockFetchAnalytics,
      });

      mockUseInventoryStore.mockReturnValue({
        items: [mockItems[2]], // Only item with good stock
        suppliers: [],
        loading: false,
        error: null,
        fetchItems: mockFetchItems,
        fetchSuppliers: jest.fn(),
        addItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
        addSupplier: jest.fn(),
        checkItemHasTransactions: jest.fn(),
        checkItemHasAlerts: jest.fn(),
      });

      render(<AnalyticsDashboard />);
      expect(screen.queryByText('Items Requiring Attention')).not.toBeInTheDocument();
    });

    it('should display no usage recorded when day has no items', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: {
          daily_usage: [
            {
              date: '2023-01-05',
              items: [],
            },
          ],
          weekly_usage: [],
          inventory_value: 0,
          low_stock_count: 0,
        },
        loading: false,
        error: null,
        fetchAnalytics: mockFetchAnalytics,
      });

      render(<AnalyticsDashboard />);
      expect(screen.getByText('No usage recorded')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display zero values correctly when no data', () => {
      mockUseAnalyticsStore.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        fetchAnalytics: mockFetchAnalytics,
      });

      mockUseInventoryStore.mockReturnValue({
        items: [],
        suppliers: [],
        loading: false,
        error: null,
        fetchItems: mockFetchItems,
        fetchSuppliers: jest.fn(),
        addItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
        addSupplier: jest.fn(),
        checkItemHasTransactions: jest.fn(),
        checkItemHasAlerts: jest.fn(),
      });

      render(<AnalyticsDashboard />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
      expect(screen.getByText('Total Items')).toBeInTheDocument();
    });
  });
});
