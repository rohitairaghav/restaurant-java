import { create } from 'zustand';
import type { Recipe, RecipeInput, RecipeUnit } from '@restaurant-inventory/shared';
import { PERMISSION_ERRORS, RECIPE_UNITS } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { useAuthStore } from './auth';

/**
 * Validation helper for recipe units
 * Uses RECIPE_UNITS constant from shared package (single source of truth)
 */
function validateRecipeUnit(unit?: string): unit is RecipeUnit {
  if (!unit) return true; // null/undefined is allowed
  return RECIPE_UNITS.includes(unit as RecipeUnit);
}

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchRecipes: () => Promise<void>;
  createRecipe: (recipe: RecipeInput) => Promise<void>;
  updateRecipe: (id: number, updates: Partial<RecipeInput>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  error: null,

  fetchRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recipes: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createRecipe: async (recipe: RecipeInput) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'Recipe')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      // Validate unit field
      if (recipe.unit && !validateRecipeUnit(recipe.unit)) {
        throw new Error('Invalid unit value. Please select a valid unit from the dropdown.');
      }

      const supabase = createClient();

      // Auto-populate created_by, updated_by, and timestamps
      const recipeData = {
        ...recipe,
        created_by: user.id,
        updated_by: user.id,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        recipes: [data, ...state.recipes],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRecipe: async (id: number, updates: Partial<RecipeInput>) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'Recipe')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      // Validate unit field if provided
      if (updates.unit && !validateRecipeUnit(updates.unit)) {
        throw new Error('Invalid unit value. Please select a valid unit from the dropdown.');
      }

      const supabase = createClient();

      // Auto-populate updated_by and updated_at
      const recipeData = {
        ...updates,
        updated_by: user.id,
        updated_at: Date.now(),
      };

      const { data, error } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        recipes: state.recipes.map(recipe =>
          recipe.id === id ? data : recipe
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteRecipe: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('delete', 'Recipe')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        recipes: state.recipes.filter(recipe => recipe.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
