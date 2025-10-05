import { render, screen } from '@testing-library/react';
import AlertsPage from '@/app/dashboard/alerts/page';
import AlertsList from '@/components/alerts/AlertsList';

// Mock the AlertsList component
jest.mock('@/components/alerts/AlertsList', () => {
  return function MockAlertsList() {
    return <div data-testid="alerts-list">Alerts List Component</div>;
  };
});

describe('AlertsPage', () => {
  it('should render AlertsList component', () => {
    render(<AlertsPage />);

    expect(screen.getByTestId('alerts-list')).toBeInTheDocument();
    expect(screen.getByText('Alerts List Component')).toBeInTheDocument();
  });

  it('should render only the AlertsList component', () => {
    const { container } = render(<AlertsPage />);

    // Should only have one direct child (the AlertsList)
    expect(container.children).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('data-testid', 'alerts-list');
  });

  it('should be a simple wrapper component', () => {
    const { container } = render(<AlertsPage />);

    // The component should be minimal and just render the AlertsList
    expect(container.innerHTML).toBe('<div data-testid="alerts-list">Alerts List Component</div>');
  });
});
