import { renderHook } from '@testing-library/react';
import { useAbility, useCan, useCannot, useCurrentUser, useIsManager, useIsStaff } from '@/lib/hooks/useAbility';
import { useAuthStore } from '@/lib/stores/auth';
import { defineAbilitiesFor } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/auth');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('useAbility Hooks', () => {
  const mockManager = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockStaff = {
    id: 'user-2',
    email: 'staff@test.com',
    role: 'staff' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAbility', () => {
    it('should return ability from auth store', () => {
      const ability = defineAbilitiesFor(mockManager);
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ability });
        }
        return ability;
      });

      const { result } = renderHook(() => useAbility());

      expect(result.current).toBeDefined();
      expect(result.current.can).toBeDefined();
    });
  });

  describe('useCan', () => {
    it('should return true when user has permission', () => {
      const ability = defineAbilitiesFor(mockManager);
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ability });
        }
        return ability;
      });

      const { result } = renderHook(() => useCan('create', 'InventoryItem'));

      expect(result.current).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const ability = defineAbilitiesFor(mockStaff);
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ability });
        }
        return ability;
      });

      const { result } = renderHook(() => useCan('delete', 'UserProfile'));

      expect(result.current).toBe(false);
    });
  });

  describe('useCannot', () => {
    it('should return false when user has permission', () => {
      const ability = defineAbilitiesFor(mockManager);
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ability });
        }
        return ability;
      });

      const { result } = renderHook(() => useCannot('create', 'InventoryItem'));

      expect(result.current).toBe(false);
    });

    it('should return true when user lacks permission', () => {
      const ability = defineAbilitiesFor(mockStaff);
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ability });
        }
        return ability;
      });

      const { result } = renderHook(() => useCannot('delete', 'UserProfile'));

      expect(result.current).toBe(true);
    });
  });

  describe('useCurrentUser', () => {
    it('should return current user from auth store', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockManager });
        }
        return mockManager;
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toEqual(mockManager);
    });

    it('should return null when no user is logged in', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toBeNull();
    });
  });

  describe('useIsManager', () => {
    it('should return true for manager role', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockManager });
        }
        return mockManager;
      });

      const { result } = renderHook(() => useIsManager());

      expect(result.current).toBe(true);
    });

    it('should return false for staff role', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockStaff });
        }
        return mockStaff;
      });

      const { result } = renderHook(() => useIsManager());

      expect(result.current).toBe(false);
    });

    it('should return false when no user', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      const { result } = renderHook(() => useIsManager());

      expect(result.current).toBe(false);
    });
  });

  describe('useIsStaff', () => {
    it('should return true for staff role', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockStaff });
        }
        return mockStaff;
      });

      const { result } = renderHook(() => useIsStaff());

      expect(result.current).toBe(true);
    });

    it('should return false for manager role', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockManager });
        }
        return mockManager;
      });

      const { result } = renderHook(() => useIsStaff());

      expect(result.current).toBe(false);
    });

    it('should return false when no user', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      const { result } = renderHook(() => useIsStaff());

      expect(result.current).toBe(false);
    });
  });
});
