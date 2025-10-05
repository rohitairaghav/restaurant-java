'use client';

import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/lib/stores/analytics';
import { useInventoryStore } from '@/lib/stores/inventory';
import { formatCurrency } from '@restaurant-inventory/shared';
import { TrendingUp, DollarSign, AlertTriangle, Package } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data, loading, error, fetchAnalytics } = useAnalyticsStore();
  const { items, fetchItems } = useInventoryStore();
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    fetchAnalytics(period);
    fetchItems();
  }, [period, fetchAnalytics, fetchItems]);

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

  const totalItems = items.length;
  const outOfStockItems = items.filter(item => item.current_stock <= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="daily">Daily View (Last 7 days)</option>
          <option value="weekly">Weekly View (Last 4 weeks)</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-success-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.inventory_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-warning-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.low_stock_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-danger-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          {period === 'daily' ? 'Daily' : 'Weekly'} Usage Analysis
        </h3>

        {data && (period === 'daily' ? data.daily_usage : data.weekly_usage).length > 0 ? (
          <div className="space-y-4">
            {(period === 'daily' ? data.daily_usage : data.weekly_usage).map((usage, index) => {
              const dateKey = 'date' in usage ? usage.date : usage.week;
              return (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{dateKey}</h4>
                  {usage.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usage.items.map((item) => {
                        const inventoryItem = items.find(inv => inv.id === item.item_id);
                        return (
                          <div key={item.item_id} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium">{inventoryItem?.name || 'Unknown Item'}</p>
                            <p className="text-sm text-gray-600">
                              Used: {item.quantity} {inventoryItem?.unit}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No usage recorded</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No usage data available for the selected period</p>
          </div>
        )}
      </div>

      {/* Low Stock Items List */}
      {data && data.low_stock_count > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Items Requiring Attention</h3>
          <div className="space-y-3">
            {items
              .filter(item => item.current_stock <= item.min_threshold)
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded border-l-4 ${
                    item.current_stock <= 0
                      ? 'border-l-danger-500 bg-danger-50'
                      : 'border-l-warning-500 bg-warning-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Current: {item.current_stock} {item.unit} |
                        Minimum: {item.min_threshold} {item.unit}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.current_stock <= 0
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {item.current_stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}