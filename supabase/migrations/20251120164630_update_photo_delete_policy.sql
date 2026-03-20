/*
  # Update photo delete policy
  
  1. Changes
    - Drop the restrictive delete policy that only allows users to delete their own photos
    - Create a new policy that allows any authenticated user in the organization to delete photos
  
  2. Security
    - Users can only delete photos within their organization
    - Maintains organization-level security through organization_id check
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users delete own org photos" ON construction_photos;

-- Create new policy allowing org members to delete any photo in their org
CREATE POLICY "Org members can delete org photos"
  ON construction_photos
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
