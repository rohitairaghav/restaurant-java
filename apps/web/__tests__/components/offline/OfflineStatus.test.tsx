import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfflineStatus from '@/components/offline/OfflineStatus';
import { syncManager } from '@/lib/offline/sync';

// Mock the sync manager
jest.mock('@/lib/offline/sync', () => ({
  syncManager: {
    setupOnlineListener: jest.fn(),
    syncOfflineData: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>,
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className}>Refresh</div>
  ),
}));

describe('OfflineStatus', () => {
  let onlineSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.onLine
    onlineSpy = jest.spyOn(navigator, 'onLine', 'get');
    onlineSpy.mockReturnValue(true);
  });

  afterEach(() => {
    onlineSpy.mockRestore();
  });

  it('should display online status when connected', () => {
    render(<OfflineStatus />);

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
  });

  it('should display offline status when disconnected', () => {
    onlineSpy.mockReturnValue(false);

    render(<OfflineStatus />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
  });

  it('should show sync button when online', () => {
    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    expect(syncButton).toBeInTheDocument();
  });

  it('should not show sync button when offline', () => {
    onlineSpy.mockReturnValue(false);

    render(<OfflineStatus />);

    expect(screen.queryByTitle('Sync offline changes')).not.toBeInTheDocument();
  });

  it('should trigger sync when sync button is clicked', async () => {
    (syncManager.syncOfflineData as jest.Mock).mockResolvedValue(undefined);

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncManager.syncOfflineData).toHaveBeenCalled();
    });
  });

  it('should show spinning icon while syncing', async () => {
    (syncManager.syncOfflineData as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    // Check for spinning class
    await waitFor(() => {
      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon.className).toContain('animate-spin');
    });
  });

  it('should setup online listener on mount', () => {
    render(<OfflineStatus />);

    expect(syncManager.setupOnlineListener).toHaveBeenCalled();
  });

  it('should handle sync errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (syncManager.syncOfflineData as jest.Mock).mockRejectedValue(new Error('Sync failed'));

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Manual sync failed:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should disable sync button while syncing', async () => {
    (syncManager.syncOfflineData as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    expect(syncButton).toBeDisabled();
  });

  it('should handle online event', async () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineStatus />);

    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Trigger online event
    onlineSpy.mockReturnValue(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  it('should handle offline event', async () => {
    onlineSpy.mockReturnValue(true);
    render(<OfflineStatus />);

    expect(screen.getByText('Online')).toBeInTheDocument();

    // Trigger offline event
    onlineSpy.mockReturnValue(false);
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  it('should not sync when offline', async () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineStatus />);

    // Since there's no sync button when offline, the manual sync shouldn't be called
    expect(screen.queryByTitle('Sync offline changes')).not.toBeInTheDocument();
  });

  it('should display success background when online', () => {
    onlineSpy.mockReturnValue(true);
    const { container } = render(<OfflineStatus />);

    const statusDiv = container.firstChild as HTMLElement;
    expect(statusDiv.className).toContain('bg-success-50');
    expect(statusDiv.className).toContain('text-success-700');
  });

  it('should display warning background when offline', () => {
    onlineSpy.mockReturnValue(false);
    const { container } = render(<OfflineStatus />);

    const statusDiv = container.firstChild as HTMLElement;
    expect(statusDiv.className).toContain('bg-warning-50');
    expect(statusDiv.className).toContain('text-warning-700');
  });

  it('should stop spinning after sync completes', async () => {
    (syncManager.syncOfflineData as jest.Mock).mockResolvedValue(undefined);

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    // Wait for sync to complete
    await waitFor(() => {
      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon.className).not.toContain('animate-spin');
    });
  });

  it('should stop spinning even on sync error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (syncManager.syncOfflineData as jest.Mock).mockRejectedValue(new Error('Sync failed'));

    render(<OfflineStatus />);

    const syncButton = screen.getByTitle('Sync offline changes');
    fireEvent.click(syncButton);

    await waitFor(() => {
      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon.className).not.toContain('animate-spin');
    });

    consoleError.mockRestore();
  });

  it('should call setupOnlineListener with callback', () => {
    render(<OfflineStatus />);

    expect(syncManager.setupOnlineListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<OfflineStatus />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
