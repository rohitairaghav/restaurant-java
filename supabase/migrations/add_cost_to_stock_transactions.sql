-- Add cost field to stock_transactions table
ALTER TABLE stock_transactions
ADD COLUMN cost DECIMAL(10,2);

-- Add comment to explain the field
COMMENT ON COLUMN stock_transactions.cost IS 'Total cost of the transaction (cost per unit × quantity)';
