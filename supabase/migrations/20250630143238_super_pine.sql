/*
  # Fix chat_room_unread table and constraints

  1. Changes
     - Ensure chat_room_unread table has proper foreign key constraints
     - Fix the room_id reference to use ticket_id instead
     - This allows direct reference to tickets without needing chat_rooms table
     
  This migration addresses issues with chat_room_unread foreign key constraints
  by making it reference tickets directly instead of chat_rooms.
*/

-- First check if the chat_room_unread table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_room_unread') THEN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'chat_room_unread_room_id_fkey' 
      AND conrelid = 'chat_room_unread'::regclass
    ) THEN
      -- Drop the existing constraint
      ALTER TABLE public.chat_room_unread 
      DROP CONSTRAINT chat_room_unread_room_id_fkey;
    END IF;
    
    -- Add the correct constraint pointing to tickets table
    ALTER TABLE public.chat_room_unread 
    ADD CONSTRAINT chat_room_unread_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint updated for chat_room_unread table';
  ELSE
    RAISE NOTICE 'chat_room_unread table does not exist, no changes needed';
  END IF;
END $$;

-- Permitir a admins y técnicos leer mensajes del canal privado
CREATE POLICY "Admins y técnicos pueden leer chat privado"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id = 'private-admin-tech'
    AND (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND (u.role = 'admin' OR u.role = 'technician')
      )
    )
  );

-- Permitir a admins y técnicos insertar mensajes en el canal privado
CREATE POLICY "Admins y técnicos pueden escribir en chat privado"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id = 'private-admin-tech'
    AND (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND (u.role = 'admin' OR u.role = 'technician')
      )
    )
  );