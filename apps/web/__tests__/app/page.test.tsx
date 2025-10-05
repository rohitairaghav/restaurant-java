import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '@/app/page';
import { useAuthStore } from '@/lib/stores/auth';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth store
jest.mock('@/lib/stores/auth', () => ({
  useAuthStore: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('HomePage', () => {
  const mockInitialize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('should show loading spinner when loading', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
    });

    render(<HomePage />);

    // Check for the loading spinner container and the spinning element
    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();
    expect(screen.getByText('', { selector: '.flex.items-center.justify-center.min-h-screen' })).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is authenticated', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'manager' as const,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      loading: false,
      initialize: mockInitialize,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialize: mockInitialize,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should call initialize on mount', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
    });

    render(<HomePage />);

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('should not redirect while loading', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
    });

    render(<HomePage />);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle user state changes', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'staff' as const,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    // Start with loading
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
    });

    const { rerender } = render(<HomePage />);

    expect(mockPush).not.toHaveBeenCalled();

    // Update to authenticated user
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      loading: false,
      initialize: mockInitialize,
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle loading state changes', async () => {
    // Start with loading
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialize: mockInitialize,
    });

    const { rerender } = render(<HomePage />);

    // Check for the loading spinner
    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();

    // Update to not loading
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialize: mockInitialize,
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should return null when not loading and user state is determined', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialize: mockInitialize,
    });

    const { container } = render(<HomePage />);

    // Should not render the loading spinner
    expect(container.firstChild).toBeNull();
  });
});
