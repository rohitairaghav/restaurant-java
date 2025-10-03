import { z } from 'zod';

/**
 * Validation schemas for Restaurant Inventory Management System
 * Using Zod for runtime type validation and security
 */

// ==================== INVENTORY ITEMS ====================

export const InventoryItemCreateSchema = z.object({
  name: z.string()
    .min(1, 'Item name is required')
    .max(255, 'Item name must be less than 255 characters')
    .trim(),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  unit: z.string()
    .min(1, 'Unit is required')
    .max(50, 'Unit must be less than 50 characters'),
  cost_per_unit: z.number()
    .positive('Cost per unit must be positive')
    .finite('Cost per unit must be a valid number'),
  current_stock: z.number()
    .min(0, 'Current stock cannot be negative')
    .finite('Current stock must be a valid number')
    .default(0),
  min_threshold: z.number()
    .min(0, 'Minimum threshold cannot be negative')
    .finite('Minimum threshold must be a valid number'),
  supplier_id: z.string().uuid('Invalid supplier ID').nullable().optional(),
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
});

export const InventoryItemUpdateSchema = InventoryItemCreateSchema.partial().extend({
  id: z.string().uuid('Invalid item ID'),
});

// ==================== STOCK TRANSACTIONS ====================

export const StockTransactionCreateSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  type: z.enum(['in', 'out'], {
    errorMap: () => ({ message: 'Transaction type must be "in" or "out"' }),
  }),
  quantity: z.number()
    .positive('Quantity must be greater than 0')
    .finite('Quantity must be a valid number'),
  reason: z.enum(['purchase', 'delivery', 'sale', 'waste', 'transfer'], {
    errorMap: () => ({ message: 'Invalid transaction reason' }),
  }),
  sku: z.string()
    .max(100, 'SKU must be less than 100 characters')
    .trim()
    .nullable()
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
});

export const StockTransactionUpdateSchema = z.object({
  id: z.string().uuid('Invalid transaction ID'),
  item_id: z.string().uuid('Invalid item ID').optional(),
  type: z.enum(['in', 'out']).optional(),
  quantity: z.number()
    .positive('Quantity must be greater than 0')
    .finite('Quantity must be a valid number')
    .optional(),
  reason: z.enum(['purchase', 'delivery', 'sale', 'waste', 'transfer']).optional(),
  sku: z.string()
    .max(100, 'SKU must be less than 100 characters')
    .trim()
    .nullable()
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
}).refine(
  (data) => {
    // At least one field must be provided for update
    const { id, ...rest } = data;
    return Object.keys(rest).length > 0;
  },
  { message: 'At least one field must be provided for update' }
);

// ==================== SUPPLIERS ====================

export const SupplierCreateSchema = z.object({
  name: z.string()
    .min(1, 'Supplier name is required')
    .max(255, 'Supplier name must be less than 255 characters')
    .trim(),
  contact_person: z.string()
    .max(255, 'Contact person name must be less than 255 characters')
    .trim()
    .nullable()
    .optional(),
  phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .nullable()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .nullable()
    .optional(),
  address: z.string()
    .max(1000, 'Address must be less than 1000 characters')
    .trim()
    .nullable()
    .optional(),
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial().extend({
  id: z.string().uuid('Invalid supplier ID'),
});

// ==================== AUTHENTICATION ====================

export const SignInSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const SignUpSchema = SignInSchema.extend({
  role: z.enum(['manager', 'staff'], {
    errorMap: () => ({ message: 'Role must be "manager" or "staff"' }),
  }),
  restaurantId: z.string().uuid('Invalid restaurant ID'),
});

// ==================== ALERTS ====================

export const AlertUpdateSchema = z.object({
  id: z.string().uuid('Invalid alert ID'),
  is_read: z.boolean(),
});

// ==================== RESTAURANTS ====================

export const RestaurantCreateSchema = z.object({
  name: z.string()
    .min(1, 'Restaurant name is required')
    .max(255, 'Restaurant name must be less than 255 characters')
    .trim(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
  phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .trim()
    .nullable()
    .optional(),
});

export const RestaurantUpdateSchema = RestaurantCreateSchema.partial().extend({
  id: z.string().uuid('Invalid restaurant ID'),
});

// ==================== TYPE EXPORTS ====================

export type InventoryItemCreateInput = z.infer<typeof InventoryItemCreateSchema>;
export type InventoryItemUpdateInput = z.infer<typeof InventoryItemUpdateSchema>;
export type StockTransactionCreateInput = z.infer<typeof StockTransactionCreateSchema>;
export type StockTransactionUpdateInput = z.infer<typeof StockTransactionUpdateSchema>;
export type SupplierCreateInput = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof SupplierUpdateSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type AlertUpdateInput = z.infer<typeof AlertUpdateSchema>;
export type RestaurantCreateInput = z.infer<typeof RestaurantCreateSchema>;
export type RestaurantUpdateInput = z.infer<typeof RestaurantUpdateSchema>;

// ==================== VALIDATION HELPERS ====================

/**
 * Validates input data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws validation error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates input data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result object with success flag and data or error
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
