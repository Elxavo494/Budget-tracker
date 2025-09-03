/*
  # Add display_order columns for drag and drop functionality

  1. New Columns
    - Add `display_order` column to all transaction tables
    - Default to 0 for new records
    - Set initial values based on created_at timestamp

  2. Indexes
    - Add indexes for better sorting performance
*/

-- Add display_order columns to all tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_incomes' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE recurring_incomes ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_time_incomes' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE one_time_incomes ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_time_expenses' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE one_time_expenses ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Set initial display_order values based on created_at (newest first)
UPDATE recurring_incomes 
SET display_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)
WHERE display_order = 0;

UPDATE recurring_expenses 
SET display_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)
WHERE display_order = 0;

UPDATE one_time_incomes 
SET display_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)
WHERE display_order = 0;

UPDATE one_time_expenses 
SET display_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC)
WHERE display_order = 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_incomes_display_order ON recurring_incomes(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_display_order ON recurring_expenses(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_one_time_incomes_display_order ON one_time_incomes(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_one_time_expenses_display_order ON one_time_expenses(user_id, display_order);