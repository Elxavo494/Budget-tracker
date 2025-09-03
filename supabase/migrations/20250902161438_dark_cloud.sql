/*
  # Finance Tracker Database Schema - Clean Version

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique per user)
      - `color` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    - `recurring_incomes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `amount` (decimal)
      - `recurrence` (text: weekly/monthly/yearly)
      - `start_date` (date)
      - `end_date` (date, optional)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    - `recurring_expenses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `amount` (decimal)
      - `recurrence` (text: weekly/monthly/yearly)
      - `start_date` (date)
      - `end_date` (date, optional)
      - `category_id` (uuid, references categories)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    - `one_time_incomes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `amount` (decimal)
      - `date` (date)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    - `one_time_expenses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `amount` (decimal)
      - `date` (date)
      - `category_id` (uuid, references categories)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own financial data

  3. Notes
    - Default categories are created client-side to avoid signup issues
    - No database triggers that could interfere with user creation
*/

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS one_time_expenses CASCADE;
DROP TABLE IF EXISTS one_time_incomes CASCADE;
DROP TABLE IF EXISTS recurring_expenses CASCADE;
DROP TABLE IF EXISTS recurring_incomes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop any existing functions and triggers
DROP TRIGGER IF EXISTS create_default_categories_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_default_categories();

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create recurring_incomes table
CREATE TABLE recurring_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  recurrence text NOT NULL CHECK (recurrence IN ('weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create recurring_expenses table
CREATE TABLE recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  recurrence text NOT NULL CHECK (recurrence IN ('weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  category_id uuid REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create one_time_incomes table
CREATE TABLE one_time_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create one_time_expenses table
CREATE TABLE one_time_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_expenses ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recurring incomes policies
CREATE POLICY "Users can view own recurring incomes"
  ON recurring_incomes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring incomes"
  ON recurring_incomes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring incomes"
  ON recurring_incomes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring incomes"
  ON recurring_incomes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recurring expenses policies
CREATE POLICY "Users can view own recurring expenses"
  ON recurring_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = recurring_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can insert own recurring expenses"
  ON recurring_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = recurring_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can update own recurring expenses"
  ON recurring_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = recurring_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can delete own recurring expenses"
  ON recurring_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- One-time incomes policies
CREATE POLICY "Users can view own one-time incomes"
  ON one_time_incomes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own one-time incomes"
  ON one_time_incomes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own one-time incomes"
  ON one_time_incomes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own one-time incomes"
  ON one_time_incomes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- One-time expenses policies
CREATE POLICY "Users can view own one-time expenses"
  ON one_time_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = one_time_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can insert own one-time expenses"
  ON one_time_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = one_time_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can update own one-time expenses"
  ON one_time_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.id = one_time_expenses.category_id 
    AND categories.user_id = auth.uid()
  );

CREATE POLICY "Users can delete own one-time expenses"
  ON one_time_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_recurring_incomes_user_id ON recurring_incomes(user_id);
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_category_id ON recurring_expenses(category_id);
CREATE INDEX idx_one_time_incomes_user_id ON one_time_incomes(user_id);
CREATE INDEX idx_one_time_incomes_date ON one_time_incomes(date);
CREATE INDEX idx_one_time_expenses_user_id ON one_time_expenses(user_id);
CREATE INDEX idx_one_time_expenses_category_id ON one_time_expenses(category_id);
CREATE INDEX idx_one_time_expenses_date ON one_time_expenses(date);