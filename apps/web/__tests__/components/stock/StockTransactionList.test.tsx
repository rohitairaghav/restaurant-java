import { render, screen, fireEvent } from '@testing-library/react';
import StockTransactionList from '@/components/stock/StockTransactionList';
import { useStockStore } from '@/lib/stores/stock';
import type { StockTransaction } from '@restaurant-inventory/shared';

// Mock Dexie and offline modules
jest.mock('dexie', () => ({ Dexie: class {} }));
jest.mock('@/lib/offline/database', () => ({
  offlineDB: {
    inventoryItems: { toArray: jest.fn().mockResolvedValue([]) },
    stockTransactions: { toArray: jest.fn().mockResolvedValue([]), add: jest.fn() },
  },
}));
jest.mock('@/lib/offline/sync', () => ({
  syncManager: { setupOnlineListener: jest.fn(), syncOfflineData: jest.fn(), addOfflineTransaction: jest.fn() },
}));

jest.mock('@/lib/stores/stock');
jest.mock('@/lib/stores/inventory');
jest.mock('@/lib/stores/auth');
jest.mock('@/components/stock/StockForm', () => {
  return function MockStockForm() {
    return <div>Mock Stock Form</div>;
  };
});
jest.mock('lucide-react', () => ({
  Plus: () => <div>Plus</div>,
  ArrowUp: () => <div>ArrowUp</div>,
  ArrowDown: () => <div>ArrowDown</div>,
  Pencil: () => <div>Pencil</div>,
  X: () => <div>X</div>,
}));

const mockUseStockStore = useStockStore as jest.MockedFunction<typeof useStockStore>;

describe('StockTransactionList', () => {
  const mockFetchTransactions = jest.fn();

  const mockTransactions: (StockTransaction & { inventory_items?: { name: string; unit: string }; user_profiles?: { email: string } })[] = [
    {
      id: 'tx-1',
      item_id: 'item-1',
      type: 'in',
      quantity: 10,
      reason: 'Purchase' as any,
      sku: 'SKU001',
      notes: 'New stock',
      user_id: 'user-1',
      restaurant_id: 'rest-1',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z',
      inventory_items: { name: 'Tomatoes', unit: 'kg' },
      user_profiles: { email: 'manager@test.com' },
    },
    {
      id: 'tx-2',
      item_id: 'item-2',
      type: 'out',
      quantity: 5,
      reason: 'Damaged' as any,
      user_id: 'user-1',
      restaurant_id: 'rest-1',
      created_at: '2023-01-02T10:00:00Z',
      updated_at: '2023-01-02T10:00:00Z',
      inventory_items: { name: 'Chicken', unit: 'kg' },
      user_profiles: { email: 'staff@test.com' },
    },
  ];

  beforeEach(() => {
    mockUseStockStore.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      fetchTransactions: mockFetchTransactions,
      addTransaction: jest.fn(),
      updateTransaction: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render list title', () => {
      render(<StockTransactionList />);
      expect(screen.getByText('Stock Transactions')).toBeInTheDocument();
    });

    it('should fetch transactions on mount', () => {
      render(<StockTransactionList />);
      expect(mockFetchTransactions).toHaveBeenCalled();
    });

    it('should display Add Transaction button', () => {
      render(<StockTransactionList />);
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should display transaction data', () => {
      render(<StockTransactionList />);
      const tomatoElements = screen.getAllByText('Tomatoes');
      const chickenElements = screen.getAllByText('Chicken');
      expect(tomatoElements.length).toBeGreaterThan(0);
      expect(chickenElements.length).toBeGreaterThan(0);
    });

    it('should display Stock In and Stock Out labels', () => {
      render(<StockTransactionList />);
      const stockInElements = screen.getAllByText('Stock In');
      const stockOutElements = screen.getAllByText('Stock Out');
      expect(stockInElements.length).toBeGreaterThan(0);
      expect(stockOutElements.length).toBeGreaterThan(0);
    });

    it('should display transaction reasons', () => {
      render(<StockTransactionList />);
      const purchaseElements = screen.getAllByText('Purchase');
      const damagedElements = screen.getAllByText('Damaged');
      expect(purchaseElements.length).toBeGreaterThan(0);
      expect(damagedElements.length).toBeGreaterThan(0);
    });

    it('should display empty state when no transactions', () => {
      mockUseStockStore.mockReturnValue({
        transactions: [],
        loading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
        addTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      render(<StockTransactionList />);
      expect(screen.getByText(/No transactions found/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseStockStore.mockReturnValue({
        transactions: [],
        loading: true,
        error: null,
        fetchTransactions: mockFetchTransactions,
        addTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      const { container } = render(<StockTransactionList />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseStockStore.mockReturnValue({
        transactions: [],
        loading: false,
        error: 'Failed to load transactions',
        fetchTransactions: mockFetchTransactions,
        addTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      render(<StockTransactionList />);
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should have clickable Add Transaction button', () => {
      render(<StockTransactionList />);

      const addButton = screen.getByText('Add Transaction');
      expect(addButton).toBeInTheDocument();
      fireEvent.click(addButton);
      // Button click is handled - form rendering tested separately in StockForm tests
    });

    it('should have clickable Edit buttons', () => {
      const { container } = render(<StockTransactionList />);

      // Find edit buttons
      const editButtons = container.querySelectorAll('button[aria-label="Edit transaction"]');
      expect(editButtons.length).toBeGreaterThan(0);
      // Edit button click is handled - form rendering tested separately in StockForm tests
    });
  });

  describe('Table Headers', () => {
    it('should display table headers on desktop view', () => {
      render(<StockTransactionList />);
      expect(screen.getByText('Item')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Reason')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
