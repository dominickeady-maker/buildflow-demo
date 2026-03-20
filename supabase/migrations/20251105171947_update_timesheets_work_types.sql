/*
  # Update Timesheets Work Types

  ## Overview
  Updates the work_type column in the timesheets table to use UK terminology:
  - Changes 'hourly' to 'daywork'
  - Changes 'pricework' to 'price'

  ## Changes
  1. Updates existing data to use new terminology
  2. Modifies the CHECK constraint to use new values

  ## Important Notes
  - Maintains data integrity by updating existing records first
  - Updates constraint to only allow 'price' or 'daywork' values
*/

-- Update existing records to use new terminology
UPDATE timesheets SET work_type = 'daywork' WHERE work_type = 'hourly';
UPDATE timesheets SET work_type = 'price' WHERE work_type = 'pricework';

-- Drop the old constraint
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_work_type_check;

-- Add new constraint with updated values
ALTER TABLE timesheets ADD CONSTRAINT timesheets_work_type_check 
  CHECK (work_type IN ('price', 'daywork'));