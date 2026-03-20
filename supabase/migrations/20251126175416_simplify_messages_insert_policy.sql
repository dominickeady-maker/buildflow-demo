/*
  # Simplify messages insert RLS policy

  1. Changes
    - Drop the complex insert policy
    - Create a simpler policy that works with Supabase RLS
  
  2. Security
    - Verifies sender is the authenticated user
    - Checks organization_id matches sender's organization
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create simplified insert policy
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() 
    AND 
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND
    receiver_id IN (
      SELECT id 
      FROM profiles 
      WHERE organization_id = (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );
