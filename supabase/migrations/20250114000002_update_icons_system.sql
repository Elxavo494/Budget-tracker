/*
  # Update Icons System for Transactions
  
  This migration updates the image system to support both custom uploaded icons
  and preset brand icons for transactions.
*/

-- Rename image_url columns to icon_url for clarity
ALTER TABLE one_time_expenses 
RENAME COLUMN image_url TO icon_url;

ALTER TABLE one_time_incomes 
RENAME COLUMN image_url TO icon_url;

ALTER TABLE recurring_expenses 
RENAME COLUMN image_url TO icon_url;

ALTER TABLE recurring_incomes 
RENAME COLUMN image_url TO icon_url;

-- Add icon_type column to distinguish between custom and preset icons
ALTER TABLE one_time_expenses 
ADD COLUMN icon_type text CHECK (icon_type IN ('custom', 'preset')) DEFAULT 'custom';

ALTER TABLE one_time_incomes 
ADD COLUMN icon_type text CHECK (icon_type IN ('custom', 'preset')) DEFAULT 'custom';

ALTER TABLE recurring_expenses 
ADD COLUMN icon_type text CHECK (icon_type IN ('custom', 'preset')) DEFAULT 'custom';

ALTER TABLE recurring_incomes 
ADD COLUMN icon_type text CHECK (icon_type IN ('custom', 'preset')) DEFAULT 'custom';

-- Add preset_icon_id column for preset icons
ALTER TABLE one_time_expenses 
ADD COLUMN preset_icon_id text;

ALTER TABLE one_time_incomes 
ADD COLUMN preset_icon_id text;

ALTER TABLE recurring_expenses 
ADD COLUMN preset_icon_id text;

ALTER TABLE recurring_incomes 
ADD COLUMN preset_icon_id text;

-- Update comments to reflect new purpose
COMMENT ON COLUMN one_time_expenses.icon_url IS 'URL of custom icon for this expense (124x124px) or preset icon path';
COMMENT ON COLUMN one_time_incomes.icon_url IS 'URL of custom icon for this income (124x124px) or preset icon path';
COMMENT ON COLUMN recurring_expenses.icon_url IS 'URL of custom icon for this expense (124x124px) or preset icon path';
COMMENT ON COLUMN recurring_incomes.icon_url IS 'URL of custom icon for this income (124x124px) or preset icon path';

COMMENT ON COLUMN one_time_expenses.icon_type IS 'Type of icon: custom (uploaded) or preset (brand icon)';
COMMENT ON COLUMN one_time_incomes.icon_type IS 'Type of icon: custom (uploaded) or preset (brand icon)';
COMMENT ON COLUMN recurring_expenses.icon_type IS 'Type of icon: custom (uploaded) or preset (brand icon)';
COMMENT ON COLUMN recurring_incomes.icon_type IS 'Type of icon: custom (uploaded) or preset (brand icon)';

COMMENT ON COLUMN one_time_expenses.preset_icon_id IS 'ID of preset icon (e.g., spotify, mcdonalds, edenred)';
COMMENT ON COLUMN one_time_incomes.preset_icon_id IS 'ID of preset icon (e.g., spotify, mcdonalds, edenred)';
COMMENT ON COLUMN recurring_expenses.preset_icon_id IS 'ID of preset icon (e.g., spotify, mcdonalds, edenred)';
COMMENT ON COLUMN recurring_incomes.preset_icon_id IS 'ID of preset icon (e.g., spotify, mcdonalds, edenred)';
