/*
  # Fix messages RLS policy

  1. Changes
    - Drop the existing insert policy
    - Create a simpler, more permissive insert policy that checks organization membership
  
  2. Security
    - Still maintains security by checking sender is authenticated user
    - Verifies both sender and receiver are in the same organization
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create new insert policy with better organization check
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles sender
      WHERE sender.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles receiver
        WHERE receiver.id = messages.receiver_id
        AND receiver.organization_id = sender.organization_id
      )
    )
  );
