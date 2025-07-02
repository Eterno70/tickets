import { supabase } from './supabase';

export async function registrarAccionAuditoria({
  user_id,
  user_name,
  action_type,
  ticket_id = null,
  message_id = null,
  details = {}
}: {
  user_id: string;
  user_name: string;
  action_type: string;
  ticket_id?: string | null;
  message_id?: string | null;
  details?: any;
}) {
  const { error } = await supabase.from('audit_logs').insert([
    {
      user_id,
      user_name,
      action_type,
      ticket_id,
      message_id,
      details
    }
  ]);
  if (error) {
    console.error('Error registrando acción de auditoría:', error.message);
  }
} 