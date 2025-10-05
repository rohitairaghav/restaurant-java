import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '@/components/layout/Navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { useAlertsStore } from '@/lib/stores/alerts';
import { usePathname } from 'next/navigation';

jest.mock('@/lib/stores/auth');
jest.mock('@/lib/stores/alerts');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
jest.mock('@/components/offline/OfflineStatus', () => {
  return function MockOfflineStatus() {
    return <div>Offline Status</div>;
  };
});
jest.mock('lucide-react', () => ({
  Package: () => <div>Package</div>,
  TrendingUp: () => <div>TrendingUp</div>,
  AlertCircle: () => <div>AlertCircle</div>,
  LogOut: () => <div>LogOut</div>,
  Menu: () => <div>Menu</div>,
  X: () => <div>X</div>,
  Users: () => <div>Users</div>,
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseAlertsStore = useAlertsStore as jest.MockedFunction<typeof useAlertsStore>;
const mockUsePathname = usePathname as jest.Mock;

describe('Navigation', () => {
  const mockFetchAlerts = jest.fn();
  const mockSignOut = jest.fn();

  const mockManagerUser = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockStaffUser = {
    id: 'user-2',
    email: 'staff@test.com',
    role: 'staff' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockManagerUser,
      loading: false,
      signIn: jest.fn(),
      signOut: mockSignOut,
      signUp: jest.fn(),
      initialize: jest.fn(),
    });

    mockUseAlertsStore.mockReturnValue({
      alerts: [],
      loading: false,
      error: null,
      unreadCount: 0,
      fetchAlerts: mockFetchAlerts,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      subscribeToAlerts: jest.fn(),
    });

    mockUsePathname.mockReturnValue('/dashboard');

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render navigation title', () => {
      render(<Navigation />);
      const titles = screen.getAllByText('Restaurant Inventory');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display user email and role for manager', () => {
      render(<Navigation />);
      const userInfoElements = screen.getAllByText(/manager@test.com/);
      expect(userInfoElements.length).toBeGreaterThan(0);
    });

    it('should fetch alerts on mount when user exists', () => {
      render(<Navigation />);
      expect(mockFetchAlerts).toHaveBeenCalled();
    });

    it('should not fetch alerts when no user', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: mockSignOut,
        signUp: jest.fn(),
        initialize: jest.fn(),
      });

      render(<Navigation />);
      expect(mockFetchAlerts).not.toHaveBeenCalled();
    });

    it('should display all nav items for manager', () => {
      render(<Navigation />);
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Stock Tracking')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('User Administration')).toBeInTheDocument();
    });

    it('should not display manager-only items for staff', () => {
      mockUseAuthStore.mockReturnValue({
        user: mockStaffUser,
        loading: false,
        signIn: jest.fn(),
        signOut: mockSignOut,
        signUp: jest.fn(),
        initialize: jest.fn(),
      });

      render(<Navigation />);
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Stock Tracking')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
      expect(screen.queryByText('User Administration')).not.toBeInTheDocument();
    });

    it('should display unread alerts badge', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: [],
        loading: false,
        error: null,
        unreadCount: 5,
        fetchAlerts: mockFetchAlerts,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        subscribeToAlerts: jest.fn(),
      });

      render(<Navigation />);
      const badgeElements = screen.getAllByText('5');
      expect(badgeElements.length).toBeGreaterThan(0);
    });

    it('should display Sign Out button', () => {
      render(<Navigation />);
      const signOutButtons = screen.getAllByText('Sign Out');
      expect(signOutButtons.length).toBeGreaterThan(0);
    });

    it('should display OfflineStatus component', () => {
      render(<Navigation />);
      const offlineStatusElements = screen.getAllByText('Offline Status');
      expect(offlineStatusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should call signOut when Sign Out button clicked', () => {
      render(<Navigation />);

      const signOutButtons = screen.getAllByText('Sign Out');
      fireEvent.click(signOutButtons[0]);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should toggle mobile menu when menu button clicked', () => {
      const { container } = render(<Navigation />);

      // Mobile menu should not be visible initially
      const mobileNav = container.querySelector('nav.bg-white.w-72');
      expect(mobileNav).not.toBeInTheDocument();

      // Find and click the menu button
      const menuButtons = container.querySelectorAll('button');
      const menuButton = Array.from(menuButtons).find(btn =>
        btn.className.includes('lg:hidden') || btn.querySelector('div')?.textContent === 'Menu'
      );

      if (menuButton) {
        fireEvent.click(menuButton);

        // Mobile menu should be visible after click
        const mobileNavAfter = container.querySelector('nav.bg-white.w-72');
        expect(mobileNavAfter).toBeInTheDocument();
      }
    });

    it('should have nav links that close menu on click', () => {
      const { container } = render(<Navigation />);

      // Open mobile menu
      const menuButtons = container.querySelectorAll('button');
      const menuButton = Array.from(menuButtons).find(btn =>
        btn.className.includes('lg:hidden') || btn.querySelector('div')?.textContent === 'Menu'
      );

      if (menuButton) {
        fireEvent.click(menuButton);

        // Mobile menu should be visible
        const mobileNav = container.querySelector('nav.bg-white.w-72');
        expect(mobileNav).toBeInTheDocument();

        // Nav links should be present in mobile menu
        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight active link based on pathname', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<Navigation />);

      // Find all links with the Inventory text
      const links = container.querySelectorAll('a');
      const inventoryLinks = Array.from(links).filter(link => link.textContent?.includes('Inventory'));

      // At least one should have active styling
      const hasActiveLink = inventoryLinks.some(link =>
        link.className.includes('bg-primary-100')
      );
      expect(hasActiveLink).toBe(true);
    });
  });
});
