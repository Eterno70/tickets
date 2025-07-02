/*
  # Fix RLS policies for chat_messages table

  1. Security Updates
    - Drop existing overly permissive policies
    - Create proper RLS policies for chat_messages table
    - Allow authenticated users to insert messages where they are the sender
    - Allow authenticated users to read messages for tickets they have access to
    - Allow authenticated users to update/delete their own messages

  2. Policy Details
    - INSERT: Users can only insert messages where sender_id matches their auth.uid()
    - SELECT: Users can read messages for tickets they created or are assigned to
    - UPDATE: Users can only update their own messages
    - DELETE: Users can only delete their own messages
*/

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "enable_insert_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "enable_read_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "enable_update_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "enable_delete_chat_messages" ON chat_messages;

-- Create proper INSERT policy - users can only insert messages as themselves
CREATE POLICY "Users can insert their own messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Create proper SELECT policy - users can read messages for tickets they have access to
CREATE POLICY "Users can read messages for accessible tickets"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = chat_messages.ticket_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Create proper UPDATE policy - users can only update their own messages
CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Create proper DELETE policy - users can only delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);