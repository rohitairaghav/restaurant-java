'use client';

import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import { INVENTORY_CATEGORIES, UNITS, type InventoryItem } from '@restaurant-inventory/shared';
import { X } from 'lucide-react';

interface InventoryFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

export default function InventoryForm({ item, onClose }: InventoryFormProps) {
  const { addItem, updateItem, suppliers, fetchSuppliers } = useInventoryStore();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    cost_per_unit: '',
    current_stock: '',
    min_threshold: '',
    supplier_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        cost_per_unit: item.cost_per_unit.toString(),
        current_stock: item.current_stock.toString(),
        min_threshold: item.min_threshold.toString(),
        supplier_id: item.supplier_id || '',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        current_stock: parseFloat(formData.current_stock),
        min_threshold: parseFloat(formData.min_threshold),
        supplier_id: formData.supplier_id || undefined,
        restaurant_id: user!.restaurant_id,
      };

      if (item) {
        await updateItem(item.id, itemData);
      } else {
        await addItem(itemData);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {item ? 'Edit Item' : 'Add New Item'}
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
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">Select category</option>
              {INVENTORY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">Select unit</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost per unit *
            </label>
            <input
              type="number"
              name="cost_per_unit"
              value={formData.cost_per_unit}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current stock *
            </label>
            <input
              type="number"
              name="current_stock"
              value={formData.current_stock}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum threshold *
            </label>
            <input
              type="number"
              name="min_threshold"
              value={formData.min_threshold}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
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
              {loading ? 'Saving...' : item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}