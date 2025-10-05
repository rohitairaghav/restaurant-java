import { renderHook, act } from '@testing-library/react';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import { createClient } from '@/lib/supabase';
import { isDemoMode } from '@/lib/demo-mode';
import { mockSuppliers } from '@/lib/mock-data';
import type { Supplier } from '@restaurant-inventory/shared';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/demo-mode');
jest.mock('@/lib/mock-data');
jest.mock('@/lib/stores/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockIsDemoMode = isDemoMode as jest.MockedFunction<typeof isDemoMode>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

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

describe('Inventory Store - Supplier Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCreateClient.mockReturnValue(mockSupabase as any);
    mockIsDemoMode.mockReturnValue(false);
    
    // Mock the getState function to return the auth state
    const mockGetState = jest.fn().mockReturnValue({
      user: mockUser,
      ability: {
        can: jest.fn().mockReturnValue(true),
        cannot: jest.fn().mockReturnValue(false),
      },
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
    
    // Mock the getState method
    (mockUseAuthStore as any).getState = mockGetState;
  });

  describe('fetchSuppliers', () => {
    it('should fetch suppliers successfully in demo mode', async () => {
      mockIsDemoMode.mockReturnValue(true);
      
      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(result.current.suppliers).toEqual(mockSuppliers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should fetch suppliers successfully from Supabase', async () => {
      const mockData = [mockSupplier];
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.order).toHaveBeenCalledWith('name');
      expect(result.current.suppliers).toEqual(mockData);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Database error';
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.fetchSuppliers();
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('addSupplier', () => {
    it('should add supplier successfully in demo mode', async () => {
      mockIsDemoMode.mockReturnValue(true);
      
      const { result } = renderHook(() => useInventoryStore());
      const initialCount = result.current.suppliers.length;

      const newSupplier = {
        name: 'New Supplier',
        contact_person: 'Jane Doe',
        phone: '+9876543210',
        email: 'jane@newsupplier.com',
        address: '456 New St, New City',
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.suppliers).toHaveLength(initialCount + 1);
      expect(result.current.suppliers[initialCount]).toMatchObject({
        ...newSupplier,
        id: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should add supplier successfully to Supabase', async () => {
      const newSupplier = {
        name: 'New Supplier',
        contact_person: 'Jane Doe',
        phone: '+9876543210',
        email: 'jane@newsupplier.com',
        address: '456 New St, New City',
        restaurant_id: 'rest-1',
      };

      mockSupabase.single.mockResolvedValue({ data: mockSupplier, error: null });

      const { result } = renderHook(() => useInventoryStore());
      const initialCount = result.current.suppliers.length;

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockSupabase.insert).toHaveBeenCalledWith(newSupplier);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(result.current.suppliers).toHaveLength(initialCount + 1);
    });

    it('should handle add supplier error', async () => {
      const errorMessage = 'Failed to add supplier';
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const { result } = renderHook(() => useInventoryStore());

      const newSupplier = {
        name: 'New Supplier',
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should throw error for unauthorized user', async () => {
      const mockGetState = jest.fn().mockReturnValue({
        user: null,
        ability: {
          can: jest.fn().mockReturnValue(false),
          cannot: jest.fn().mockReturnValue(true),
        },
      });
      
      mockUseAuthStore.mockReturnValue({
        user: null,
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
      
      (mockUseAuthStore as any).getState = mockGetState;

      const { result } = renderHook(() => useInventoryStore());

      const newSupplier = {
        name: 'New Supplier',
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.error).toBe('You must be logged in to perform this action');
    });

    it('should throw error for insufficient permissions', async () => {
      const mockGetState = jest.fn().mockReturnValue({
        user: mockUser,
        ability: {
          can: jest.fn().mockReturnValue(false),
          cannot: jest.fn().mockReturnValue(true),
        },
      });
      
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
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
      
      (mockUseAuthStore as any).getState = mockGetState;

      const { result } = renderHook(() => useInventoryStore());

      const newSupplier = {
        name: 'New Supplier',
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addSupplier(newSupplier);
      });

      expect(result.current.error).toBe('Only managers can perform this action');
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier successfully in demo mode', async () => {
      mockIsDemoMode.mockReturnValue(true);
      
      const { result } = renderHook(() => useInventoryStore());
      
      // First add a supplier
      await act(async () => {
        await result.current.addSupplier({
          name: 'Original Supplier',
          restaurant_id: 'rest-1',
        });
      });

      const supplierId = result.current.suppliers[0].id;
      const updates = { name: 'Updated Supplier' };

      await act(async () => {
        await result.current.updateSupplier(supplierId, updates);
      });

      expect(result.current.suppliers[0].name).toBe('Updated Supplier');
      expect(result.current.suppliers[0].updated_at).toBeDefined();
    });

    it('should update supplier successfully in Supabase', async () => {
      const updatedSupplier = { ...mockSupplier, name: 'Updated Supplier' };
      mockSupabase.single.mockResolvedValue({ data: updatedSupplier, error: null });

      const { result } = renderHook(() => useInventoryStore());
      
      // Set initial state
      act(() => {
        result.current.suppliers.push(mockSupplier);
      });

      const updates = { name: 'Updated Supplier' };

      await act(async () => {
        await result.current.updateSupplier(mockSupplier.id, updates);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockSupplier.id);
      expect(result.current.suppliers[0].name).toBe('Updated Supplier');
    });

    it('should handle update supplier error', async () => {
      const errorMessage = 'Failed to update supplier';
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const { result } = renderHook(() => useInventoryStore());

      const updates = { name: 'Updated Supplier' };

      await act(async () => {
        await result.current.updateSupplier('supplier-1', updates);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteSupplier', () => {
    it('should delete supplier successfully in demo mode', async () => {
      mockIsDemoMode.mockReturnValue(true);

      const { result } = renderHook(() => useInventoryStore());

      // First add a supplier
      await act(async () => {
        await result.current.addSupplier({
          name: 'Supplier to Delete',
          restaurant_id: 'rest-1',
        });
      });

      const initialCount = result.current.suppliers.length;
      // Get the most recently added supplier (last in array)
      const supplierId = result.current.suppliers[result.current.suppliers.length - 1].id;

      await act(async () => {
        await result.current.deleteSupplier(supplierId);
      });

      expect(result.current.suppliers).toHaveLength(initialCount - 1);
      expect(result.current.suppliers.find(s => s.id === supplierId)).toBeUndefined();
    });

    it('should delete supplier successfully in Supabase', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useInventoryStore());

      // Set initial state with fetchSuppliers
      await act(async () => {
        mockSupabase.order.mockResolvedValue({ data: [mockSupplier], error: null });
        await result.current.fetchSuppliers();
      });

      const initialCount = result.current.suppliers.length;

      await act(async () => {
        await result.current.deleteSupplier(mockSupplier.id);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockSupplier.id);
      expect(result.current.suppliers).toHaveLength(initialCount - 1);
    });

    it('should handle delete supplier error', async () => {
      const errorMessage = 'Failed to delete supplier';
      mockSupabase.eq.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const { result } = renderHook(() => useInventoryStore());

      await act(async () => {
        await result.current.deleteSupplier('supplier-1');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });
});
