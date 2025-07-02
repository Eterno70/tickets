/*
  # Add RLS policies for chat_room_unread table
  
  1. Security Updates
    - Enable Row Level Security for chat_room_unread table
    - Create proper RLS policies for chat_room_unread table
    - Allow authenticated users to manage their own unread counts
    
  2. Policy Details
    - INSERT: Users can only insert records for themselves
    - SELECT: Users can only read their own unread counts
    - UPDATE: Users can only update their own unread counts
    - DELETE: Users can only delete their own unread counts
*/

-- Enable Row Level Security for chat_room_unread table
ALTER TABLE chat_room_unread ENABLE ROW LEVEL SECURITY;

-- Create proper INSERT policy
CREATE POLICY "Users can insert their own unread counts"
  ON chat_room_unread
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create proper SELECT policy
CREATE POLICY "Users can read their own unread counts"
  ON chat_room_unread
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create proper UPDATE policy
CREATE POLICY "Users can update their own unread counts"
  ON chat_room_unread
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create proper DELETE policy
CREATE POLICY "Users can delete their own unread counts"
  ON chat_room_unread
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);