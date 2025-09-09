/*
  # Add Maaltijdcheques Support to Expenses

  Add `is_maaltijdcheques` field to both one-time and recurring expenses
  to track which expenses can be paid with meal vouchers.
*/

-- Add is_maaltijdcheques field to one_time_expenses
ALTER TABLE one_time_expenses 
ADD COLUMN is_maaltijdcheques boolean NOT NULL DEFAULT false;

-- Add is_maaltijdcheques field to recurring_expenses
ALTER TABLE recurring_expenses 
ADD COLUMN is_maaltijdcheques boolean NOT NULL DEFAULT false;
