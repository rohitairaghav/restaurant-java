import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteUserConfirmation from '@/components/users/DeleteUserConfirmation';
import { useUsersStore } from '@/lib/stores/users';
import type { User } from '@restaurant-inventory/shared';

jest.mock('@/lib/stores/users');

const mockUseUsersStore = useUsersStore as jest.MockedFunction<typeof useUsersStore>;

describe('DeleteUserConfirmation', () => {
  const mockOnClose = jest.fn();
  const mockDeleteUser = jest.fn();

  const mockUser: User = {
    id: 'user-1',
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
      updateUser: jest.fn(),
      deleteUser: mockDeleteUser,
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <DeleteUserConfirmation user={mockUser} isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      const deleteUserTexts = screen.getAllByText('Delete User');
      expect(deleteUserTexts.length).toBeGreaterThan(0);
    });

    it('should display user email in confirmation message', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('staff@test.com')).toBeInTheDocument();
    });

    it('should display confirmation message', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/Are you sure you want to delete the user/)).toBeInTheDocument();
    });

    it('should display warning section', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should display warning message about permanent deletion', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(
        screen.getByText(/This action cannot be undone/)
      ).toBeInTheDocument();
    });

    it('should render Delete User button', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      const deleteUserButtons = screen.getAllByText('Delete User');
      // Should have both title and button
      expect(deleteUserButtons.length).toBe(2);
    });

    it('should render Cancel button', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should close modal when Cancel button is clicked', () => {
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call deleteUser when Delete button is clicked', async () => {
      mockDeleteUser.mockResolvedValue(undefined);
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1]; // Second one is the button (first is the heading)
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
      });
    });

    it('should close modal after successful deletion', async () => {
      mockDeleteUser.mockResolvedValue(undefined);
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on deletion failure', async () => {
      mockDeleteUser.mockRejectedValue(new Error('Failed to delete user'));
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete user')).toBeInTheDocument();
      });
    });

    it('should not close modal on deletion failure', async () => {
      mockDeleteUser.mockRejectedValue(new Error('Failed to delete user'));
      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete user')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear previous error on new deletion attempt', async () => {
      mockDeleteUser.mockRejectedValue(new Error('First error'));
      const { rerender } = render(
        <DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />
      );

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      mockDeleteUser.mockRejectedValue(new Error('Second error'));
      rerender(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtonsAgain = screen.getAllByText('Delete User');
      const deleteButtonAgain = deleteButtonsAgain[1];
      fireEvent.click(deleteButtonAgain);

      await waitFor(() => {
        expect(screen.getByText('Second error')).toBeInTheDocument();
      });
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
        updateUser: jest.fn(),
        deleteUser: mockDeleteUser,
      });

      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);

      const deleteButtons = screen.getAllByText(/Delet/);
      const cancelButton = screen.getByText('Cancel');

      // Find the button (not the heading)
      const deleteButton = deleteButtons.find(
        (btn) => btn.tagName === 'BUTTON'
      ) as HTMLButtonElement;

      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show "Deleting..." text when loading', () => {
      mockUseUsersStore.mockReturnValue({
        users: [],
        loading: true,
        error: null,
        fetchUsers: jest.fn(),
        addUser: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: mockDeleteUser,
      });

      render(<DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  describe('Different Users', () => {
    it('should display correct email for different users', () => {
      const differentUser: User = {
        ...mockUser,
        id: 'user-2',
        email: 'different@example.com',
      };

      render(
        <DeleteUserConfirmation user={differentUser} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('different@example.com')).toBeInTheDocument();
    });

    it('should call deleteUser with correct user ID', async () => {
      mockDeleteUser.mockResolvedValue(undefined);
      const differentUser: User = {
        ...mockUser,
        id: 'user-xyz',
        email: 'different@example.com',
      };

      render(
        <DeleteUserConfirmation user={differentUser} isOpen={true} onClose={mockOnClose} />
      );

      const deleteButtons = screen.getAllByText('Delete User');
      const deleteButton = deleteButtons[1];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith('user-xyz');
      });
    });
  });

  describe('Warning Icon', () => {
    it('should render warning icon', () => {
      const { container } = render(
        <DeleteUserConfirmation user={mockUser} isOpen={true} onClose={mockOnClose} />
      );

      const warningIcon = container.querySelector('svg.text-yellow-400');
      expect(warningIcon).toBeInTheDocument();
    });
  });
});
