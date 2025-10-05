import { render, screen } from '@testing-library/react';
import AnalyticsPage from '@/app/dashboard/analytics/page';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

// Mock the components
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ 
    children, 
    requiredRole 
  }: { 
    children: React.ReactNode; 
    requiredRole: string; 
  }) {
    return (
      <div data-testid="protected-route" data-required-role={requiredRole}>
        {children}
      </div>
    );
  };
});

jest.mock('@/components/analytics/AnalyticsDashboard', () => {
  return function MockAnalyticsDashboard() {
    return <div data-testid="analytics-dashboard">Analytics Dashboard Component</div>;
  };
});

describe('AnalyticsPage', () => {
  it('should render ProtectedRoute with correct required role', () => {
    render(<AnalyticsPage />);

    const protectedRoute = screen.getByTestId('protected-route');
    expect(protectedRoute).toBeInTheDocument();
    expect(protectedRoute).toHaveAttribute('data-required-role', 'manager');
  });

  it('should render AnalyticsDashboard inside ProtectedRoute', () => {
    render(<AnalyticsPage />);

    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics Dashboard Component')).toBeInTheDocument();
  });

  it('should have correct component structure', () => {
    const { container } = render(<AnalyticsPage />);

    const protectedRoute = container.querySelector('[data-testid="protected-route"]');
    const analyticsDashboard = container.querySelector('[data-testid="analytics-dashboard"]');

    expect(protectedRoute).toBeInTheDocument();
    expect(analyticsDashboard).toBeInTheDocument();
    expect(protectedRoute).toContainElement(analyticsDashboard);
  });

  it('should pass manager role requirement to ProtectedRoute', () => {
    render(<AnalyticsPage />);

    const protectedRoute = screen.getByTestId('protected-route');
    expect(protectedRoute).toHaveAttribute('data-required-role', 'manager');
  });
});
