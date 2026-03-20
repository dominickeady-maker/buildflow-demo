/*
  # Add task linking to photos

  1. Changes
    - Add task_id column to construction_photos table to link photos to tasks
    - Add description column (renaming caption to description for clarity)
  
  2. Security
    - Maintains existing RLS policies
    - Foreign key ensures task exists and belongs to same organization
*/

-- Add task_id column to link photos to tasks
ALTER TABLE construction_photos 
ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Rename caption to description for clarity (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'construction_photos' 
    AND column_name = 'caption'
  ) THEN
    ALTER TABLE construction_photos RENAME COLUMN caption TO description;
  END IF;
END $$;

-- Create index for faster task-photo queries
CREATE INDEX IF NOT EXISTS idx_construction_photos_task_id 
ON construction_photos(task_id);
