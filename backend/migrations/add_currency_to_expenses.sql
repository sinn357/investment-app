-- Add currency column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KRW';

-- Add comment
COMMENT ON COLUMN expenses.currency IS 'Currency type: KRW (Korean Won) or USD (US Dollar)';

-- Update transaction_type check constraint to include '이체'
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_transaction_type_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_transaction_type_check CHECK (transaction_type IN ('수입', '지출', '이체'));
