import { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SalesList from '@/components/sales/SalesList';

export const metadata: Metadata = {
  title: 'Sales - Restaurant Inventory',
  description: 'Track recipe sales and inventory updates',
};

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6">
        <SalesList />
      </div>
    </ProtectedRoute>
  );
}
