import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

console.log('🔧 Configurando Supabase:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Habilitar canales de tiempo real para las tablas principales
export const initializeRealtimeSubscriptions = () => {
  console.log('🔄 Inicializando suscripciones en tiempo real...');
  
  // Canal para mensajes de chat
  supabase.channel('chat-messages-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'chat_messages'
    }, payload => {
      console.log('🔄 Cambio en tiempo real (chat_messages):', payload);
      const event = new CustomEvent('realtimeMessage', { detail: payload });
      window.dispatchEvent(event);
      
      // Also dispatch a generic event for UI updates
      const updateEvent = new CustomEvent('messageReceived');
      window.dispatchEvent(updateEvent);
    })
    .subscribe((status) => {
      console.log('🔄 Estado de suscripción (chat_messages):', status);
    });
    
  // Canal para notificaciones
  supabase.channel('notifications-changes')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public',
      table: 'notifications'
    }, payload => {
      console.log('🔄 Cambio en tiempo real (notifications):', payload);
      const event = new CustomEvent('realtimeNotification', { detail: payload });
      window.dispatchEvent(event);
      
      // Also dispatch a generic event for UI updates
      const updateEvent = new CustomEvent('notificationReceived');
      window.dispatchEvent(updateEvent);
    })
    .subscribe((status) => {
      console.log('🔄 Estado de suscripción (notifications):', status.state);
    });
    
  // Canal para tickets
  supabase.channel('tickets-changes')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public',
      table: 'tickets'
    }, payload => {
      console.log('🔄 Cambio en tiempo real (tickets):', payload);
      const event = new CustomEvent('realtimeTicket', { detail: payload });
      window.dispatchEvent(event);
      
      // Also dispatch a generic event for UI updates
      const updateEvent = new CustomEvent('ticketUpdated');
      window.dispatchEvent(updateEvent);
      
      // Dispatch a custom event for ticket creation specifically
      if (payload.eventType === 'INSERT') {
        console.log('🔔 Nuevo ticket creado en tiempo real, disparando evento personalizado');
        const ticketEvent = new CustomEvent('ticketCreated', { 
          detail: { 
            ticket: {
              id: payload.new.id,
              title: payload.new.title,
              createdByName: 'Usuario', // Nombre genérico, se actualizará después
              createdBy: payload.new.created_by
            } 
          } 
        });
        window.dispatchEvent(ticketEvent);
      }
    })
    .subscribe((status) => {
      console.log('🔄 Estado de suscripción (tickets):', status.state);
    });
    
  // Canal para contadores de no leídos
  supabase.channel('unread-counts-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'chat_room_unread'
    }, payload => {
      console.log('🔄 Cambio en tiempo real (chat_room_unread):', payload);
      const updateEvent = new CustomEvent('unreadCountsUpdated', { detail: payload });
      window.dispatchEvent(updateEvent);
    })
    .subscribe((status) => {
      console.log('🔄 Estado de suscripción (unread-counts):', status);
    });
    
  console.log('✅ Suscripciones en tiempo real inicializadas correctamente');
};

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Error de conexión a Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error inesperado conectando a Supabase:', error);
    return false;
  }
};

export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('❌ Error verificando salud de conexión:', error);
    return false;
  }
};