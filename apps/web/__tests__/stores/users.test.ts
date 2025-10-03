import { renderHook, act } from '@testing-library/react';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';
import { defineAbilitiesFor } from '@restaurant-inventory/shared';

// Mock Supabase
const mockSupabase = {
  auth: {
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => false,
}));

describe('Users Store', () => {
  const mockManager = {
    id: 'manager-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockStaff = {
    id: 'staff-1',
    email: 'staff@test.com',
    role: 'staff' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    // Reset stores
    useUsersStore.setState({
      users: [],
      loading: false,
      error: null,
    });

    useAuthStore.setState({
      user: mockManager,
      ability: defineAbilitiesFor(mockManager),
      loading: false,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('should fetch users for manager', async () => {
      const mockUsers = [mockManager, mockStaff];

      const mockFrom = mockSupabase.from();
      mockFrom.single = jest.fn();
      (mockFrom.order as jest.Mock).mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.loading).toBe(false);
    });

    it('should deny access to staff', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toContain('Only managers');
      expect(result.current.users).toEqual([]);
    });
  });

  describe('addUser', () => {
    it('should add user successfully', async () => {
      const newUserInput = {
        email: 'newuser@test.com',
        password: 'password123',
        role: 'staff' as const,
        restaurant_id: 'rest-1',
      };

      const mockAuthUser = { id: 'new-user-1' };
      const mockProfile = {
        id: 'new-user-1',
        email: newUserInput.email,
        role: newUserInput.role,
        restaurant_id: newUserInput.restaurant_id,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });

      const mockFrom = mockSupabase.from();
      mockFrom.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.addUser(newUserInput);
      });

      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: newUserInput.email,
        password: newUserInput.password,
        email_confirm: true,
      });

      expect(result.current.users).toContainEqual(mockProfile);
      expect(result.current.loading).toBe(false);
    });

    it('should deny access to staff', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'rest-1',
          });
        });
      }).rejects.toThrow('Only managers');
    });

    it('should prevent adding user to different restaurant', async () => {
      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'different-restaurant',
          });
        });
      }).rejects.toThrow('own restaurant');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates = { email: 'updated@test.com' };
      const updatedUser = { ...mockStaff, ...updates };

      const mockFrom = mockSupabase.from();
      mockFrom.single.mockResolvedValue({
        data: updatedUser,
        error: null,
      });

      const { result } = renderHook(() => useUsersStore());

      // Set initial users
      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.updateUser(mockStaff.id, updates);
      });

      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(
        mockStaff.id,
        { email: updates.email }
      );

      const updatedStaff = result.current.users.find(u => u.id === mockStaff.id);
      expect(updatedStaff?.email).toBe(updates.email);
    });

    it('should prevent changing own role', async () => {
      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.updateUser(mockManager.id, { role: 'staff' });
        });
      }).rejects.toThrow('Cannot change your own role');
    });

    it('should deny access to staff', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.updateUser('user-1', { email: 'test@test.com' });
        });
      }).rejects.toThrow('Only managers');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockFrom = mockSupabase.from();
      (mockFrom.delete as jest.Mock).mockResolvedValue({
        error: null,
      });

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useUsersStore());

      // Set initial users
      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.deleteUser(mockStaff.id);
      });

      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(mockStaff.id);
      expect(result.current.users).not.toContainEqual(mockStaff);
      expect(result.current.users).toHaveLength(1);
    });

    it('should prevent deleting own account', async () => {
      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteUser(mockManager.id);
        });
      }).rejects.toThrow('Cannot delete your own account');
    });

    it('should deny access to staff', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteUser('user-1');
        });
      }).rejects.toThrow('Only managers');
    });
  });
});
