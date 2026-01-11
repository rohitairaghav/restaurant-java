'use client';

import { useState, useEffect } from 'react';
import { useRecipeStore } from '@/lib/stores/recipe';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import { useCan } from '@/lib/hooks/useAbility';
import type { Recipe, RecipeIngredient } from '@restaurant-inventory/shared';
import { RECIPE_UNITS, RECIPE_UNIT_LABELS } from '@restaurant-inventory/shared';
import { X, Plus, Trash2 } from 'lucide-react';

interface RecipeFormProps {
  recipe?: Recipe | null;
  onClose: () => void;
}

export default function RecipeForm({ recipe, onClose }: RecipeFormProps) {
  const { createRecipe, updateRecipe } = useRecipeStore();
  const { items: inventoryItems, fetchItems } = useInventoryStore();
  const { user } = useAuthStore();
  const canCreate = useCan('create', 'Recipe');
  const canUpdate = useCan('update', 'Recipe');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: undefined as number | undefined,
    unit: '',
    status: 'Active' as 'Active' | 'Disabled' | 'Removed',
  });

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        quantity: recipe.quantity,
        unit: recipe.unit || '',
        status: recipe.status,
      });
      setIngredients(recipe.content.ingredients || []);
    }
  }, [recipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return;
    }

    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    const isEditing = !!recipe;
    if ((isEditing && !canUpdate) || (!isEditing && !canCreate)) {
      setError('You do not have permission to perform this action');
      return;
    }

    setLoading(true);

    try {
      const recipeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        quantity: formData.quantity || undefined,
        unit: formData.unit.trim() || undefined,
        status: formData.status,
        content: {
          ingredients,
        },
        restaurant_id: user!.restaurant_id,
      };

      if (recipe) {
        await updateRecipe(recipe.id, recipeData);
      } else {
        await createRecipe(recipeData);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addIngredient = () => {
    if (inventoryItems.length === 0) {
      setError('No inventory items available. Please add inventory items first.');
      return;
    }

    setIngredients([
      ...ingredients,
      {
        inventory_item_id: '',
        quantity: 0,
        unit: '',
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate unit when inventory item is selected
    if (field === 'inventory_item_id' && value) {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        updated[index].unit = item.unit;
      }
    }

    setIngredients(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {recipe ? 'Edit Recipe' : 'Add New Recipe'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (Yield)
              </label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g., 4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
              >
                <option value="">Select unit</option>
                {RECIPE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {RECIPE_UNIT_LABELS[unit]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Removed">Removed</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Ingredients *
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 touch-manipulation"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                No ingredients added. Click "Add Ingredient" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <select
                        value={ingredient.inventory_item_id}
                        onChange={(e) => updateIngredient(index, 'inventory_item_id', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Inventory Item</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={ingredient.quantity || ''}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Quantity"
                          required
                          min="0"
                          step="0.01"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={ingredient.unit}
                          readOnly
                          placeholder="Unit"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg touch-manipulation"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || (recipe ? !canUpdate : !canCreate)}
              className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg text-base font-medium hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
            >
              {loading ? 'Saving...' : recipe ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
