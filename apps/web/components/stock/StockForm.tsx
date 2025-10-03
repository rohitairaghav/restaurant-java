'use client';

import { useState, useEffect } from 'react';
import { useStockStore } from '@/lib/stores/stock';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import { TRANSACTION_REASONS, StockTransaction } from '@restaurant-inventory/shared';
import { X } from 'lucide-react';

interface StockFormProps {
  onClose: () => void;
  transaction?: StockTransaction & { inventory_items?: { name: string; unit: string } };
}

export default function StockForm({ onClose, transaction }: StockFormProps) {
  const { addTransaction, updateTransaction } = useStockStore();
  const { items, fetchItems } = useInventoryStore();
  const { user } = useAuthStore();
  const isEditMode = !!transaction;

  const [formData, setFormData] = useState({
    item_id: transaction?.item_id || '',
    type: (transaction?.type || 'in') as 'in' | 'out',
    quantity: transaction?.quantity?.toString() || '',
    reason: transaction?.reason || '',
    sku: transaction?.sku || '',
    notes: transaction?.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const availableReasons = formData.type === 'in'
    ? TRANSACTION_REASONS.in
    : TRANSACTION_REASONS.out;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode && transaction) {
        // Update existing transaction
        await updateTransaction(
          transaction.id,
          {
            item_id: formData.item_id,
            type: formData.type,
            quantity: parseFloat(formData.quantity),
            reason: formData.reason as any,
            sku: formData.sku || undefined,
            notes: formData.notes || undefined,
          }
        );
      } else {
        // Add new transaction
        await addTransaction({
          item_id: formData.item_id,
          type: formData.type,
          quantity: parseFloat(formData.quantity),
          reason: formData.reason as any,
          sku: formData.sku || undefined,
          notes: formData.notes || undefined,
          user_id: user!.id,
          restaurant_id: user!.restaurant_id,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} transaction`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset reason when type changes
      ...(name === 'type' ? { reason: '' } : {}),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {isEditMode ? 'Edit' : 'Add'} Stock Transaction
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item *
            </label>
            <select
              name="item_id"
              value={formData.item_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Current: {item.current_stock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">Select reason</option>
              {availableReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
              placeholder="Enter SKU (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          {error && (
            <div className="text-danger-600 text-sm">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base hover:bg-gray-50 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg text-base font-medium hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
            >
              {loading
                ? (isEditMode ? 'Updating...' : 'Adding...')
                : (isEditMode ? 'Update Transaction' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}