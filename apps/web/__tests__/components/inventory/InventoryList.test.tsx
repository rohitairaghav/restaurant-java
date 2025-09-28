import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryList from '@/components/inventory/InventoryList';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import type { InventoryItem } from '@restaurant-inventory/shared';

// Mock the stores
jest.mock('@/lib/stores/inventory');
jest.mock('@/lib/stores/auth');

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('InventoryList', () => {
  const mockItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Tomatoes',
      category: 'Vegetables',
      unit: 'kg',
      cost_per_unit: 3.5,
      current_stock: 10,
      min_threshold: 5,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: '2',
      name: 'Chicken',
      category: 'Meat',
      unit: 'kg',
      cost_per_unit: 12.99,
      current_stock: 2, // Low stock
      min_threshold: 5,
      restaurant_id: 'rest1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
  ];

  const mockFetchItems = jest.fn();
  const mockDeleteItem = jest.fn();

  beforeEach(() => {
    mockUseInventoryStore.mockReturnValue({
      items: mockItems,
      suppliers: [],
      loading: false,
      error: null,
      fetchItems: mockFetchItems,
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: mockDeleteItem,
      addSupplier: jest.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'manager@example.com',
        role: 'manager',
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      initialize: jest.fn(),
    });

    jest.clearAllMocks();
  });

  it('should render inventory items', () => {
    render(<InventoryList />);

    expect(screen.getByText('Inventory Items')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('should fetch items on mount', () => {
    render(<InventoryList />);
    expect(mockFetchItems).toHaveBeenCalled();
  });

  it('should show Add Item button for managers', () => {
    render(<InventoryList />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  it('should not show Add Item button for staff', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'staff@example.com',
        role: 'staff',
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      initialize: jest.fn(),
    });

    render(<InventoryList />);
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  });

  it('should display low stock warning', () => {
    render(<InventoryList />);

    // Chicken should show low stock warning (current: 2, min: 5)
    const chickenItem = screen.getByText('Chicken').closest('div');
    expect(chickenItem).toHaveClass('border-l-warning-500');
  });

  it('should display stock information correctly', () => {
    render(<InventoryList />);

    expect(screen.getByText('Current Stock:')).toBeInTheDocument();
    expect(screen.getByText('10 kg')).toBeInTheDocument(); // Tomatoes stock
    expect(screen.getByText('2 kg')).toBeInTheDocument(); // Chicken stock
  });

  it('should handle item deletion with confirmation', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    mockDeleteItem.mockResolvedValue(undefined);

    render(<InventoryList />);

    const deleteButtons = screen.getAllByTitle(/delete/i);
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this item?');
    expect(mockDeleteItem).toHaveBeenCalledWith('1');
  });

  it('should not delete item if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);

    render(<InventoryList />);

    const deleteButtons = screen.getAllByTitle(/delete/i);
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteItem).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    mockUseInventoryStore.mockReturnValue({
      items: [],
      suppliers: [],
      loading: true,
      error: null,
      fetchItems: mockFetchItems,
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: mockDeleteItem,
      addSupplier: jest.fn(),
    });

    render(<InventoryList />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should show error state', () => {
    mockUseInventoryStore.mockReturnValue({
      items: [],
      suppliers: [],
      loading: false,
      error: 'Failed to fetch items',
      fetchItems: mockFetchItems,
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: mockDeleteItem,
      addSupplier: jest.fn(),
    });

    render(<InventoryList />);
    expect(screen.getByText('Failed to fetch items')).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    mockUseInventoryStore.mockReturnValue({
      items: [],
      suppliers: [],
      loading: false,
      error: null,
      fetchItems: mockFetchItems,
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: mockDeleteItem,
      addSupplier: jest.fn(),
    });

    render(<InventoryList />);
    expect(screen.getByText(/no inventory items found/i)).toBeInTheDocument();
  });
});