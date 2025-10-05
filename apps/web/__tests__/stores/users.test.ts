import { renderHook, act } from '@testing-library/react';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';
import { defineAbilitiesFor } from '@restaurant-inventory/shared';

// Mock fetch globally
global.fetch = jest.fn();

let mockIsDemoMode = false;
jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => mockIsDemoMode,
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
    (global.fetch as jest.Mock).mockReset();
    mockIsDemoMode = false;
  });

  describe('fetchUsers', () => {
    it('should fetch users for manager', async () => {
      const mockUsers = [mockManager, mockStaff];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockUsers }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users');
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

      expect(result.current.error).toBe('Only managers can perform this action');
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

      const mockProfile = {
        id: 'new-user-1',
        email: newUserInput.email,
        role: newUserInput.role,
        restaurant_id: newUserInput.restaurant_id,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProfile }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.addUser(newUserInput);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserInput),
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

      await act(async () => {
        try {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'rest-1',
          });
        } catch (error) {
          // Expected to throw, error should be set in state
        }
      });

      expect(result.current.error).toBe('Only managers can perform this action');
    });

    it('should prevent adding user to different restaurant', async () => {
      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'different-restaurant',
          });
        } catch (error) {
          // Expected to throw, error should be set in state
        }
      });

      expect(result.current.error).toBe('You can only access data from your own restaurant');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates = { email: 'updated@test.com' };
      const updatedUser = { ...mockStaff, ...updates };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: updatedUser }),
      });

      const { result } = renderHook(() => useUsersStore());

      // Set initial users
      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.updateUser(mockStaff.id, updates);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${mockStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      expect(result.current.users.find(u => u.id === mockStaff.id)?.email).toBe(updates.email);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsersStore());

      // Set initial users
      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.deleteUser(mockStaff.id);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${mockStaff.id}`, {
        method: 'DELETE',
      });

      expect(result.current.users).not.toContainEqual(mockStaff);
      expect(result.current.loading).toBe(false);
    });

    it('should prevent deleting self', async () => {
      const { result } = renderHook(() => useUsersStore());

      // Set initial users
      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        try {
          await result.current.deleteUser(mockManager.id);
        } catch (error) {
          // Expected to throw, error should be set in state
        }
      });

      expect(result.current.error).toBe('Cannot delete your own account');
      expect(result.current.users).toContainEqual(mockManager);
    });
  });

  describe('Demo Mode Tests', () => {
    beforeEach(() => {
      mockIsDemoMode = true;
    });

    it('should fetch users in demo mode', async () => {
      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.users.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should add user in demo mode', async () => {
      const { result } = renderHook(() => useUsersStore());

      const newUserInput = {
        email: 'demouser@test.com',
        password: 'password123',
        role: 'staff' as const,
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addUser(newUserInput);
      });

      expect(result.current.users.length).toBeGreaterThan(0);
      expect(result.current.users.some(u => u.email === newUserInput.email)).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should update user in demo mode', async () => {
      const { result } = renderHook(() => useUsersStore());

      // First add a user
      const newUserInput = {
        email: 'demouser@test.com',
        password: 'password123',
        role: 'staff' as const,
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addUser(newUserInput);
      });

      const addedUser = result.current.users.find(u => u.email === newUserInput.email);
      if (!addedUser) return;

      const updates = { email: 'updated@test.com' };

      await act(async () => {
        await result.current.updateUser(addedUser.id, updates);
      });

      const updatedUser = result.current.users.find(u => u.id === addedUser.id);
      expect(updatedUser?.email).toBe(updates.email);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should delete user in demo mode', async () => {
      const { result } = renderHook(() => useUsersStore());

      // First add a user
      const newUserInput = {
        email: 'demouser@test.com',
        password: 'password123',
        role: 'staff' as const,
        restaurant_id: 'rest-1',
      };

      await act(async () => {
        await result.current.addUser(newUserInput);
      });

      const addedUser = result.current.users.find(u => u.email === newUserInput.email);
      if (!addedUser) return;

      const initialLength = result.current.users.length;

      await act(async () => {
        await result.current.deleteUser(addedUser.id);
      });

      expect(result.current.users.length).toBe(initialLength - 1);
      expect(result.current.users.find(u => u.id === addedUser.id)).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle fetch users error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Database error' }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toBe('Database error');
      expect(result.current.loading).toBe(false);
    });

    it('should handle fetch users error without message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toBe('Failed to fetch users');
      expect(result.current.loading).toBe(false);
    });

    it('should handle unauthorized fetch users', async () => {
      useAuthStore.setState({
        user: null,
        ability: defineAbilitiesFor(null),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toBe('You must be logged in to perform this action');
    });

    it('should handle add user API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'rest-1',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Email already exists');
    });

    it('should handle add user API error without message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'rest-1',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to create user');
    });

    it('should handle unauthorized add user', async () => {
      useAuthStore.setState({
        user: null,
        ability: defineAbilitiesFor(null),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.addUser({
            email: 'test@test.com',
            password: 'password',
            role: 'staff',
            restaurant_id: 'rest-1',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('You must be logged in to perform this action');
    });

    it('should handle update user API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        try {
          await result.current.updateUser(mockStaff.id, { email: 'updated@test.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('User not found');
    });

    it('should handle update user API error without message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        try {
          await result.current.updateUser(mockStaff.id, { email: 'updated@test.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to update user');
    });

    it('should handle unauthorized update user', async () => {
      useAuthStore.setState({
        user: null,
        ability: defineAbilitiesFor(null),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.updateUser('user-1', { email: 'updated@test.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('You must be logged in to perform this action');
    });

    it('should handle staff trying to update user', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.updateUser('user-1', { email: 'updated@test.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Only managers can perform this action');
    });

    it('should prevent manager from changing own role', async () => {
      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.updateUser(mockManager.id, { role: 'staff' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Cannot change your own role');
    });

    it('should handle delete user API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        try {
          await result.current.deleteUser(mockStaff.id);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('User not found');
    });

    it('should handle delete user API error without message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        try {
          await result.current.deleteUser(mockStaff.id);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to delete user');
    });

    it('should handle unauthorized delete user', async () => {
      useAuthStore.setState({
        user: null,
        ability: defineAbilitiesFor(null),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.deleteUser('user-1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('You must be logged in to perform this action');
    });

    it('should handle staff trying to delete user', async () => {
      useAuthStore.setState({
        user: mockStaff,
        ability: defineAbilitiesFor(mockStaff),
        loading: false,
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        try {
          await result.current.deleteUser('user-1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Only managers can perform this action');
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating user role', async () => {
      const updatedUser = { ...mockStaff, role: 'manager' as const };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: updatedUser }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.updateUser(mockStaff.id, { role: 'manager' });
      });

      expect(result.current.users.find(u => u.id === mockStaff.id)?.role).toBe('manager');
    });

    it('should handle empty users list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.users).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle null data from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: null }),
      });

      const { result } = renderHook(() => useUsersStore());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.users).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle updating both email and role', async () => {
      const updates = { email: 'newemail@test.com', role: 'manager' as const };
      const updatedUser = { ...mockStaff, ...updates };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: updatedUser }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      await act(async () => {
        await result.current.updateUser(mockStaff.id, updates);
      });

      const updated = result.current.users.find(u => u.id === mockStaff.id);
      expect(updated?.email).toBe(updates.email);
      expect(updated?.role).toBe(updates.role);
    });

    it('should preserve users in list after failed update', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      const initialUsers = [...result.current.users];

      await act(async () => {
        try {
          await result.current.updateUser(mockStaff.id, { email: 'new@test.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.users).toEqual(initialUsers);
    });

    it('should preserve users in list after failed delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });

      const { result } = renderHook(() => useUsersStore());

      act(() => {
        useUsersStore.setState({ users: [mockManager, mockStaff] });
      });

      const initialUsers = [...result.current.users];

      await act(async () => {
        try {
          await result.current.deleteUser(mockStaff.id);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.users).toEqual(initialUsers);
    });
  });
});
