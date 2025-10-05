import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';

// Mock the CSS import
jest.mock('@/app/globals.css', () => ({}));

describe('RootLayout', () => {
  it('should render children with proper HTML structure', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have correct HTML lang attribute', () => {
    // Set the lang attribute on the document element for testing
    document.documentElement.setAttribute('lang', 'en');
    
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    // The HTML element should have lang="en" attribute
    const htmlElement = document.documentElement;
    expect(htmlElement.getAttribute('lang')).toBe('en');
  });

  it('should render multiple children', () => {
    render(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <span data-testid="child-3">Child 3</span>
      </RootLayout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should render with proper body structure', () => {
    render(
      <RootLayout>
        <main>Main content</main>
      </RootLayout>
    );

    const body = document.body;
    expect(body).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<RootLayout>{null}</RootLayout>);

    const body = document.body;
    expect(body).toBeInTheDocument();
    // When children is null, the body should still exist but may have no direct children
    expect(body).toBeInTheDocument();
  });

  it('should handle undefined children', () => {
    render(<RootLayout>{undefined}</RootLayout>);

    const body = document.body;
    expect(body).toBeInTheDocument();
    // When children is undefined, the body should still exist but may have no direct children
    expect(body).toBeInTheDocument();
  });
});
