/*
  # Add image_url columns to transaction tables
  
  This migration adds image_url columns to all transaction tables to support
  image attachments for expenses and income entries.
*/

-- Add image_url column to one_time_expenses
ALTER TABLE one_time_expenses 
ADD COLUMN image_url text;

-- Add image_url column to one_time_incomes
ALTER TABLE one_time_incomes 
ADD COLUMN image_url text;

-- Add image_url column to recurring_expenses
ALTER TABLE recurring_expenses 
ADD COLUMN image_url text;

-- Add image_url column to recurring_incomes
ALTER TABLE recurring_incomes 
ADD COLUMN image_url text;

-- Add comments to document the purpose
COMMENT ON COLUMN one_time_expenses.image_url IS 'URL of attached image for this expense (124x124px, stored in Supabase Storage)';
COMMENT ON COLUMN one_time_incomes.image_url IS 'URL of attached image for this income (124x124px, stored in Supabase Storage)';
COMMENT ON COLUMN recurring_expenses.image_url IS 'URL of attached image for this expense (124x124px, stored in Supabase Storage)';
COMMENT ON COLUMN recurring_incomes.image_url IS 'URL of attached image for this income (124x124px, stored in Supabase Storage)';
