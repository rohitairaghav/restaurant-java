import React from 'react';
import { render, screen } from '@testing-library/react';
import SuppliersPage from '@/app/dashboard/suppliers/page';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SupplierList from '@/components/suppliers/SupplierList';

// Mock the components
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: string }) {
    return (
      <div data-testid="protected-route" data-required-role={requiredRole}>
        {children}
      </div>
    );
  };
});

jest.mock('@/components/suppliers/SupplierList', () => {
  return function MockSupplierList() {
    return <div data-testid="supplier-list">Supplier List Component</div>;
  };
});

describe('SuppliersPage', () => {
  it('should render ProtectedRoute with manager role requirement', () => {
    render(<SuppliersPage />);

    const protectedRoute = screen.getByTestId('protected-route');
    expect(protectedRoute).toBeInTheDocument();
    expect(protectedRoute).toHaveAttribute('data-required-role', 'manager');
  });

  it('should render SupplierList component', () => {
    render(<SuppliersPage />);

    expect(screen.getByTestId('supplier-list')).toBeInTheDocument();
    expect(screen.getByText('Supplier List Component')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    render(<SuppliersPage />);

    const pageContainer = screen.getByTestId('protected-route').parentElement;
    expect(pageContainer).toBeInTheDocument();
  });
});
