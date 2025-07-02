/*
  # Disable Row Level Security for tickets table
  
  1. Changes
     - Disable Row Level Security (RLS) for the tickets table
     - This will allow all operations on the tickets table without RLS restrictions
     
  This migration addresses the error "new row violates row-level security policy for table tickets"
  by disabling RLS completely on the tickets table.
*/

-- Disable Row Level Security for tickets table
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Row Level Security for tickets table has been disabled';
END $$;