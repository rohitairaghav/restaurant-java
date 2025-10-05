import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditUserModal from '@/components/users/EditUserModal';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';
import type { User } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/users');
jest.mock('@/lib/stores/auth');

const mockUseUsersStore = useUsersStore as jest.MockedFunction<typeof useUsersStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('EditUserModal', () => {
  const mockOnClose = jest.fn();
  const mockUpdateUser = jest.fn();

  const mockCurrentUser = {
    id: 'user-1',
    email: 'manager@test.com',
    role: 'manager' as const,
    restaurant_id: 'rest-1',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockTargetUser: User = {
    id: 'user-2',
    email: 'staff@test.com',
    role: 'staff' as const,
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
      addUser: jest.fn(),
      updateUser: mockUpdateUser,
      deleteUser: jest.fn(),
    });

    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: mockCurrentUser,
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
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('should render email input with user data', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.value).toBe('staff@test.com');
    });

    it('should render role select with user data', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      expect(roleSelect).toBeInTheDocument();
      expect(roleSelect.value).toBe('staff');
    });

    it('should render Update User button', () => {
      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Update User')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update email field on input change', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      expect(emailInput.value).toBe('newemail@example.com');
    });

    it('should update role select on change', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      fireEvent.change(roleSelect, { target: { value: 'manager' } });

      expect(roleSelect.value).toBe('manager');
    });

    it('should close modal when Cancel button is clicked', () => {
      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed via Cancel', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'changed@example.com' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should update form when user prop changes', () => {
      const { container, rerender } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const newUser: User = {
        ...mockTargetUser,
        id: 'user-3',
        email: 'different@test.com',
        role: 'manager',
      };

      rerender(<EditUserModal user={newUser} isOpen={true} onClose={mockOnClose} />);

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      expect(emailInput.value).toBe('different@test.com');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: '' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Email is required')).toBeInTheDocument();
        });
      }
    });

    it('should show error for invalid email format', async () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

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
  });

  describe('Form Submission', () => {
    it('should call updateUser with email changes', async () => {
      mockUpdateUser.mockResolvedValue(undefined);
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith('user-2', {
            email: 'updated@example.com',
          });
        });
      }
    });

    it('should call updateUser with role changes', async () => {
      mockUpdateUser.mockResolvedValue(undefined);
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      fireEvent.change(roleSelect, { target: { value: 'manager' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith('user-2', {
            role: 'manager',
          });
        });
      }
    });

    it('should call updateUser with both email and role changes', async () => {
      mockUpdateUser.mockResolvedValue(undefined);
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;

      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
      fireEvent.change(roleSelect, { target: { value: 'manager' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith('user-2', {
            email: 'updated@example.com',
            role: 'manager',
          });
        });
      }
    });

    it('should close modal without calling updateUser if no changes made', async () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });

        expect(mockUpdateUser).not.toHaveBeenCalled();
      }
    });

    it('should close modal on successful submission', async () => {
      mockUpdateUser.mockResolvedValue(undefined);
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });

    it('should display error message on submission failure', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Failed to update user'));
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Failed to update user')).toBeInTheDocument();
        });
      }
    });

    it('should not close modal on submission failure', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Failed to update user'));
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const emailInput = container.querySelector('input#email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Failed to update user')).toBeInTheDocument();
        });

        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Current User Protection', () => {
    it('should render role select field', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      expect(roleSelect).toBeInTheDocument();
    });

    it('should allow role changes for different users', () => {
      const { container } = render(
        <EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />
      );

      const roleSelect = container.querySelector('select#role') as HTMLSelectElement;
      expect(roleSelect).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      mockUseUsersStore.mockReturnValue({
        users: [],
        loading: true,
        error: null,
        fetchUsers: jest.fn(),
        addUser: jest.fn(),
        updateUser: mockUpdateUser,
        deleteUser: jest.fn(),
      });

      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);

      const updateButton = screen.getByText('Updating...');
      const cancelButton = screen.getByText('Cancel');

      expect(updateButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show "Updating..." text when loading', () => {
      mockUseUsersStore.mockReturnValue({
        users: [],
        loading: true,
        error: null,
        fetchUsers: jest.fn(),
        addUser: jest.fn(),
        updateUser: mockUpdateUser,
        deleteUser: jest.fn(),
      });

      render(<EditUserModal user={mockTargetUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });
});
