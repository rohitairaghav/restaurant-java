import { render, screen } from '@testing-library/react';
import StockPage from '@/app/dashboard/stock/page';
import StockTransactionList from '@/components/stock/StockTransactionList';

// Mock the StockTransactionList component
jest.mock('@/components/stock/StockTransactionList', () => {
  return function MockStockTransactionList() {
    return <div data-testid="stock-transaction-list">Stock Transaction List Component</div>;
  };
});

describe('StockPage', () => {
  it('should render StockTransactionList component', () => {
    render(<StockPage />);

    expect(screen.getByTestId('stock-transaction-list')).toBeInTheDocument();
    expect(screen.getByText('Stock Transaction List Component')).toBeInTheDocument();
  });

  it('should render only the StockTransactionList component', () => {
    const { container } = render(<StockPage />);

    // Should only have one direct child (the StockTransactionList)
    expect(container.children).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('data-testid', 'stock-transaction-list');
  });

  it('should be a simple wrapper component', () => {
    const { container } = render(<StockPage />);

    // The component should be minimal and just render the StockTransactionList
    expect(container.innerHTML).toBe('<div data-testid="stock-transaction-list">Stock Transaction List Component</div>');
  });
});
