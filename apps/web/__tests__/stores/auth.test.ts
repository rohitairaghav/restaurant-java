import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/stores/auth';
import { defineAbilitiesFor } from '@restaurant-inventory/shared';

// Mock Supabase with chainable methods
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
const mockInsert = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  eq: mockEq,
  single: mockSingle,
}));

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
  from: mockFrom,
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

// Mock demo mode control
let mockIsDemoMode = false;
jest.mock('@/lib/demo-mode', () => ({
  isDemoMode: () => mockIsDemoMode,
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
    mockIsDemoMode = false;

    // Reset mock implementations
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null });
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

      mockSingle.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
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

      mockSingle.mockResolvedValue({
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

    it('should handle profile fetch error during initialization', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '1' } } },
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should handle auth error during signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Signup failed' },
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.signUp('newuser@example.com', 'password', 'staff', 'rest1');
        })
      ).rejects.toEqual({ message: 'Signup failed' });
    });

    it('should handle profile creation error during signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile creation failed' },
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.signUp('newuser@example.com', 'password', 'staff', 'rest1');
        })
      ).rejects.toEqual({ message: 'Profile creation failed' });
    });
  });

  describe('Demo mode tests', () => {
    beforeEach(() => {
      mockIsDemoMode = true;
    });

    it('should sign in with demo credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('manager@demo.com', 'demo123');
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.role).toBe('manager');
      expect(result.current.ability).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it('should sign in as staff in demo mode', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('staff@demo.com', 'demo123');
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.role).toBe('staff');
      expect(result.current.loading).toBe(false);
    });

    it('should reject invalid demo credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.signIn('invalid@demo.com', 'wrongpass');
        })
      ).rejects.toThrow('Invalid demo credentials');
    });

    it('should initialize without fetching in demo mode', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.loading).toBe(false);
      // Should not call Supabase in demo mode
      expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
    });

    it('should preserve user state during initialization in demo mode', async () => {
      const demoUser = {
        id: 'demo-1',
        email: 'manager@demo.com',
        role: 'manager' as const,
        restaurant_id: 'demo-rest',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      useAuthStore.setState({
        user: demoUser,
        ability: defineAbilitiesFor(demoUser),
        loading: false,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toEqual(demoUser);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null session user during sign in', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      // User should remain null if auth doesn't return a user
      expect(result.current.user).toBeNull();
    });

    it('should handle null user during signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password', 'staff', 'rest1');
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle profile fetch error during sign in', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile error' },
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'password');
        })
      ).rejects.toEqual({ message: 'Profile error' });
    });

    it('should clear user state on sign out', async () => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'manager',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
        ability: defineAbilitiesFor({
          id: '1',
          email: 'test@example.com',
          role: 'manager',
          restaurant_id: 'rest1',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        }),
        loading: false,
      });

      mockSupabase.auth.signOut.mockResolvedValue({});

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.ability).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it('should define abilities correctly for null user', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.ability).toBeDefined();
      expect(result.current.user).toBeNull();
    });
  });
});