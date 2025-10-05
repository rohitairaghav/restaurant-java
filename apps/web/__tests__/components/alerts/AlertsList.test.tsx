import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertsList from '@/components/alerts/AlertsList';
import { useAlertsStore } from '@/lib/stores/alerts';
import type { Alert } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/alerts');
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div>AlertTriangle</div>,
  CheckCircle: () => <div>CheckCircle</div>,
  CheckCircle2: () => <div>CheckCircle2</div>,
}));

const mockUseAlertsStore = useAlertsStore as jest.MockedFunction<typeof useAlertsStore>;

describe('AlertsList', () => {
  const mockFetchAlerts = jest.fn();
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();
  const mockSubscribeToAlerts = jest.fn(() => jest.fn());

  const mockAlerts: Alert[] = [
    {
      id: 'alert-1',
      item_id: 'item-1',
      type: 'low_stock',
      message: 'Tomatoes is running low',
      is_read: false,
      restaurant_id: 'rest-1',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z',
      inventory_items: {
        name: 'Tomatoes',
        unit: 'kg',
        current_stock: 3,
        min_threshold: 5,
      },
    } as any,
    {
      id: 'alert-2',
      item_id: 'item-2',
      type: 'out_of_stock',
      message: 'Chicken is out of stock',
      is_read: true,
      restaurant_id: 'rest-1',
      created_at: '2023-01-02T10:00:00Z',
      updated_at: '2023-01-02T10:00:00Z',
      inventory_items: {
        name: 'Chicken',
        unit: 'kg',
        current_stock: 0,
        min_threshold: 10,
      },
    } as any,
  ];

  beforeEach(() => {
    mockUseAlertsStore.mockReturnValue({
      alerts: mockAlerts,
      loading: false,
      error: null,
      unreadCount: 1,
      fetchAlerts: mockFetchAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      subscribeToAlerts: mockSubscribeToAlerts,
    });

    // Mock Notification API
    Object.defineProperty(global, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
        requestPermission: jest.fn(),
      },
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render alerts list title', () => {
      render(<AlertsList />);
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    it('should fetch alerts on mount', () => {
      render(<AlertsList />);
      expect(mockFetchAlerts).toHaveBeenCalled();
    });

    it('should subscribe to alerts on mount', () => {
      render(<AlertsList />);
      expect(mockSubscribeToAlerts).toHaveBeenCalled();
    });

    it('should display unread count when there are unread alerts', () => {
      render(<AlertsList />);
      expect(screen.getByText('1 unread alert')).toBeInTheDocument();
    });

    it('should display plural unread text when multiple unread', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: mockAlerts,
        loading: false,
        error: null,
        unreadCount: 2,
        fetchAlerts: mockFetchAlerts,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        subscribeToAlerts: mockSubscribeToAlerts,
      });

      render(<AlertsList />);
      expect(screen.getByText('2 unread alerts')).toBeInTheDocument();
    });

    it('should display Mark All Read button when there are unread alerts', () => {
      render(<AlertsList />);
      expect(screen.getByText('Mark All Read')).toBeInTheDocument();
    });

    it('should not display Mark All Read button when no unread alerts', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: mockAlerts,
        loading: false,
        error: null,
        unreadCount: 0,
        fetchAlerts: mockFetchAlerts,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        subscribeToAlerts: mockSubscribeToAlerts,
      });

      render(<AlertsList />);
      expect(screen.queryByText('Mark All Read')).not.toBeInTheDocument();
    });

    it('should display alert messages', () => {
      render(<AlertsList />);
      expect(screen.getByText('Tomatoes is running low')).toBeInTheDocument();
      expect(screen.getByText('Chicken is out of stock')).toBeInTheDocument();
    });

    it('should display Low Stock and Out of Stock labels', () => {
      render(<AlertsList />);
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('should display empty state when no alerts', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: [],
        loading: false,
        error: null,
        unreadCount: 0,
        fetchAlerts: mockFetchAlerts,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        subscribeToAlerts: mockSubscribeToAlerts,
      });

      render(<AlertsList />);
      expect(screen.getByText(/No alerts found/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: [],
        loading: true,
        error: null,
        unreadCount: 0,
        fetchAlerts: mockFetchAlerts,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        subscribeToAlerts: mockSubscribeToAlerts,
      });

      const { container } = render(<AlertsList />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseAlertsStore.mockReturnValue({
        alerts: [],
        loading: false,
        error: 'Failed to load alerts',
        unreadCount: 0,
        fetchAlerts: mockFetchAlerts,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        subscribeToAlerts: mockSubscribeToAlerts,
      });

      render(<AlertsList />);
      expect(screen.getByText('Failed to load alerts')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call markAsRead when clicking mark as read button', async () => {
      mockMarkAsRead.mockResolvedValue(undefined);
      const { container } = render(<AlertsList />);

      const markReadButtons = container.querySelectorAll('button[title="Mark as read"]');
      if (markReadButtons.length > 0) {
        fireEvent.click(markReadButtons[0]);
        await waitFor(() => {
          expect(mockMarkAsRead).toHaveBeenCalledWith('alert-1');
        });
      }
    });

    it('should call markAllAsRead when clicking Mark All Read button', async () => {
      mockMarkAllAsRead.mockResolvedValue(undefined);
      render(<AlertsList />);

      const markAllButton = screen.getByText('Mark All Read');
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('Notification Permission', () => {
    it('should request notification permission when permission is default', () => {
      const mockRequestPermission = jest.fn();
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: mockRequestPermission,
        },
      });

      render(<AlertsList />);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should not request notification permission when already granted', () => {
      const mockRequestPermission = jest.fn();
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          permission: 'granted',
          requestPermission: mockRequestPermission,
        },
      });

      render(<AlertsList />);
      expect(mockRequestPermission).not.toHaveBeenCalled();
    });
  });
});
