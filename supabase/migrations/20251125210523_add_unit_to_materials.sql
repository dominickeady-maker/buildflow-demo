/*
  # Add unit field to materials table

  1. Changes
    - Add unit column to materials table for tracking measurement units (kg, m3, etc.)
    - Set default value to empty string
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add unit column to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS unit text DEFAULT '';
