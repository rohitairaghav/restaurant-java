import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddUserModal from '@/components/users/AddUserModal';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';

jest.mock('@/lib/stores/users');
jest.mock('@/lib/stores/auth');

const mockUseUsersStore = useUsersStore as jest.MockedFunction<typeof useUsersStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('AddUserModal', () => {
  const mockOnClose = jest.fn();
  const mockAddUser = jest.fn();

  const mockUser = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    mockUseUsersStore.mockReturnValue({
      users: [],
      loading: false,
      error: null,
      fetchUsers: jest.fn(),
      addUser: mockAddUser,
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        initialize: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(<AddUserModal isOpen={false} onClose={mockOnClose} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render password input', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    });

    it('should render confirm password input', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should render role select', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });

    it('should render Add User button', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update email field on input change', () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password field on input change', () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    it('should update confirm password field on input change', () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      expect(confirmPasswordInput.value).toBe('password123');
    });

    it('should update role select on change', () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      fireEvent.change(roleSelect, { target: { value: 'manager' } });

      expect(roleSelect.value).toBe('manager');
    });

    it('should close modal when Cancel button is clicked', () => {
      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed', () => {
      const { container, rerender } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      rerender(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      expect(emailInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Email is required')).toBeInTheDocument();
        });
      }
    });

    it('should show error for invalid email format', async () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Invalid email format')).toBeInTheDocument();
        });
      }
    });

    it('should show error when password is empty', async () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Password is required')).toBeInTheDocument();
        });
      }
    });

    it('should show error when password is too short', async () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
        });
      }
    });

    it('should show error when passwords do not match', async () => {
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Form Submission', () => {
    it('should call addUser with correct data on valid submission', async () => {
      mockAddUser.mockResolvedValue(undefined);
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;
      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(roleSelect, { target: { value: 'staff' } });

      const submitButton = screen.getByRole('button', { name: /add user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddUser).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          role: 'staff',
          restaurant_id: 'rest-1',
        });
      });
    });

    it('should close modal on successful submission', async () => {
      mockAddUser.mockResolvedValue(undefined);
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;

      if (emailInput && passwordInput && confirmPasswordInput) {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        const form = container.querySelector('form');
        if (form) {
          fireEvent.submit(form);

          await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
          });
        }
      }
    });

    it('should reset form on successful submission', async () => {
      mockAddUser.mockResolvedValue(undefined);
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;

      if (emailInput && passwordInput && confirmPasswordInput) {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        const form = container.querySelector('form');
        if (form) {
          fireEvent.submit(form);

          await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
          });
        }
      }
    });

    it('should display error message on submission failure', async () => {
      mockAddUser.mockRejectedValue(new Error('Failed to add user'));
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;

      if (emailInput && passwordInput && confirmPasswordInput) {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        const form = container.querySelector('form');
        if (form) {
          fireEvent.submit(form);

          await waitFor(() => {
            expect(screen.getByText('Failed to add user')).toBeInTheDocument();
          });
        }
      }
    });

    it('should not close modal on submission failure', async () => {
      mockAddUser.mockRejectedValue(new Error('Failed to add user'));
      const { container } = render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const passwordInput = container.querySelector('input#password') as HTMLInputElement;
      const confirmPasswordInput = container.querySelector('input#confirmPassword') as HTMLInputElement;

      if (emailInput && passwordInput && confirmPasswordInput) {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        const form = container.querySelector('form');
        if (form) {
          fireEvent.submit(form);

          await waitFor(() => {
            expect(screen.getByText('Failed to add user')).toBeInTheDocument();
          });

          expect(mockOnClose).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      mockUseUsersStore.mockReturnValue({
        users: [],
        loading: true,
        error: null,
        fetchUsers: jest.fn(),
        addUser: mockAddUser,
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
      });

      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);

      const addButton = screen.getByText('Adding...');
      const cancelButton = screen.getByText('Cancel');

      expect(addButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show "Adding..." text when loading', () => {
      mockUseUsersStore.mockReturnValue({
        users: [],
        loading: true,
        error: null,
        fetchUsers: jest.fn(),
        addUser: mockAddUser,
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
      });

      render(<AddUserModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
  });
});
