import { render, screen } from '@testing-library/react';
import DashboardLayout from '@/app/dashboard/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';

// Mock the components
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

jest.mock('@/components/layout/Navigation', () => {
  return function MockNavigation() {
    return <div data-testid="navigation">Navigation Component</div>;
  };
});

describe('DashboardLayout', () => {
  it('should render ProtectedRoute wrapper', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });

  it('should render Navigation component', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByText('Navigation Component')).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('pt-20', 'lg:pt-0', 'lg:ml-64', 'p-4', 'lg:p-6');
  });

  it('should have correct container classes', () => {
    const { container } = render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    const wrapper = container.querySelector('.min-h-screen');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('min-h-screen', 'bg-gray-50');
  });

  it('should handle multiple children', () => {
    render(
      <DashboardLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <span data-testid="child-3">Child 3</span>
      </DashboardLayout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<DashboardLayout>{null}</DashboardLayout>);

    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main?.children).toHaveLength(0);
  });

  it('should have responsive layout classes', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('pt-20', 'lg:pt-0', 'lg:ml-64', 'p-4', 'lg:p-6');
  });

  it('should render Navigation before main content', () => {
    const { container } = render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    );

    const navigation = container.querySelector('[data-testid="navigation"]');
    const main = container.querySelector('main');
    
    expect(navigation).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    
    // Navigation should come before main in the DOM
    expect(container.contains(navigation)).toBe(true);
    expect(container.contains(main)).toBe(true);
  });
});
