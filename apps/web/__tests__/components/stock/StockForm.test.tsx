import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StockForm from '@/components/stock/StockForm';
import { useStockStore } from '@/lib/stores/stock';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';

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
jest.mock('lucide-react', () => ({ X: () => <div>X</div> }));

describe('StockForm', () => {
  const mockOnClose = jest.fn();
  const mockAddTransaction = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const mockFetchItems = jest.fn();

  const mockItems = [
    { id: 'item-1', name: 'Tomatoes', unit: 'kg', category: 'Vegetables', cost_per_unit: 3.5, current_stock: 10, min_threshold: 5, restaurant_id: 'rest-1', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ];

  const mockUser = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    (useStockStore as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
      addTransaction: mockAddTransaction,
      updateTransaction: mockUpdateTransaction,
      fetchTransactions: jest.fn(),
    });

    (useInventoryStore as unknown as jest.Mock).mockReturnValue({
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

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      initialize: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render add form', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText('Add Stock Transaction')).toBeInTheDocument();
    });

    it('should fetch items on mount', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(mockFetchItems).toHaveBeenCalled();
    });

    it('should render item options', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText(/Tomatoes/)).toBeInTheDocument();
    });

    it('should render Add button', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should close form when close button clicked', () => {
      render(<StockForm onClose={mockOnClose} />);
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.textContent === 'X');
      if (xButton) {
        fireEvent.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should close form when cancel button clicked', () => {
      render(<StockForm onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit new transaction', async () => {
      mockAddTransaction.mockResolvedValue(undefined);
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(mockAddTransaction).toHaveBeenCalled();
        });
      }
    });

    it('should display error on failure', async () => {
      mockAddTransaction.mockRejectedValue(new Error('Test error'));
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText(/Test error/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Edit Mode', () => {
    const mockTransaction = {
      id: 'tx-1',
      item_id: 'item-1',
      type: 'in' as const,
      quantity: 5,
      reason: 'Purchase' as any,
      sku: 'SKU001',
      notes: 'Notes',
      user_id: 'user-1',
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      inventory_items: { name: 'Tomatoes', unit: 'kg' },
    };

    it('should render edit form', () => {
      render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);
      expect(screen.getByText('Edit Stock Transaction')).toBeInTheDocument();
    });

    it('should populate form with transaction data', () => {
      const { container } = render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);
      const quantityInput = container.querySelector('input[name="quantity"]') as HTMLInputElement;
      expect(quantityInput?.value).toBe('5');
    });

    it('should submit updates', async () => {
      mockUpdateTransaction.mockResolvedValue(undefined);
      const { container } = render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(mockUpdateTransaction).toHaveBeenCalledWith('tx-1', expect.any(Object));
        });
      }
    });

    it('should show Update button in edit mode', () => {
      render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);
      expect(screen.getByText('Update Transaction')).toBeInTheDocument();
    });
  });

  describe('Transaction Types and Reasons', () => {
    it('should change available reasons when type changes', () => {
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const typeSelect = container.querySelector('select[name="type"]') as HTMLSelectElement;

      // Change to 'out'
      fireEvent.change(typeSelect, { target: { value: 'out' } });

      expect(typeSelect.value).toBe('out');
    });

    it('should reset reason when type changes', () => {
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const typeSelect = container.querySelector('select[name="type"]') as HTMLSelectElement;
      const reasonSelect = container.querySelector('select[name="reason"]') as HTMLSelectElement;

      // Set a reason first
      fireEvent.change(reasonSelect, { target: { value: 'purchase' } });
      expect(reasonSelect.value).toBe('purchase');

      // Change type - should reset reason
      fireEvent.change(typeSelect, { target: { value: 'out' } });
      expect(reasonSelect.value).toBe('');
    });

    it('should show Stock Out option', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText('Stock Out')).toBeInTheDocument();
    });

    it('should show Stock In option', () => {
      render(<StockForm onClose={mockOnClose} />);
      expect(screen.getByText('Stock In')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('should handle optional SKU field', async () => {
      mockAddTransaction.mockResolvedValue(undefined);
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const skuInput = container.querySelector('input[name="sku"]') as HTMLInputElement;
      fireEvent.change(skuInput, { target: { value: 'SKU-123' } });

      expect(skuInput.value).toBe('SKU-123');
    });

    it('should handle optional notes field', async () => {
      mockAddTransaction.mockResolvedValue(undefined);
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const notesInput = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
      fireEvent.change(notesInput, { target: { value: 'Test notes' } });

      expect(notesInput.value).toBe('Test notes');
    });

    it('should submit without optional fields', async () => {
      mockAddTransaction.mockResolvedValue(undefined);
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');
      const reasonSelect = container.querySelector('select[name="reason"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });
      if (reasonSelect) fireEvent.change(reasonSelect, { target: { value: 'purchase' } });

      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(mockAddTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
              item_id: 'item-1',
              quantity: 10,
              sku: undefined,
              notes: undefined,
            })
          );
        });
      }
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockAddTransaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Adding...')).toBeInTheDocument();
        });
      }
    });

    it('should show updating state in edit mode', async () => {
      const mockTransaction = {
        id: 'tx-1',
        item_id: 'item-1',
        type: 'in' as const,
        quantity: 5,
        reason: 'Purchase' as any,
        sku: 'SKU001',
        notes: 'Notes',
        user_id: 'user-1',
        restaurant_id: 'rest-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        inventory_items: { name: 'Tomatoes', unit: 'kg' },
      };

      mockUpdateTransaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Updating...')).toBeInTheDocument();
        });
      }
    });

    it('should disable submit button while loading', async () => {
      mockAddTransaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          const submitButton = screen.getByText('Adding...');
          expect(submitButton).toBeDisabled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error on update failure', async () => {
      const mockTransaction = {
        id: 'tx-1',
        item_id: 'item-1',
        type: 'in' as const,
        quantity: 5,
        reason: 'Purchase' as any,
        sku: 'SKU001',
        notes: 'Notes',
        user_id: 'user-1',
        restaurant_id: 'rest-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        inventory_items: { name: 'Tomatoes', unit: 'kg' },
      };

      mockUpdateTransaction.mockRejectedValue(new Error('Update failed'));
      const { container } = render(<StockForm transaction={mockTransaction} onClose={mockOnClose} />);

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText(/Update failed/)).toBeInTheDocument();
        });
      }
    });

    it('should show default error message when error has no message', async () => {
      mockAddTransaction.mockRejectedValue({});
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText(/Failed to add transaction/)).toBeInTheDocument();
        });
      }
    });

    it('should clear error on new submission', async () => {
      mockAddTransaction.mockRejectedValueOnce(new Error('First error')).mockResolvedValueOnce(undefined);
      const { container } = render(<StockForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const itemSelect = container.querySelector('select[name="item_id"]');
      const quantityInput = container.querySelector('input[name="quantity"]');

      if (itemSelect) fireEvent.change(itemSelect, { target: { value: 'item-1' } });
      if (quantityInput) fireEvent.change(quantityInput, { target: { value: '10' } });

      if (form) {
        // First submission - should show error
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText(/First error/)).toBeInTheDocument();
        });

        // Second submission - error should be cleared
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.queryByText(/First error/)).not.toBeInTheDocument();
        });
      }
    });
  });
});
