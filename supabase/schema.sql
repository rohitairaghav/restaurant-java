-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'staff')),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_threshold DECIMAL(10,2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_transactions table
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
  quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('purchase', 'delivery', 'sale', 'waste', 'transfer')),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('low_stock', 'out_of_stock')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_restaurant_id ON inventory_items(restaurant_id);
CREATE INDEX idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX idx_stock_transactions_restaurant_id ON stock_transactions(restaurant_id);
CREATE INDEX idx_stock_transactions_created_at ON stock_transactions(created_at);
CREATE INDEX idx_alerts_restaurant_id ON alerts(restaurant_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_suppliers_restaurant_id ON suppliers(restaurant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update current stock after transaction
CREATE OR REPLACE FUNCTION update_current_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE inventory_items
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE inventory_items
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.item_id;
  END IF;

  -- Check for low stock alerts
  PERFORM check_low_stock_alert(NEW.item_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock updates
CREATE TRIGGER trigger_update_current_stock
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION update_current_stock();

-- Function to check and create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock_alert(item_uuid UUID)
RETURNS VOID AS $$
DECLARE
  item_record inventory_items%ROWTYPE;
  alert_exists BOOLEAN;
BEGIN
  SELECT * INTO item_record FROM inventory_items WHERE id = item_uuid;

  IF item_record.current_stock <= item_record.min_threshold THEN
    -- Check if alert already exists
    SELECT EXISTS(
      SELECT 1 FROM alerts
      WHERE item_id = item_uuid
      AND type = 'low_stock'
      AND is_read = FALSE
    ) INTO alert_exists;

    IF NOT alert_exists THEN
      INSERT INTO alerts (item_id, type, message, restaurant_id)
      VALUES (
        item_uuid,
        CASE WHEN item_record.current_stock <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        CASE
          WHEN item_record.current_stock <= 0 THEN
            item_record.name || ' is out of stock'
          ELSE
            item_record.name || ' is running low (Current: ' || item_record.current_stock || ' ' || item_record.unit || ', Minimum: ' || item_record.min_threshold || ' ' || item_record.unit || ')'
        END,
        item_record.restaurant_id
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access data from their restaurant
CREATE POLICY "Users can access their restaurant data" ON restaurants
  FOR ALL USING (
    id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can access their restaurant suppliers" ON suppliers
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their restaurant inventory" ON inventory_items
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their restaurant transactions" ON stock_transactions
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their restaurant alerts" ON alerts
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );