import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import type { Supplier } from '@restaurant-inventory/shared';

// Mock the stores
jest.mock('@/lib/stores/inventory');
jest.mock('@/lib/stores/auth');

// Suppress React act warnings that surface via console.error during userEvent typing
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockAddSupplier = jest.fn();
const mockUpdateSupplier = jest.fn();
const mockOnClose = jest.fn();

const mockUser = {
  id: 'user-1',
  email: 'manager@example.com',
  role: 'manager' as const,
  restaurant_id: 'rest-1',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockSupplier: Supplier = {
  id: 'supplier-1',
  name: 'Test Supplier',
  contact_person: 'John Doe',
  phone: '+1234567890',
  email: 'john@testsupplier.com',
  address: '123 Test St, Test City',
  restaurant_id: 'rest-1',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('SupplierForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseInventoryStore.mockReturnValue({
      addSupplier: mockAddSupplier,
      updateSupplier: mockUpdateSupplier,
      suppliers: [],
      fetchSuppliers: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      deleteSupplier: jest.fn(),
      items: [],
      loading: false,
      error: null,
      checkItemHasTransactions: jest.fn(),
      checkItemHasAlerts: jest.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
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
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should render add supplier form', () => {
    render(<SupplierForm onClose={mockOnClose} />);

    expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Person')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('should render edit supplier form with pre-filled data', () => {
    render(<SupplierForm supplier={mockSupplier} onClose={mockOnClose} />);

    expect(screen.getByText('Edit Supplier')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Supplier')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@testsupplier.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St, Test City')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<SupplierForm onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when X button is clicked', () => {
    render(<SupplierForm onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: '' })); // X button
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should validate required name field', async () => {
    const user = userEvent.setup();
    render(<SupplierForm onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    expect(mockAddSupplier).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name *')).toHaveValue(''); // Name field should be empty
  });

  it('should submit new supplier form with valid data', async () => {
    const user = userEvent.setup();
    mockAddSupplier.mockResolvedValue(undefined);
    
    render(<SupplierForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('Name *'), 'New Supplier');
    await user.type(screen.getByLabelText('Contact Person'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '+9876543210');
    await user.type(screen.getByLabelText('Email'), 'jane@newsupplier.com');
    await user.type(screen.getByLabelText('Address'), '456 New St, New City');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mockAddSupplier).toHaveBeenCalledWith({
        name: 'New Supplier',
        contact_person: 'Jane Doe',
        phone: '+9876543210',
        email: 'jane@newsupplier.com',
        address: '456 New St, New City',
        restaurant_id: 'rest-1',
      });
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should submit updated supplier form with valid data', async () => {
    const user = userEvent.setup();
    mockUpdateSupplier.mockResolvedValue(undefined);
    
    render(<SupplierForm supplier={mockSupplier} onClose={mockOnClose} />);

    const nameField = screen.getByDisplayValue('Test Supplier');
    await user.clear(nameField);
    await user.type(nameField, 'Updated Supplier');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(mockUpdateSupplier).toHaveBeenCalledWith('supplier-1', {
        name: 'Updated Supplier',
        contact_person: 'John Doe',
        phone: '+1234567890',
        email: 'john@testsupplier.com',
        address: '123 Test St, Test City',
        restaurant_id: 'rest-1',
      });
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle empty optional fields correctly', async () => {
    const user = userEvent.setup();
    mockAddSupplier.mockResolvedValue(undefined);
    
    render(<SupplierForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('Name *'), 'Minimal Supplier');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mockAddSupplier).toHaveBeenCalledWith({
        name: 'Minimal Supplier',
        contact_person: undefined,
        phone: undefined,
        email: undefined,
        address: undefined,
        restaurant_id: 'rest-1',
      });
    });
  });

  it('should display error message when submission fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to save supplier';
    mockAddSupplier.mockRejectedValue(new Error(errorMessage));
    
    render(<SupplierForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('Name *'), 'Test Supplier');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockAddSupplier.mockReturnValue(promise);
    
    render(<SupplierForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('Name *'), 'Test Supplier');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    resolvePromise!();
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('should handle form input changes correctly', async () => {
    const user = userEvent.setup();
    render(<SupplierForm onClose={mockOnClose} />);

    const nameField = screen.getByLabelText('Name *');
    const contactField = screen.getByLabelText('Contact Person');
    const phoneField = screen.getByLabelText('Phone');
    const emailField = screen.getByLabelText('Email');
    const addressField = screen.getByLabelText('Address');

    await user.type(nameField, 'Test Name');
    await user.type(contactField, 'Test Contact');
    await user.type(phoneField, '1234567890');
    await user.type(emailField, 'test@example.com');
    await user.type(addressField, 'Test Address');

    expect(nameField).toHaveValue('Test Name');
    expect(contactField).toHaveValue('Test Contact');
    expect(phoneField).toHaveValue('1234567890');
    expect(emailField).toHaveValue('test@example.com');
    expect(addressField).toHaveValue('Test Address');
  });
});
