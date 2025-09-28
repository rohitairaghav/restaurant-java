import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* Mobile: full width with top navigation */}
        {/* Desktop: sidebar + main content */}
        <main className="pt-20 lg:pt-0 lg:ml-64 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}