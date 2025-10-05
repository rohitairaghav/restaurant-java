import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import InventoryList from '@/components/inventory/InventoryList';

// Mock the InventoryList component
jest.mock('@/components/inventory/InventoryList', () => {
  return function MockInventoryList() {
    return <div data-testid="inventory-list">Inventory List Component</div>;
  };
});

const mockInventoryList = InventoryList as jest.MockedFunction<typeof InventoryList>;

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render InventoryList component', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('inventory-list')).toBeInTheDocument();
    expect(screen.getByText('Inventory List Component')).toBeInTheDocument();
  });

  it('should render only the InventoryList component', () => {
    const { container } = render(<DashboardPage />);

    // Should only have one direct child (the InventoryList)
    expect(container.children).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('data-testid', 'inventory-list');
  });

  it('should not render any additional content', () => {
    render(<DashboardPage />);

    // Should not have any other elements
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should be a simple wrapper component', () => {
    const { container } = render(<DashboardPage />);

    // The component should be minimal and just render the InventoryList
    expect(container.innerHTML).toBe('<div data-testid="inventory-list">Inventory List Component</div>');
  });
});
