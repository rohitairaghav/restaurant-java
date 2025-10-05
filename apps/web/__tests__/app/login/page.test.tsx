import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import LoginForm from '@/components/auth/LoginForm';

// Mock the LoginForm component
jest.mock('@/components/auth/LoginForm', () => {
  return function MockLoginForm() {
    return <div data-testid="login-form">Login Form Component</div>;
  };
});

describe('LoginPage', () => {
  it('should render LoginForm component', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByText('Login Form Component')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<LoginPage />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center');
  });

  it('should center the login form', () => {
    render(<LoginPage />);

    const loginForm = screen.getByTestId('login-form');
    const parent = loginForm.parentElement;
    
    expect(parent).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center');
  });

  it('should have full height background', () => {
    const { container } = render(<LoginPage />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
  });

  it('should have gray background', () => {
    const { container } = render(<LoginPage />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-gray-50');
  });

  it('should use flexbox for centering', () => {
    const { container } = render(<LoginPage />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
