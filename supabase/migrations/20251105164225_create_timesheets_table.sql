/*
  # Create Timesheets Table for Hours and Pricework Tracking

  ## Overview
  Adds a timesheets table for workers to log daily hours worked or pricework completed.
  This enables tracking of time and payment for construction work across sites and plots.

  ## 1. New Table

  ### `timesheets`
  - `id` (uuid, primary key)
  - `worker_id` (uuid, references profiles) - The worker logging the entry
  - `site_id` (uuid, references sites) - Site where work was performed
  - `plot_number` (text) - Specific plot or location identifier
  - `work_type` (text) - 'hourly' or 'pricework'
  - `task_description` (text) - Description of work performed
  - `hours_worked` (numeric, optional) - Hours logged (for hourly work)
  - `pricework_amount` (numeric, optional) - Amount in £ (for pricework)
  - `date_worked` (date) - Date the work was performed
  - `notes` (text, optional) - Additional notes or comments
  - `created_at` (timestamptz) - When the entry was submitted
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  
  RLS policies ensure:
  - Workers can create and view their own timesheet entries
  - Workers can update their own entries
  - Managers can view all timesheet entries
  - Managers can update and delete any timesheet entry

  ## 3. Important Notes
  - Either hours_worked or pricework_amount must be provided based on work_type
  - Indexes added for efficient querying by worker, site, and date
  - Timestamps track when entries are created and modified
*/

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  plot_number text NOT NULL DEFAULT '',
  work_type text NOT NULL CHECK (work_type IN ('hourly', 'pricework')),
  task_description text NOT NULL,
  hours_worked numeric CHECK (hours_worked IS NULL OR hours_worked >= 0),
  pricework_amount numeric CHECK (pricework_amount IS NULL OR pricework_amount >= 0),
  date_worked date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timesheets_worker_id ON timesheets(worker_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_site_id ON timesheets(site_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date_worked ON timesheets(date_worked);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_type ON timesheets(work_type);

-- Enable Row Level Security
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timesheets
CREATE POLICY "Workers can view their own timesheets"
  ON timesheets FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can create their own timesheets"
  ON timesheets FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update their own timesheets"
  ON timesheets FOR UPDATE
  TO authenticated
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Managers can view all timesheets"
  ON timesheets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can update any timesheet"
  ON timesheets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete timesheets"
  ON timesheets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();