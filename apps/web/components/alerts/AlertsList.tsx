'use client';

import { useEffect } from 'react';
import { useAlertsStore } from '@/lib/stores/alerts';
import { formatDateTime } from '@restaurant-inventory/shared';
import { AlertTriangle, CheckCircle, CheckCircle2 } from 'lucide-react';

export default function AlertsList() {
  const {
    alerts,
    loading,
    error,
    unreadCount,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    subscribeToAlerts
  } = useAlertsStore();

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAlerts();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return unsubscribe;
  }, [fetchAlerts, subscribeToAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    await markAsRead(alertId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
        <p className="text-danger-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alerts</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">
              {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white p-4 rounded-lg shadow border-l-4 ${
              alert.type === 'out_of_stock'
                ? 'border-l-danger-500'
                : 'border-l-warning-500'
            } ${!alert.is_read ? 'bg-gray-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle
                  size={20}
                  className={
                    alert.type === 'out_of_stock'
                      ? 'text-danger-500 mt-0.5'
                      : 'text-warning-500 mt-0.5'
                  }
                />
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    alert.type === 'out_of_stock' ? 'text-danger-900' : 'text-warning-900'
                  }`}>
                    {alert.type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                  </h3>
                  <p className="text-gray-700 mt-1">{alert.message}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    {formatDateTime(alert.created_at)}
                  </div>
                  {(alert as any).inventory_items && (
                    <div className="text-sm text-gray-600 mt-1">
                      Current: {(alert as any).inventory_items.current_stock} {(alert as any).inventory_items.unit} |
                      Minimum: {(alert as any).inventory_items.min_threshold} {(alert as any).inventory_items.unit}
                    </div>
                  )}
                </div>
              </div>

              {!alert.is_read && (
                <button
                  onClick={() => handleMarkAsRead(alert.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Mark as read"
                >
                  <CheckCircle size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No alerts found. Great job keeping your inventory in check!</p>
          </div>
        )}
      </div>
    </div>
  );
}