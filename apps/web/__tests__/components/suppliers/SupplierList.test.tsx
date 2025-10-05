import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupplierList from '@/components/suppliers/SupplierList';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import type { Supplier } from '@restaurant-inventory/shared';

// Mock the stores
jest.mock('@/lib/stores/inventory');
jest.mock('@/lib/stores/auth');

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockFetchSuppliers = jest.fn();
const mockDeleteSupplier = jest.fn();

const mockManagerUser = {
  id: 'user-1',
  email: 'manager@example.com',
  role: 'manager' as const,
  restaurant_id: 'rest-1',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockStaffUser = {
  id: 'user-2',
  email: 'staff@example.com',
  role: 'staff' as const,
  restaurant_id: 'rest-1',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    name: 'Test Supplier 1',
    contact_person: 'John Doe',
    phone: '+1234567890',
    email: 'john@testsupplier1.com',
    address: '123 Test St, Test City',
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  {
    id: 'supplier-2',
    name: 'Test Supplier 2',
    contact_person: 'Jane Smith',
    phone: '+9876543210',
    email: 'jane@testsupplier2.com',
    address: '456 Another St, Another City',
    restaurant_id: 'rest-1',
    created_at: '2023-01-02',
    updated_at: '2023-01-02',
  },
  {
    id: 'supplier-3',
    name: 'Minimal Supplier',
    restaurant_id: 'rest-1',
    created_at: '2023-01-03',
    updated_at: '2023-01-03',
  },
];

describe('SupplierList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseInventoryStore.mockReturnValue({
      suppliers: mockSuppliers,
      loading: false,
      error: null,
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      user: mockManagerUser,
      loading: false,
      error: null,
      initialize: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      ability: {
        can: jest.fn().mockReturnValue(true),
        cannot: jest.fn().mockReturnValue(false),
      },
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('should render supplier list with manager controls', () => {
    render(<SupplierList />);

    expect(screen.getByText('Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Manage your suppliers and their contact information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Supplier' })).toBeInTheDocument();
  });

  it('should not show add button for staff users', () => {
    mockUseAuthStore.mockReturnValue({
      user: mockStaffUser,
      loading: false,
      error: null,
      initialize: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      ability: {
        can: jest.fn().mockReturnValue(false),
        cannot: jest.fn().mockReturnValue(true),
      },
    });

    render(<SupplierList />);

    expect(screen.queryByRole('button', { name: 'Add Supplier' })).not.toBeInTheDocument();
  });

  it('should display all suppliers with their information', () => {
    render(<SupplierList />);

    // Check supplier names
    expect(screen.getByText('Test Supplier 1')).toBeInTheDocument();
    expect(screen.getByText('Test Supplier 2')).toBeInTheDocument();
    expect(screen.getByText('Minimal Supplier')).toBeInTheDocument();

    // Check contact information for first supplier
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('john@testsupplier1.com')).toBeInTheDocument();
    expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();

    // Check contact information for second supplier
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('+9876543210')).toBeInTheDocument();
    expect(screen.getByText('jane@testsupplier2.com')).toBeInTheDocument();
    expect(screen.getByText('456 Another St, Another City')).toBeInTheDocument();
  });

  it('should show edit and delete buttons for managers', () => {
    render(<SupplierList />);

    const editButtons = screen.getAllByTitle('Edit supplier');
    const deleteButtons = screen.getAllByTitle('Delete supplier');

    expect(editButtons).toHaveLength(3); // One for each supplier
    expect(deleteButtons).toHaveLength(3); // One for each supplier
  });

  it('should not show edit and delete buttons for staff users', () => {
    mockUseAuthStore.mockReturnValue({
      user: mockStaffUser,
      loading: false,
      error: null,
      initialize: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      ability: {
        can: jest.fn().mockReturnValue(false),
        cannot: jest.fn().mockReturnValue(true),
      },
    });

    render(<SupplierList />);

    expect(screen.queryByTitle('Edit supplier')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete supplier')).not.toBeInTheDocument();
  });

  it('should open supplier form when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SupplierList />);

    await user.click(screen.getByRole('button', { name: 'Add Supplier' }));

    expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
  });

  it('should open supplier form with edit data when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<SupplierList />);

    const editButtons = screen.getAllByTitle('Edit supplier');
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Supplier')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Supplier 1')).toBeInTheDocument();
  });

  it('should call deleteSupplier when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteSupplier.mockResolvedValue(undefined);
    
    render(<SupplierList />);

    const deleteButtons = screen.getAllByTitle('Delete supplier');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this supplier?');
    expect(mockDeleteSupplier).toHaveBeenCalledWith('supplier-1');
  });

  it('should not call deleteSupplier when delete is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);
    
    render(<SupplierList />);

    const deleteButtons = screen.getAllByTitle('Delete supplier');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this supplier?');
    expect(mockDeleteSupplier).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    mockUseInventoryStore.mockReturnValue({
      suppliers: [],
      loading: true,
      error: null,
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    render(<SupplierList />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error state with retry button', () => {
    const errorMessage = 'Failed to fetch suppliers';
    mockUseInventoryStore.mockReturnValue({
      suppliers: [],
      loading: false,
      error: errorMessage,
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    render(<SupplierList />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should call fetchSuppliers when retry button is clicked', async () => {
    const user = userEvent.setup();
    mockUseInventoryStore.mockReturnValue({
      suppliers: [],
      loading: false,
      error: 'Failed to fetch suppliers',
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    render(<SupplierList />);

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockFetchSuppliers).toHaveBeenCalledTimes(2); // Once on mount, once on retry
  });

  it('should show empty state for managers when no suppliers exist', () => {
    mockUseInventoryStore.mockReturnValue({
      suppliers: [],
      loading: false,
      error: null,
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    render(<SupplierList />);

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add your first supplier' })).toBeInTheDocument();
  });

  it('should show empty state for staff when no suppliers exist', () => {
    mockUseAuthStore.mockReturnValue({
      user: mockStaffUser,
      loading: false,
      error: null,
      initialize: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      ability: {
        can: jest.fn().mockReturnValue(false),
        cannot: jest.fn().mockReturnValue(true),
      },
    });

    mockUseInventoryStore.mockReturnValue({
      suppliers: [],
      loading: false,
      error: null,
      fetchSuppliers: mockFetchSuppliers,
      addSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: mockDeleteSupplier,
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      items: [],
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    render(<SupplierList />);

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add your first supplier' })).not.toBeInTheDocument();
  });

  it('should handle suppliers with missing optional fields', () => {
    render(<SupplierList />);

    // Minimal supplier should still be displayed
    expect(screen.getByText('Minimal Supplier')).toBeInTheDocument();
    
    // Should not show contact information for minimal supplier
    const supplierCard = screen.getByText('Minimal Supplier').closest('div');
    expect(supplierCard).not.toHaveTextContent('Contact Person');
    expect(supplierCard).not.toHaveTextContent('Phone');
    expect(supplierCard).not.toHaveTextContent('Email');
    expect(supplierCard).not.toHaveTextContent('Address');
  });

  it('should display creation dates', () => {
    render(<SupplierList />);

    // Check that creation dates are displayed (format may vary by locale)
    const dateElements = screen.getAllByText(/Added.*2023/);
    expect(dateElements).toHaveLength(3);
  });

  it('should close form when onClose is called', async () => {
    const user = userEvent.setup();
    render(<SupplierList />);

    // Open form
    await user.click(screen.getByRole('button', { name: 'Add Supplier' }));
    expect(screen.getByText('Add New Supplier')).toBeInTheDocument();

    // Close form
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Add New Supplier')).not.toBeInTheDocument();
  });
});
