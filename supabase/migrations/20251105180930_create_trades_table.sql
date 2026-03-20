/*
  # Create Trades Table and Update Tasks

  ## Overview
  Adds a trades table for managing different construction trades (Bricklayers, Joiners, etc.)
  and links tasks to specific trades.

  ## 1. New Table

  ### `trades`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Trade name (e.g., "Bricklayers", "Joiners")
  - `description` (text, optional) - Additional trade details
  - `created_at` (timestamptz) - When created
  - `updated_at` (timestamptz) - Last update

  ## 2. Table Updates

  ### `tasks`
  - Add `trade_id` (uuid, optional, references trades) - The trade this task is for

  ## 3. Security
  
  RLS policies ensure:
  - All authenticated users can view trades
  - Only managers can create, update, or delete trades
  - Task policies remain unchanged but now include trade relationship

  ## 4. Initial Data
  
  Seeds common UK construction trades

  ## 5. Important Notes
  - Trades are optional on tasks for flexibility
  - Indexes added for efficient querying
  - Common trades pre-populated
*/

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add trade_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'trade_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN trade_id uuid REFERENCES trades(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_trade_id ON tasks(trade_id);

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Anyone can view trades"
  ON trades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can update trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete trades"
  ON trades FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert common UK construction trades
INSERT INTO trades (name, description) VALUES
  ('Bricklayers', 'Brickwork and masonry'),
  ('Joiners', 'Carpentry and joinery work'),
  ('Groundworkers', 'Foundations and groundwork'),
  ('Plasterers', 'Plastering and rendering'),
  ('Electricians', 'Electrical installations'),
  ('Plumbers', 'Plumbing and heating'),
  ('Roofers', 'Roofing work'),
  ('Painters & Decorators', 'Painting and decorating'),
  ('Scaffolders', 'Scaffolding installation'),
  ('Labourers', 'General construction labour')
ON CONFLICT (name) DO NOTHING;