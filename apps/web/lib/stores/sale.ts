import { create } from 'zustand';
import type { Sale, SaleInput, Recipe } from '@restaurant-inventory/shared';
import { PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { useAuthStore } from './auth';
import { useStockStore } from './stock';

interface SaleState {
  sales: Sale[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSales: () => Promise<void>;
  createSale: (sale: SaleInput) => Promise<void>;
  createSaleAndUpdateInventory: (sale: SaleInput) => Promise<void>;
  updateSale: (id: string, updates: Partial<SaleInput>) => Promise<void>;
  updateSaleAndAdjustInventory: (id: string, originalSale: Sale, updates: Partial<SaleInput>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  markInventoryUpdated: (id: string) => Promise<void>;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  loading: false,
  error: null,

  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ sales: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createSale: async (sale: SaleInput) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      const supabase = createClient();

      // Auto-populate created_by, updated_by, and timestamps
      const saleData = {
        ...sale,
        created_by: user.id,
        updated_by: user.id,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const { data, error } = await supabase
        .from('sales')
        .insert(saleData)
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .single();

      if (error) throw error;

      set(state => ({
        sales: [data, ...state.sales],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createSaleAndUpdateInventory: async (sale: SaleInput) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('create', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      if (!ability.can('create', 'StockTransaction')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      const supabase = createClient();

      // Fetch the recipe with full ingredient details
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', sale.recipe_id)
        .single();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Recipe not found');

      // Validate recipe has ingredients
      if (!recipe.content?.ingredients || recipe.content.ingredients.length === 0) {
        throw new Error('Recipe has no ingredients. Cannot update inventory.');
      }

      // Create the sale with inventory_updated: true
      const saleData = {
        ...sale,
        inventory_updated: true,
        created_by: user.id,
        updated_by: user.id,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const { data: createdSale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .single();

      if (saleError) throw saleError;

      // Calculate ingredient quantities and create stock transactions
      try {
        const recipeQuantity = recipe.quantity || 1; // Default to 1 if no recipe quantity
        const saleQuantity = sale.quantity;

        // Calculate multiplier: how many times the recipe was sold
        const multiplier = saleQuantity / recipeQuantity;

        const stockStore = useStockStore.getState();
        const transactionPromises = recipe.content.ingredients.map(async (ingredient) => {
          // Calculate quantity needed: ingredient.quantity * multiplier
          const ingredientQuantity = ingredient.quantity * multiplier;

          // Create stock transaction for this ingredient
          await stockStore.addTransaction({
            item_id: ingredient.inventory_item_id,
            type: 'out',
            quantity: ingredientQuantity,
            reason: 'sale',
            notes: `Sale of ${recipe.name} (Sale ID: ${createdSale.id})`,
            user_id: user.id,
            restaurant_id: user.restaurant_id,
          });
        });

        // Wait for all stock transactions to complete
        await Promise.all(transactionPromises);

        // Update state with the created sale
        set(state => ({
          sales: [createdSale, ...state.sales],
          loading: false
        }));
      } catch (inventoryError: any) {
        // If inventory update fails, update the sale to set inventory_updated: false
        // and show a warning
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            inventory_updated: false,
            updated_by: user.id,
            updated_at: Date.now(),
          })
          .eq('id', createdSale.id);

        if (updateError) {
          // If we can't update, at least log it
          console.error('Failed to update sale after inventory error:', updateError);
        }

        // Still add the sale to state, but with inventory_updated: false
        const updatedSale = { ...createdSale, inventory_updated: false };
        set(state => ({
          sales: [updatedSale, ...state.sales],
          loading: false,
          error: `Sale recorded but inventory update failed: ${inventoryError.message}`
        }));

        throw new Error(`Sale recorded but inventory update failed: ${inventoryError.message}`);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSale: async (id: string, updates: Partial<SaleInput>) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      const supabase = createClient();

      // Auto-populate updated_by and updated_at
      const saleData = {
        ...updates,
        updated_by: user.id,
        updated_at: Date.now(),
      };

      const { data, error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id)
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .single();

      if (error) throw error;

      set(state => ({
        sales: state.sales.map(sale =>
          sale.id === id ? data : sale
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSaleAndAdjustInventory: async (id: string, originalSale: Sale, updates: Partial<SaleInput>) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      if (!ability.can('create', 'StockTransaction')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      const supabase = createClient();

      // Determine what changed
      const recipeChanged = updates.recipe_id !== undefined && updates.recipe_id !== originalSale.recipe_id;
      const quantityChanged = updates.quantity !== undefined && updates.quantity !== originalSale.quantity;

      if (!recipeChanged && !quantityChanged) {
        // Nothing changed that affects inventory, just update normally
        return get().updateSale(id, updates);
      }

      // Fetch both recipes (old and new) if recipe changed
      let oldRecipe: Recipe | null = null;
      let newRecipe: Recipe | null = null;

      if (recipeChanged) {
        // Fetch old recipe
        const { data: oldRecipeData, error: oldRecipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', originalSale.recipe_id)
          .single();

        if (oldRecipeError) throw oldRecipeError;
        oldRecipe = oldRecipeData;

        // Fetch new recipe
        const { data: newRecipeData, error: newRecipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', updates.recipe_id!)
          .single();

        if (newRecipeError) throw newRecipeError;
        newRecipe = newRecipeData;

        if (!oldRecipe?.content?.ingredients || oldRecipe.content.ingredients.length === 0) {
          throw new Error('Old recipe has no ingredients');
        }
        if (!newRecipe?.content?.ingredients || newRecipe.content.ingredients.length === 0) {
          throw new Error('New recipe has no ingredients');
        }
      } else {
        // Only quantity changed, fetch current recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', originalSale.recipe_id)
          .single();

        if (recipeError) throw recipeError;
        newRecipe = recipeData;

        if (!newRecipe?.content?.ingredients || newRecipe.content.ingredients.length === 0) {
          throw new Error('Recipe has no ingredients');
        }
      }

      // Update the sale record first
      const saleData = {
        ...updates,
        updated_by: user.id,
        updated_at: Date.now(),
      };

      const { data: updatedSale, error: saleError } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id)
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .single();

      if (saleError) throw saleError;

      // Adjust inventory
      try {
        const stockStore = useStockStore.getState();

        // Always reverse the original sale completely, then apply the new sale completely
        // This ensures correct inventory adjustment regardless of what changed

        // Step 1: Reverse original sale inventory (add it back)
        // Fetch original recipe if we don't have it yet
        if (!oldRecipe) {
          const { data: originalRecipeData, error: originalRecipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', originalSale.recipe_id)
            .single();

          if (originalRecipeError) throw originalRecipeError;
          oldRecipe = originalRecipeData;

          if (!oldRecipe?.content?.ingredients || oldRecipe.content.ingredients.length === 0) {
            throw new Error('Original recipe has no ingredients');
          }
        }

        const originalRecipeQuantity = oldRecipe.quantity || 1;
        const originalMultiplier = originalSale.quantity / originalRecipeQuantity;

        // Reverse: For each ingredient, calculate quantity and add it back
        const reversePromises = oldRecipe.content.ingredients.map(async (ingredient) => {
          // Calculate: ingredient.quantity * (originalSale.quantity / recipe.quantity)
          const ingredientQuantity = ingredient.quantity * originalMultiplier;
          
          await stockStore.addTransaction({
            item_id: ingredient.inventory_item_id,
            type: 'in',
            quantity: ingredientQuantity,
            reason: 'sale',
            notes: `Reversal: Sale edit - ${oldRecipe.name} (Sale ID: ${id})`,
            user_id: user.id,
            restaurant_id: user.restaurant_id,
          });
        });

        await Promise.all(reversePromises);

        // Step 2: Apply new sale inventory (reduce it)
        const newSaleQuantity = updates.quantity !== undefined ? updates.quantity : updatedSale.quantity;
        const newRecipeQuantity = newRecipe!.quantity || 1;
        const newMultiplier = newSaleQuantity / newRecipeQuantity;

        // Apply: For each ingredient, calculate quantity and reduce it
        const applyPromises = newRecipe!.content.ingredients.map(async (ingredient) => {
          // Calculate: ingredient.quantity * (newSaleQuantity / recipe.quantity)
          const ingredientQuantity = ingredient.quantity * newMultiplier;
          
          await stockStore.addTransaction({
            item_id: ingredient.inventory_item_id,
            type: 'out',
            quantity: ingredientQuantity,
            reason: 'sale',
            notes: `Sale edit: ${newRecipe!.name} (Sale ID: ${id})`,
            user_id: user.id,
            restaurant_id: user.restaurant_id,
          });
        });

        await Promise.all(applyPromises);

        // Update state with the updated sale
        set(state => ({
          sales: state.sales.map(sale =>
            sale.id === id ? updatedSale : sale
          ),
          loading: false
        }));
      } catch (inventoryError: any) {
        // If inventory adjustment fails, revert the sale update
        const { error: revertError } = await supabase
          .from('sales')
          .update({
            recipe_id: originalSale.recipe_id,
            quantity: originalSale.quantity,
            receipt_id: originalSale.receipt_id,
            updated_by: user.id,
            updated_at: Date.now(),
          })
          .eq('id', id);

        if (revertError) {
          console.error('Failed to revert sale after inventory error:', revertError);
        }

        set({ error: `Sale update failed: ${inventoryError.message}`, loading: false });
        throw new Error(`Sale update failed: ${inventoryError.message}`);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSale: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('delete', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.MANAGER_ONLY);
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        sales: state.sales.filter(sale => sale.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  markInventoryUpdated: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { user, ability } = useAuthStore.getState();

      if (!user) {
        throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
      }

      if (!ability.can('update', 'Sale')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      if (!ability.can('create', 'StockTransaction')) {
        throw new Error(PERMISSION_ERRORS.FORBIDDEN);
      }

      const supabase = createClient();

      // First, fetch the sale with recipe details
      const { data: saleData, error: saleFetchError } = await supabase
        .from('sales')
        .select(`
          *,
          recipes (
            id,
            name,
            quantity,
            unit
          )
        `)
        .eq('id', id)
        .single();

      if (saleFetchError) throw saleFetchError;
      if (!saleData) throw new Error('Sale not found');

      // Fetch the recipe with full ingredient details
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', saleData.recipe_id)
        .single();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Recipe not found');

      // Validate recipe has ingredients
      if (!recipe.content?.ingredients || recipe.content.ingredients.length === 0) {
        throw new Error('Recipe has no ingredients. Cannot update inventory.');
      }

      // Calculate ingredient quantities and create stock transactions
      try {
        const recipeQuantity = recipe.quantity || 1; // Default to 1 if no recipe quantity
        const saleQuantity = saleData.quantity;

        // Calculate multiplier: how many times the recipe was sold
        const multiplier = saleQuantity / recipeQuantity;

        const stockStore = useStockStore.getState();
        const transactionPromises = recipe.content.ingredients.map(async (ingredient) => {
          // Calculate quantity needed: ingredient.quantity * multiplier
          const ingredientQuantity = ingredient.quantity * multiplier;

          // Create stock transaction for this ingredient
          await stockStore.addTransaction({
            item_id: ingredient.inventory_item_id,
            type: 'out',
            quantity: ingredientQuantity,
            reason: 'sale',
            notes: `Sale of ${recipe.name} (Sale ID: ${id})`,
            user_id: user.id,
            restaurant_id: user.restaurant_id,
          });
        });

        // Wait for all stock transactions to complete
        await Promise.all(transactionPromises);

        // Update the sale record to mark inventory as updated
        const { data, error } = await supabase
          .from('sales')
          .update({
            inventory_updated: true,
            updated_by: user.id,
            updated_at: Date.now(),
          })
          .eq('id', id)
          .select(`
            *,
            recipes (
              id,
              name,
              quantity,
              unit
            )
          `)
          .single();

        if (error) throw error;

        set(state => ({
          sales: state.sales.map(sale =>
            sale.id === id ? data : sale
          ),
          loading: false
        }));
      } catch (inventoryError: any) {
        // If inventory update fails, don't mark the sale as updated
        set({ error: `Inventory update failed: ${inventoryError.message}`, loading: false });
        throw new Error(`Inventory update failed: ${inventoryError.message}`);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
