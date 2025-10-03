import { create } from 'zustand';
import type { User } from '@restaurant-inventory/shared';
import { PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { isDemoMode } from '../demo-mode';
import { useAuthStore } from './auth';

interface UserInput {
  email: string;
  password: string;
  role: 'manager' | 'staff';
  restaurant_id: string;
}

interface UserUpdate {
  email?: string;
  role?: 'manager' | 'staff';
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  addUser: (user: UserInput) => Promise<void>;
  updateUser: (id: string, updates: UserUpdate) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

// Mock users for demo mode
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'manager@demo.com',
    role: 'manager',
    restaurant_id: 'demo-restaurant',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'staff@demo.com',
    role: 'staff',
    restaurant_id: 'demo-restaurant',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      // Permission check
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('read', 'UserProfile')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ users: mockUsers, loading: false });
        return;
      }

      // Use API route
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const { data } = await response.json();
      set({ users: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addUser: async (userInput: UserInput) => {
    set({ loading: true, error: null });
    try {
      // Permission check
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'UserProfile')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      // Ensure user is added to the same restaurant
      if (userInput.restaurant_id !== user.restaurant_id) {
        throw new Error(PERMISSION_ERRORS.WRONG_RESTAURANT);
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser: User = {
          id: `user-${Date.now()}`,
          email: userInput.email,
          role: userInput.role,
          restaurant_id: userInput.restaurant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set(state => ({
          users: [newUser, ...state.users],
          loading: false,
        }));
        return;
      }

      // Use API route
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const { data: profile } = await response.json();

      set(state => ({
        users: [profile, ...state.users],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUser: async (id: string, updates: UserUpdate) => {
    set({ loading: true, error: null });
    try {
      // Permission check
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'UserProfile')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      // Cannot update own role (prevent privilege escalation/removal)
      if (id === user.id && updates.role && updates.role !== user.role) {
        throw new Error('Cannot change your own role');
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => ({
          users: state.users.map(u =>
            u.id === id
              ? { ...u, ...updates, updated_at: new Date().toISOString() }
              : u
          ),
          loading: false,
        }));
        return;
      }

      // Use API route
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const { data: profile } = await response.json();

      set(state => ({
        users: state.users.map(u => (u.id === id ? profile : u)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Permission check
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('delete', 'UserProfile')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      // Cannot delete yourself
      if (id === user.id) {
        throw new Error('Cannot delete your own account');
      }

      if (isDemoMode()) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => ({
          users: state.users.filter(u => u.id !== id),
          loading: false,
        }));
        return;
      }

      // Use API route
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      set(state => ({
        users: state.users.filter(u => u.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
