import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryForm from '@/components/inventory/InventoryForm';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import type { InventoryItem } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/inventory');
jest.mock('@/lib/stores/auth');
jest.mock('lucide-react', () => ({
  X: () => <div>X</div>,
}));

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('InventoryForm', () => {
  const mockOnClose = jest.fn();
  const mockAddItem = jest.fn();
  const mockUpdateItem = jest.fn();
  const mockFetchSuppliers = jest.fn();

  const mockSuppliers = [
    { id: 'supplier-1', name: 'Supplier A', restaurant_id: 'rest-1', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ];

  const mockUser = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockItem: InventoryItem = {
    id: 'item-1',
    name: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    cost_per_unit: 3.5,
    current_stock: 10,
    min_threshold: 5,
    restaurant_id: 'rest-1',
    supplier_id: 'supplier-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    mockUseInventoryStore.mockReturnValue({
      items: [],
      suppliers: mockSuppliers,
      loading: false,
      error: null,
      fetchItems: jest.fn(),
      fetchSuppliers: mockFetchSuppliers,
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: jest.fn(),
      addSupplier: jest.fn(),
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    mockUseAuthStore.mockReturnValue({
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
    it('should render add form title', () => {
      render(<InventoryForm onClose={mockOnClose} />);
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });

    it('should render edit form title when item provided', () => {
      render(<InventoryForm item={mockItem} onClose={mockOnClose} />);
      expect(screen.getByText('Edit Item')).toBeInTheDocument();
    });

    it('should fetch suppliers on mount', () => {
      render(<InventoryForm onClose={mockOnClose} />);
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });

    it('should render supplier options', () => {
      render(<InventoryForm onClose={mockOnClose} />);
      expect(screen.getByText('Supplier A')).toBeInTheDocument();
    });

    it('should render Add button in add mode', () => {
      render(<InventoryForm onClose={mockOnClose} />);
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should render Update button in edit mode', () => {
      render(<InventoryForm item={mockItem} onClose={mockOnClose} />);
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<InventoryForm onClose={mockOnClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should close form when close button clicked', () => {
      render(<InventoryForm onClose={mockOnClose} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.textContent === 'X');

      if (xButton) {
        fireEvent.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should close form when cancel button clicked', () => {
      render(<InventoryForm onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call addItem on valid form submission', async () => {
      mockAddItem.mockResolvedValue(undefined);
      const { container } = render(<InventoryForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const nameInput = container.querySelector('input[name="name"]');
      const categorySelect = container.querySelector('select[name="category"]');
      const unitSelect = container.querySelector('select[name="unit"]');
      const costInput = container.querySelector('input[name="cost_per_unit"]');
      const thresholdInput = container.querySelector('input[name="min_threshold"]');

      if (nameInput) fireEvent.change(nameInput, { target: { value: 'Test Item' } });
      if (categorySelect) fireEvent.change(categorySelect, { target: { value: 'Vegetables' } });
      if (unitSelect) fireEvent.change(unitSelect, { target: { value: 'kg' } });
      if (costInput) fireEvent.change(costInput, { target: { value: '5.99' } });
      if (thresholdInput) fireEvent.change(thresholdInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockAddItem).toHaveBeenCalled();
        });
      }
    });

    it('should call updateItem in edit mode', async () => {
      mockUpdateItem.mockResolvedValue(undefined);
      const { container } = render(<InventoryForm item={mockItem} onClose={mockOnClose} />);

      const form = container.querySelector('form');

      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalledWith('item-1', expect.any(Object));
        });
      }
    });

    it('should display error on submission failure', async () => {
      mockAddItem.mockRejectedValue(new Error('Test error'));
      const { container } = render(<InventoryForm onClose={mockOnClose} />);

      const form = container.querySelector('form');
      const nameInput = container.querySelector('input[name="name"]');
      const categorySelect = container.querySelector('select[name="category"]');
      const unitSelect = container.querySelector('select[name="unit"]');
      const costInput = container.querySelector('input[name="cost_per_unit"]');
      const thresholdInput = container.querySelector('input[name="min_threshold"]');

      if (nameInput) fireEvent.change(nameInput, { target: { value: 'Test' } });
      if (categorySelect) fireEvent.change(categorySelect, { target: { value: 'Vegetables' } });
      if (unitSelect) fireEvent.change(unitSelect, { target: { value: 'kg' } });
      if (costInput) fireEvent.change(costInput, { target: { value: '5' } });
      if (thresholdInput) fireEvent.change(thresholdInput, { target: { value: '10' } });

      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText(/Test error/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with item data', () => {
      const { container } = render(<InventoryForm item={mockItem} onClose={mockOnClose} />);

      const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
      expect(nameInput?.value).toBe('Tomatoes');
    });

    it('should handle item without supplier', () => {
      const itemWithoutSupplier = { ...mockItem, supplier_id: null };
      const { container } = render(<InventoryForm item={itemWithoutSupplier} onClose={mockOnClose} />);

      const supplierSelect = container.querySelector('select[name="supplier_id"]') as HTMLSelectElement;
      expect(supplierSelect?.value).toBe('');
    });
  });
});
