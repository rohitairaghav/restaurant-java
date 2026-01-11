'use client';

import { useState, useEffect } from 'react';
import { useSaleStore } from '@/lib/stores/sale';
import { useRecipeStore } from '@/lib/stores/recipe';
import { useAuthStore } from '@/lib/stores/auth';
import { useCan } from '@/lib/hooks/useAbility';
import type { Sale } from '@restaurant-inventory/shared';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface SalesFormProps {
  sale?: Sale | null;
  onClose: () => void;
}

export default function SalesForm({ sale, onClose }: SalesFormProps) {
  const { createSale, createSaleAndUpdateInventory, updateSale, updateSaleAndAdjustInventory } = useSaleStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  const { user } = useAuthStore();
  const canCreate = useCan('create', 'Sale');
  const canUpdate = useCan('update', 'Sale');

  const [formData, setFormData] = useState({
    recipe_id: 0,
    quantity: 0,
    receipt_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (sale) {
      setFormData({
        recipe_id: sale.recipe_id,
        quantity: sale.quantity,
        receipt_id: sale.receipt_id || '',
      });
    }
  }, [sale]);

  const handleSubmit = async (e: React.FormEvent, updateInventory: boolean = false) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.recipe_id) {
      setError('Please select a recipe');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const isEditing = !!sale;
    if ((isEditing && !canUpdate) || (!isEditing && !canCreate)) {
      setError('You do not have permission to perform this action');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        recipe_id: formData.recipe_id,
        quantity: formData.quantity,
        receipt_id: formData.receipt_id.trim() || undefined,
        inventory_updated: updateInventory,
        restaurant_id: user!.restaurant_id,
      };

      if (sale) {
        // For editing, check if inventory needs adjustment
        const { inventory_updated, ...updateData } = saleData;
        const recipeChanged = updateData.recipe_id !== undefined && updateData.recipe_id !== sale.recipe_id;
        const quantityChanged = updateData.quantity !== undefined && updateData.quantity !== sale.quantity;

        // If inventory was updated and recipe/quantity changed, adjust inventory
        if (sale.inventory_updated && (recipeChanged || quantityChanged)) {
          await updateSaleAndAdjustInventory(sale.id, sale, updateData);
        } else {
          // Normal update without inventory adjustment
          await updateSale(sale.id, updateData);
        }
      } else {
        // For new sales, use the appropriate method
        if (updateInventory) {
          await createSaleAndUpdateInventory(saleData);
        } else {
          await createSale(saleData);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'recipe_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else if (name === 'quantity') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Filter only active recipes
  const activeRecipes = recipes.filter(r => r.status === 'Active');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {sale ? 'Edit Sale' : 'Record New Sale'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label htmlFor="recipe_id" className="block text-sm font-medium text-gray-700 mb-1">
              Recipe *
            </label>
            <select
              id="recipe_id"
              name="recipe_id"
              value={formData.recipe_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="">Select a recipe</option>
              {activeRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                  {recipe.quantity && recipe.unit ? ` (${recipe.quantity} ${recipe.unit})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Sold *
            </label>
            <input
              id="quantity"
              type="number"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label htmlFor="receipt_id" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt ID
            </label>
            <input
              id="receipt_id"
              type="text"
              name="receipt_id"
              value={formData.receipt_id}
              onChange={handleChange}
              placeholder="e.g., RCP-12345"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          {sale && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Updated
              </label>
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                {sale.inventory_updated ? (
                  <>
                    <CheckCircle size={20} className="text-success-600" />
                    <span className="text-base text-gray-700">Yes</span>
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-gray-400" />
                    <span className="text-base text-gray-500">No</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This status cannot be changed when editing a sale.
              </p>
            </div>
          )}

          {error && (
            <div className="text-danger-600 text-sm">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base hover:bg-gray-50 touch-manipulation disabled:opacity-50"
            >
              Cancel
            </button>
            {sale ? (
              <button
                type="submit"
                disabled={loading || !canUpdate}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg text-base font-medium hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
              >
                {loading ? 'Saving...' : 'Update'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading || !canCreate}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base hover:bg-gray-50 touch-manipulation disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Record Sale Only'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading || !canCreate}
                  className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg text-base font-medium hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
                >
                  {loading ? 'Saving...' : 'Record Sale & Update Inventory'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
