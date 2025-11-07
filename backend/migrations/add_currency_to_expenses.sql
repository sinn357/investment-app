-- Add currency column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KRW';

-- Add comment
COMMENT ON COLUMN expenses.currency IS 'Currency type: KRW (Korean Won) or USD (US Dollar)';
