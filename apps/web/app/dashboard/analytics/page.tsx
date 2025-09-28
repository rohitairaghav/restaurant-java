import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <AnalyticsDashboard />
    </ProtectedRoute>
  );
}