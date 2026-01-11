'use client';

import { useState, useEffect } from 'react';
import { useRecipeStore } from '@/lib/stores/recipe';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useCan } from '@/lib/hooks/useAbility';
import type { Recipe } from '@restaurant-inventory/shared';
import { Plus, Edit, Trash2, ChefHat, Package } from 'lucide-react';
import RecipeForm from './RecipeForm';

export default function RecipeList() {
  const { recipes, loading, error, fetchRecipes, deleteRecipe } = useRecipeStore();
  const { items: inventoryItems } = useInventoryStore();
  const canCreate = useCan('create', 'Recipe');
  const canUpdate = useCan('update', 'Recipe');
  const canDelete = useCan('delete', 'Recipe');

  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Disabled' | 'Removed'>('all');

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the recipe "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteRecipe(id);
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(null);
  };

  const getInventoryItemName = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const filteredRecipes = statusFilter === 'all'
    ? recipes
    : recipes.filter(recipe => recipe.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success-100 text-success-800';
      case 'Disabled':
        return 'bg-warning-100 text-warning-800';
      case 'Removed':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" role="status" aria-label="Loading recipes">
          <span className="sr-only">Loading recipes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-danger-600 mb-4">{error}</div>
        <button
          onClick={() => fetchRecipes()}
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
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-600 mt-1">
            Manage your restaurant recipes and ingredients
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add Recipe
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'Active', 'Disabled', 'Removed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 mb-4">
            {statusFilter === 'all'
              ? 'No recipes found'
              : `No ${statusFilter.toLowerCase()} recipes found`}
          </div>
          {canCreate && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Add your first recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{recipe.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(recipe.status)}`}>
                      {recipe.status}
                    </span>
                    {recipe.quantity && recipe.unit && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Yield: {recipe.quantity} {recipe.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canUpdate && (
                    <button
                      onClick={() => handleEdit(recipe)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                      title="Edit recipe"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(recipe.id, recipe.name)}
                      disabled={deletingId === recipe.id}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg disabled:opacity-50"
                      title="Delete recipe"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {recipe.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {recipe.description}
                </p>
              )}

              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <Package size={16} />
                  <span className="font-medium">
                    {recipe.content.ingredients.length} Ingredient{recipe.content.ingredients.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  {recipe.content.ingredients.slice(0, 3).map((ingredient, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex justify-between">
                      <span>{getInventoryItemName(ingredient.inventory_item_id)}</span>
                      <span className="font-medium">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                  {recipe.content.ingredients.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      + {recipe.content.ingredients.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RecipeForm recipe={editingRecipe} onClose={handleCloseForm} />
      )}
    </div>
  );
}
