export const INVENTORY_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Meat',
  'Seafood',
  'Dairy',
  'Grains',
  'Spices',
  'Beverages',
  'Cleaning Supplies',
  'Other'
] as const;

export const UNITS = [
  'kg',
  'g',
  'lbs',
  'oz',
  'liters',
  'ml',
  'pieces',
  'boxes',
  'cans',
  'bottles'
] as const;

export const TRANSACTION_REASONS = {
  in: ['purchase', 'delivery'] as const,
  out: ['sale', 'waste', 'transfer'] as const
} as const;

export const USER_ROLES = ['manager', 'staff'] as const;

export const ALERT_TYPES = ['low_stock', 'out_of_stock'] as const;

/**
 * Valid recipe units - SINGLE SOURCE OF TRUTH
 *
 * IMPORTANT: When updating this list:
 * 1. Create a Liquibase migration to update the CHECK constraint
 * 2. Run: npm run db:update
 *
 * This constant is used for:
 * - TypeScript type generation (RecipeUnit type)
 * - Frontend dropdown options
 * - Server-side validation
 * - Must match database CHECK constraint: check_recipe_unit
 */
export const RECIPE_UNITS = [
  'large serving',
  'medium serving',
  'small serving',
] as const;

/**
 * Recipe unit labels for UI display
 * Maps unit value to human-readable label
 */
export const RECIPE_UNIT_LABELS: Record<typeof RECIPE_UNITS[number], string> = {
  'large serving': 'Large Serving',
  'medium serving': 'Medium Serving',
  'small serving': 'Small Serving',
};

/**
 * Recipe status values - SINGLE SOURCE OF TRUTH
 */
export const RECIPE_STATUSES = ['Active', 'Disabled', 'Removed'] as const;