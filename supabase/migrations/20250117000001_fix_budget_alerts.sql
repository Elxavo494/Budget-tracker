/*
  # Fix Budget Alerts for Existing Users
  
  This migration ensures that all users have default budget alert preferences.
  The original migration tried to create alerts but may have failed due to RLS.
*/

-- First, remove the existing default alert inserts from the previous migration
-- since they may not have worked due to RLS

-- Create a function to set up default alerts for a user
CREATE OR REPLACE FUNCTION setup_default_budget_alerts(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default budget alert preferences
  INSERT INTO budget_alerts (user_id, alert_type, is_enabled, threshold_percentage)
  VALUES 
    (target_user_id, 'budget_threshold', true, 0.80),
    (target_user_id, 'budget_exceeded', true, NULL)
  ON CONFLICT (user_id, alert_type, threshold_percentage, milestone_percentage) DO NOTHING;

  INSERT INTO budget_alerts (user_id, alert_type, is_enabled, milestone_percentage)
  VALUES 
    (target_user_id, 'goal_milestone', true, 0.25),
    (target_user_id, 'goal_milestone', true, 0.50),
    (target_user_id, 'goal_milestone', true, 0.75)
  ON CONFLICT (user_id, alert_type, threshold_percentage, milestone_percentage) DO NOTHING;

  INSERT INTO budget_alerts (user_id, alert_type, is_enabled)
  VALUES 
    (target_user_id, 'goal_completed', true)
  ON CONFLICT (user_id, alert_type, threshold_percentage, milestone_percentage) DO NOTHING;
END;
$$;

-- Set up default alerts for all existing users who have categories
-- (This indicates they are active users)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM categories 
  LOOP
    PERFORM setup_default_budget_alerts(user_record.user_id);
  END LOOP;
END;
$$;

-- Create a trigger to automatically set up alerts for new users
CREATE OR REPLACE FUNCTION trigger_setup_default_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a user creates their first category, set up default alerts
  IF NOT EXISTS (
    SELECT 1 FROM budget_alerts WHERE user_id = NEW.user_id
  ) THEN
    PERFORM setup_default_budget_alerts(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on categories table
DROP TRIGGER IF EXISTS setup_alerts_on_first_category ON categories;
CREATE TRIGGER setup_alerts_on_first_category
  AFTER INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_setup_default_alerts();
