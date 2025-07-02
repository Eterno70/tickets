/*
  # Fix chat_room_unread foreign key constraints

  1. Changes
     - Safely handle the foreign key constraint for chat_room_unread table
     - First check if the constraint exists before dropping it
     - Create chat_rooms table if it doesn't exist
     - Add proper foreign key constraints that match the application's data model
     
  This migration addresses the error with chat_room_unread foreign key constraints
  by ensuring the referenced tables exist and handling the constraints properly.
*/

-- First check if the chat_rooms table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_rooms') THEN
    CREATE TABLE public.chat_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      participants UUID[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Create index on ticket_id
    CREATE INDEX idx_chat_rooms_ticket_id ON public.chat_rooms(ticket_id);
    
    -- Create unique constraint on ticket_id
    ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_ticket_id_key UNIQUE (ticket_id);
    
    -- Add updated_at trigger
    CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
    -- Enable RLS
    ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
    
    -- Add basic policies
    CREATE POLICY "enable_read_chat_rooms" ON public.chat_rooms
      FOR SELECT TO authenticated USING (true);
      
    CREATE POLICY "enable_insert_chat_rooms" ON public.chat_rooms
      FOR INSERT TO authenticated WITH CHECK (true);
      
    CREATE POLICY "enable_update_chat_rooms" ON public.chat_rooms
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
      
    CREATE POLICY "enable_delete_chat_rooms" ON public.chat_rooms
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Now handle the chat_room_unread table constraints
DO $$
BEGIN
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
  
  -- Add the correct constraint pointing to chat_rooms table
  ALTER TABLE public.chat_room_unread 
  ADD CONSTRAINT chat_room_unread_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
END $$;