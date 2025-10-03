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
  current_stock DECIMAL(10,2) DEFAULT 0 CHECK (current_stock >= 0),
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
  sku VARCHAR(100),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

CREATE TRIGGER update_stock_transactions_updated_at
  BEFORE UPDATE ON stock_transactions
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

-- Function to update stock transaction and adjust inventory atomically
CREATE OR REPLACE FUNCTION update_stock_transaction(
  transaction_uuid UUID,
  new_item_id UUID,
  new_type VARCHAR(10),
  new_quantity DECIMAL(10,2),
  new_reason VARCHAR(50),
  new_sku VARCHAR(100),
  new_notes TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  old_transaction stock_transactions%ROWTYPE;
  quantity_diff DECIMAL(10,2);
  stock_adjustment DECIMAL(10,2);
  current_stock_value DECIMAL(10,2);
  new_stock_value DECIMAL(10,2);
BEGIN
  -- Validate inputs
  IF new_quantity IS NOT NULL AND new_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Quantity must be greater than 0';
    RETURN;
  END IF;

  -- Get the old transaction
  SELECT * INTO old_transaction FROM stock_transactions WHERE id = transaction_uuid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Transaction not found';
    RETURN;
  END IF;

  -- SECURITY: Verify user has access to this transaction (restaurant isolation)
  IF NOT EXISTS (
    SELECT 1 FROM stock_transactions
    WHERE id = transaction_uuid
    AND restaurant_id IN (
      SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
    )
  ) THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Cannot modify transactions from other restaurants';
    RETURN;
  END IF;

  -- SECURITY: Validate new_item_id belongs to same restaurant
  IF new_item_id IS NOT NULL AND new_item_id != old_transaction.item_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM inventory_items
      WHERE id = new_item_id
      AND restaurant_id = old_transaction.restaurant_id
    ) THEN
      RETURN QUERY SELECT FALSE, 'Unauthorized: Item does not belong to this restaurant';
      RETURN;
    END IF;
  END IF;

  -- Handle stock adjustments when quantity, item_id, or type changes
  IF COALESCE(new_quantity, old_transaction.quantity) != old_transaction.quantity OR
     COALESCE(new_item_id, old_transaction.item_id) != old_transaction.item_id OR
     COALESCE(new_type, old_transaction.type) != old_transaction.type THEN

    -- Step 1: Reverse the old transaction's effect on old item
    SELECT current_stock INTO current_stock_value
    FROM inventory_items
    WHERE id = old_transaction.item_id
    FOR UPDATE;

    -- Reverse old transaction
    stock_adjustment := CASE
      WHEN old_transaction.type = 'in' THEN -old_transaction.quantity
      ELSE old_transaction.quantity
    END;

    new_stock_value := current_stock_value + stock_adjustment;

    -- Prevent negative stock when reversing
    IF new_stock_value < 0 THEN
      RETURN QUERY SELECT FALSE, 'Cannot reverse transaction: would result in negative stock';
      RETURN;
    END IF;

    UPDATE inventory_items
    SET current_stock = new_stock_value
    WHERE id = old_transaction.item_id;

    -- Step 2: Apply the new transaction to the new item
    SELECT current_stock INTO current_stock_value
    FROM inventory_items
    WHERE id = COALESCE(new_item_id, old_transaction.item_id)
    FOR UPDATE;

    -- Apply new transaction
    stock_adjustment := CASE
      WHEN COALESCE(new_type, old_transaction.type) = 'in' THEN COALESCE(new_quantity, old_transaction.quantity)
      ELSE -COALESCE(new_quantity, old_transaction.quantity)
    END;

    new_stock_value := current_stock_value + stock_adjustment;

    -- Prevent negative stock
    IF new_stock_value < 0 THEN
      RETURN QUERY SELECT FALSE, 'Update would result in negative stock for target item';
      RETURN;
    END IF;

    UPDATE inventory_items
    SET current_stock = new_stock_value
    WHERE id = COALESCE(new_item_id, old_transaction.item_id);
  END IF;

  -- Update the transaction (use COALESCE to keep original values if null)
  UPDATE stock_transactions
  SET
    item_id = COALESCE(new_item_id, old_transaction.item_id),
    type = COALESCE(new_type, old_transaction.type),
    quantity = COALESCE(new_quantity, old_transaction.quantity),
    reason = COALESCE(new_reason, old_transaction.reason),
    sku = COALESCE(new_sku, old_transaction.sku),
    notes = COALESCE(new_notes, old_transaction.notes)
  WHERE id = transaction_uuid;

  -- Check for low stock alerts
  PERFORM check_low_stock_alert(old_transaction.item_id);

  RETURN QUERY SELECT TRUE, 'Transaction updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
            item_record.name || ' is running low'
        END,
        item_record.restaurant_id
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create security audit log table
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'success' NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_audit_restaurant_id ON security_audit_log(restaurant_id);
CREATE INDEX idx_audit_created_at ON security_audit_log(created_at);
CREATE INDEX idx_audit_action ON security_audit_log(action);

-- Function to log security audit events
CREATE OR REPLACE FUNCTION log_security_audit(
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_restaurant_id UUID;
  v_audit_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT restaurant_id INTO v_restaurant_id
    FROM user_profiles
    WHERE id = v_user_id;
  END IF;

  INSERT INTO security_audit_log (
    user_id, restaurant_id, action, resource_type, resource_id,
    ip_address, user_agent, metadata, status, error_message
  ) VALUES (
    v_user_id, v_restaurant_id, p_action, p_resource_type, p_resource_id,
    p_ip_address, p_user_agent, p_metadata, p_status, p_error_message
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

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

-- Security audit log policies
CREATE POLICY "Managers can view their restaurant audit logs" ON security_audit_log
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "System can insert audit logs" ON security_audit_log
  FOR INSERT WITH CHECK (true);