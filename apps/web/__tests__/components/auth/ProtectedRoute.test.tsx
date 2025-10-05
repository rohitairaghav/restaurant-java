import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/lib/stores/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/stores/auth');

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('ProtectedRoute', () => {
  const mockInitialize = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    jest.clearAllMocks();
  });

  it('should show loading state while initializing', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Check for loading spinner
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should render children when user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@test.com',
        role: 'manager',
        restaurant_id: 'rest-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      loading: false,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to unauthorized when user role does not match', async () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'staff@test.com',
        role: 'staff',
        restaurant_id: 'rest-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      loading: false,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(
      <ProtectedRoute requiredRole="manager">
        <div>Manager Only Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('should render children when user role matches required role', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'manager@test.com',
        role: 'manager',
        restaurant_id: 'rest-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      loading: false,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(
      <ProtectedRoute requiredRole="manager">
        <div>Manager Only Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Manager Only Content')).toBeInTheDocument();
  });

  it('should call initialize on mount', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockInitialize).toHaveBeenCalled();
  });
});
