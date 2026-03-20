/*
  # Fix messages insert RLS policy

  1. Changes
    - Drop the broken insert policy
    - Create a corrected policy that properly references the NEW row values
  
  2. Security
    - Verifies sender is the authenticated user
    - Ensures both users are in the same organization
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create corrected insert policy
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() 
    AND 
    EXISTS (
      SELECT 1 
      FROM profiles sender_profile
      JOIN profiles receiver_profile ON receiver_profile.organization_id = sender_profile.organization_id
      WHERE sender_profile.id = sender_id
        AND receiver_profile.id = receiver_id
    )
  );
