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