'use client';

import { useState, useEffect } from 'react';
import { useSaleStore } from '@/lib/stores/sale';
import { useCan } from '@/lib/hooks/useAbility';
import type { Sale } from '@restaurant-inventory/shared';
import { Plus, Edit, Trash2, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import SalesForm from './SalesForm';

export default function SalesList() {
  const { sales, loading, error, fetchSales, deleteSale, markInventoryUpdated } = useSaleStore();
  const canCreate = useCan('create', 'Sale');
  const canUpdate = useCan('update', 'Sale');
  const canDelete = useCan('delete', 'Sale');

  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'updated' | 'pending'>('all');

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (id: string, recipeName: string) => {
    if (!confirm(`Are you sure you want to delete this sale of "${recipeName}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteSale(id);
    } catch (error) {
      console.error('Failed to delete sale:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkUpdated = async (id: string) => {
    try {
      await markInventoryUpdated(id);
    } catch (error) {
      console.error('Failed to mark inventory updated:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSale(null);
  };

  const filteredSales = statusFilter === 'all'
    ? sales
    : statusFilter === 'updated'
    ? sales.filter(sale => sale.inventory_updated)
    : sales.filter(sale => !sale.inventory_updated);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" role="status" aria-label="Loading sales">
          <span className="sr-only">Loading sales...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-danger-600 mb-4">{error}</div>
        <button
          onClick={() => fetchSales()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">
            Track recipe sales and inventory updates
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Record Sale
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending Inventory Update' },
          { key: 'updated', label: 'Inventory Updated' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              statusFilter === filter.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredSales.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 mb-4">
            {statusFilter === 'all'
              ? 'No sales recorded yet'
              : statusFilter === 'updated'
              ? 'No updated sales found'
              : 'No pending inventory update sales found'}
          </div>
          {canCreate && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Record your first sale
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.recipes?.name || 'Unknown Recipe'}
                      </div>
                      {sale.recipes?.quantity && sale.recipes?.unit && (
                        <div className="text-sm text-gray-500">
                          Yield: {sale.recipes.quantity} {sale.recipes.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.receipt_id || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.inventory_updated ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          <CheckCircle size={14} className="mr-1" />
                          Updated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                          <XCircle size={14} className="mr-1" />
                          Pending Inventory Update
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {canUpdate && !sale.inventory_updated && (
                          <button
                            onClick={() => handleMarkUpdated(sale.id)}
                            className="text-success-600 hover:text-success-900"
                            title="Update Inventory"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(sale)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit sale"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(sale.id, sale.recipes?.name || 'Unknown')}
                            disabled={deletingId === sale.id}
                            className="text-danger-600 hover:text-danger-900 disabled:opacity-50"
                            title="Delete sale"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <SalesForm sale={editingSale} onClose={handleCloseForm} />
      )}
    </div>
  );
}
