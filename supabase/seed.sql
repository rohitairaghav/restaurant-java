-- Insert sample restaurant
INSERT INTO restaurants (id, name, address, phone) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Restaurant',
  '123 Main St, City, State 12345',
  '+1-555-0123'
);

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, restaurant_id) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Fresh Produce Co',
  'John Smith',
  '+1-555-0124',
  'john@freshproduce.com',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Meat & Seafood Supply',
  'Jane Doe',
  '+1-555-0125',
  'jane@meatsupply.com',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Dairy Direct',
  'Bob Wilson',
  '+1-555-0126',
  'bob@dairydirect.com',
  '550e8400-e29b-41d4-a716-446655440000'
);

-- Insert sample inventory items
INSERT INTO inventory_items (id, name, category, unit, cost_per_unit, current_stock, min_threshold, supplier_id, restaurant_id) VALUES
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Tomatoes',
  'Vegetables',
  'kg',
  3.50,
  25.0,
  5.0,
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  'Onions',
  'Vegetables',
  'kg',
  2.25,
  15.0,
  3.0,
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Chicken Breast',
  'Meat',
  'kg',
  12.99,
  8.0,
  2.0,
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Ground Beef',
  'Meat',
  'kg',
  15.99,
  1.5,
  3.0,
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'Milk',
  'Dairy',
  'liters',
  1.99,
  20.0,
  5.0,
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440015',
  'Cheddar Cheese',
  'Dairy',
  'kg',
  8.99,
  2.0,
  1.0,
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440016',
  'Rice',
  'Grains',
  'kg',
  4.50,
  50.0,
  10.0,
  NULL,
  '550e8400-e29b-41d4-a716-446655440000'
),
(
  '550e8400-e29b-41d4-a716-446655440017',
  'Olive Oil',
  'Other',
  'liters',
  12.99,
  3.0,
  1.0,
  NULL,
  '550e8400-e29b-41d4-a716-446655440000'
);