import { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SupplierList from '@/components/suppliers/SupplierList';

export const metadata: Metadata = {
  title: 'Suppliers - Restaurant Inventory',
  description: 'Manage suppliers and their contact information',
};

export default function SuppliersPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <div className="p-4 sm:p-6">
        <SupplierList />
      </div>
    </ProtectedRoute>
  );
}
