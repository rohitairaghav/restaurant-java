import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/stores/auth';
import { defineAbilitiesFor } from '@restaurant-inventory/shared';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      ability: defineAbilitiesFor(null),
      loading: true,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'manager' as const,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });

      const mockFrom = mockSupabase.from();
      mockFrom.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.ability).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it('should handle sign in error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        })
      ).rejects.toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        role: 'staff' as const,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });

      const mockFrom = mockSupabase.from();
      mockFrom.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password', 'staff', 'rest1');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password',
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.ability).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      // Set initial user state
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'manager',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
        loading: false,
      });

      mockSupabase.auth.signOut.mockResolvedValue({});

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with existing session', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'manager' as const,
        restaurant_id: 'rest1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '1' } } },
      });

      const mockFrom = mockSupabase.from();
      mockFrom.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.ability).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it('should initialize without session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});