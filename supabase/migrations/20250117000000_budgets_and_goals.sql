/*
  # Budgets and Goals System
  
  This migration adds comprehensive budgeting and goal tracking functionality:
  
  1. New Tables:
    - `category_budgets` - Monthly budgets per category
    - `savings_goals` - Long-term savings targets
    - `budget_alerts` - User notification preferences
    - `goal_milestones` - Achievement tracking
    
  2. Features:
    - Category-specific monthly budgets
    - Savings goals with target dates
    - Smart alert system
    - Achievement tracking
    - Progress visualization data
*/

-- Create category_budgets table
CREATE TABLE category_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_limit decimal(10,2) NOT NULL DEFAULT 0,
  alert_threshold decimal(3,2) NOT NULL DEFAULT 0.80, -- Alert at 80% by default
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, user_id)
);

-- Create savings_goals table
CREATE TABLE savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  target_amount decimal(10,2) NOT NULL,
  current_amount decimal(10,2) NOT NULL DEFAULT 0,
  target_date date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  color text NOT NULL DEFAULT '#3b82f6',
  icon_url text,
  icon_type text DEFAULT 'preset' CHECK (icon_type IN ('custom', 'preset')),
  preset_icon_id text,
  is_active boolean NOT NULL DEFAULT true,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_alerts table for user notification preferences
CREATE TABLE budget_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('budget_threshold', 'budget_exceeded', 'goal_milestone', 'goal_completed')),
  is_enabled boolean NOT NULL DEFAULT true,
  threshold_percentage decimal(3,2), -- For budget alerts (0.50 = 50%)
  milestone_percentage decimal(3,2), -- For goal milestones (0.25 = 25%, 0.50 = 50%, etc.)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, alert_type, threshold_percentage, milestone_percentage)
);

-- Create goal_milestones table for achievement tracking
CREATE TABLE goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  milestone_percentage decimal(3,2) NOT NULL, -- 0.25 = 25%, 0.50 = 50%, etc.
  achieved_at timestamptz NOT NULL DEFAULT now(),
  amount_at_achievement decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, milestone_percentage)
);

-- Create goal_contributions table for tracking manual contributions
CREATE TABLE goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text,
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Category budgets policies
CREATE POLICY "Users can view own category budgets"
  ON category_budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category budgets"
  ON category_budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category budgets"
  ON category_budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own category budgets"
  ON category_budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Savings goals policies
CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Budget alerts policies
CREATE POLICY "Users can view own budget alerts"
  ON budget_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget alerts"
  ON budget_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget alerts"
  ON budget_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget alerts"
  ON budget_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Goal milestones policies
CREATE POLICY "Users can view own goal milestones"
  ON goal_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal milestones"
  ON goal_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Goal contributions policies
CREATE POLICY "Users can view own goal contributions"
  ON goal_contributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal contributions"
  ON goal_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal contributions"
  ON goal_contributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions"
  ON goal_contributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_category_budgets_user_id ON category_budgets(user_id);
CREATE INDEX idx_category_budgets_category_id ON category_budgets(category_id);
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_target_date ON savings_goals(target_date);
CREATE INDEX idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_date ON goal_contributions(contribution_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_category_budgets_updated_at BEFORE UPDATE ON category_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_alerts_updated_at BEFORE UPDATE ON budget_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default budget alert preferences for existing users
INSERT INTO budget_alerts (user_id, alert_type, is_enabled, threshold_percentage)
SELECT DISTINCT user_id, 'budget_threshold', true, 0.80
FROM categories
ON CONFLICT DO NOTHING;

INSERT INTO budget_alerts (user_id, alert_type, is_enabled)
SELECT DISTINCT user_id, 'budget_exceeded', true
FROM categories
ON CONFLICT DO NOTHING;

INSERT INTO budget_alerts (user_id, alert_type, is_enabled, milestone_percentage)
SELECT DISTINCT user_id, 'goal_milestone', true, 0.25
FROM categories
ON CONFLICT DO NOTHING;

INSERT INTO budget_alerts (user_id, alert_type, is_enabled, milestone_percentage)
SELECT DISTINCT user_id, 'goal_milestone', true, 0.50
FROM categories
ON CONFLICT DO NOTHING;

INSERT INTO budget_alerts (user_id, alert_type, is_enabled, milestone_percentage)
SELECT DISTINCT user_id, 'goal_milestone', true, 0.75
FROM categories
ON CONFLICT DO NOTHING;

INSERT INTO budget_alerts (user_id, alert_type, is_enabled)
SELECT DISTINCT user_id, 'goal_completed', true
FROM categories
ON CONFLICT DO NOTHING;
