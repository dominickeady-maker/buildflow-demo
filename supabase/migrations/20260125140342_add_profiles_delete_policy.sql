/*
  # Add Delete Policy for Profiles

  ## Changes
  - Adds DELETE policy to profiles table allowing managers to delete worker profiles
  
  ## Security
  - Only managers can delete profiles
  - Ensures proper authorization check against the manager role
*/

CREATE POLICY "Managers can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );
