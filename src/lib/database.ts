import { supabase } from './supabase';
import type { User, Ticket, ChatMessage, AppNotification, FileAttachment } from '../types';

// Interfaz para los contadores de mensajes no leídos
interface ChatRoomUnreadCount {
  roomId: string;
  userId: string;
  unreadCount: number;
}

export const databaseService = {
  // === CONEXIÓN ===
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  },

  // === USUARIOS ===
  async getUsers(): Promise<User[]> {
    try {
      console.log('👥 Obteniendo usuarios de Supabase...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        throw error;
      }

      const users = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        department: u.department,
        isOnline: u.is_online || false,
        lastSeen: new Date(u.last_seen)
      }));

      console.log('✅ Usuarios obtenidos:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Error en getUsers:', error);
      throw error;
    }
  },

  async createUser(userData: Omit<User, 'id' | 'isOnline' | 'lastSeen'> & { password?: string }): Promise<User | null> {
    try {
      console.log('👤 Creando usuario en Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
          department: userData.department,
          password_hash: userData.password || 'temp_hash',
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando usuario:', error);
        throw error;
      }

      const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        department: data.department,
        isOnline: data.is_online,
        lastSeen: new Date(data.last_seen)
      };

      console.log('✅ Usuario creado:', newUser.name);
      return newUser;
    } catch (error) {
      console.error('❌ Error en createUser:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      console.log('👤 Actualizando usuario en Supabase...');
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.role) updateData.role = updates.role;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.isOnline !== undefined) updateData.is_online = updates.isOnline;
      if (updates.lastSeen) updateData.last_seen = updates.lastSeen.toISOString();

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando usuario:', error);
        throw error;
      }

      console.log('✅ Usuario actualizado');
      return true;
    } catch (error) {
      console.error('❌ Error en updateUser:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log('👤 Eliminando usuario de Supabase...');
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando usuario:', error);
        throw error;
      }

      console.log('✅ Usuario eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteUser:', error);
      throw error;
    }
  },

  // === TICKETS ===
  async getTickets(): Promise<Ticket[]> {
    try {
      console.log('🎫 Obteniendo tickets de Supabase...');
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo tickets:', error);
        throw error;
      }

      const tickets = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdBy: t.created_by,
        assignedTo: t.assigned_to,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
        tags: t.tags || [],
        attachments: t.attachments || [] // Fallback si no existe la columna
      }));

      console.log('✅ Tickets obtenidos:', tickets.length);
      return tickets;
    } catch (error) {
      console.error('❌ Error en getTickets:', error);
      throw error;
    }
  },

  async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket | null> {
    try {
      console.log('🎫 Creando ticket en Supabase...');
      console.log('Datos del ticket:', ticketData);
      
      // Preparar datos sin attachments por ahora (columna faltante en BD)
      const insertData: any = {
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        category: ticketData.category,
        created_by: ticketData.createdBy,
        assigned_to: ticketData.assignedTo,
        tags: ticketData.tags
      };

      // Incluir attachments
      insertData.attachments = ticketData.attachments || [];

      const { data, error } = await supabase
        .from('tickets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando ticket:', error);
        console.error('Detalles del error:', error.message, error.details);
        throw error;
      }

      const newTicket: Ticket = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        createdBy: data.created_by,
        assignedTo: data.assigned_to,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tags: data.tags || [],
        attachments: data.attachments || [] // Fallback si no existe la columna
      };

      console.log('✅ Ticket creado:', newTicket.title);
      return newTicket;
    } catch (error) {
      console.error('❌ Error en createTicket:', error);
      throw error;
    }
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<boolean> {
    try {
      console.log('🎫 Actualizando ticket en Supabase...');
      
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.category) updateData.category = updates.category;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.tags) updateData.tags = updates.tags;
      
      // Solo actualizar attachments si la columna existe
      if (updates.attachments) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('tickets')
            .select('attachments')
            .limit(1);
          
          if (!testError) {
            updateData.attachments = updates.attachments;
          }
        } catch (e) {
          console.log('⚠️ Columna attachments no existe, omitiendo actualización...');
        }
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando ticket:', error);
        throw error;
      }

      console.log('✅ Ticket actualizado');
      return true;
    } catch (error) {
      console.error('❌ Error en updateTicket:', error);
      throw error;
    }
  },

  async deleteTicket(id: string): Promise<boolean> {
    try {
      console.log('🎫 Eliminando ticket de Supabase...');
      
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando ticket:', error);
        throw error;
      }

      console.log('✅ Ticket eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteTicket:', error);
      throw error;
    }
  },

  // === MENSAJES DE CHAT ===
  async getChatMessages(ticketId: string): Promise<ChatMessage[]> {
    try {
      console.log('💬 Obteniendo mensajes de Supabase...');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        throw error;
      }

      const messages = data.map((msg: any) => ({
        id: msg.id,
        ticketId: msg.ticket_id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        attachments: msg.attachments || [],
        isSystem: msg.is_system || false
      }));

      console.log('✅ Mensajes obtenidos:', messages.length);
      return messages;
    } catch (error) {
      console.error('❌ Error en getChatMessages:', error);
      throw error;
    }
  },

  async sendMessage(ticketId: string, senderId: string, content: string, attachments?: FileAttachment[]): Promise<ChatMessage | null> {
    try {
      console.log('💬 Enviando mensaje a Supabase...');
      
      // Preparar datos del mensaje
      const insertData: any = {
        ticket_id: ticketId,
        sender_id: senderId,
        content: content,
        is_system: false
      };

      // Solo incluir attachments si la columna existe
      try {
        const { data: testData, error: testError } = await supabase
          .from('chat_messages')
          .select('attachments')
          .limit(1);
        
        if (!testError) {
          insertData.attachments = attachments || [];
        }
      } catch (e) {
        console.log('⚠️ Columna attachments no existe en chat_messages, omitiendo...');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error enviando mensaje:', error);
        throw error;
      }

      const newMessage: ChatMessage = {
        id: data.id,
        ticketId: data.ticket_id,
        senderId: data.sender_id,
        content: data.content,
        timestamp: new Date(data.created_at),
        attachments: data.attachments || [],
        isSystem: data.is_system || false
      };

      console.log('✅ Mensaje enviado');
      return newMessage;
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      throw error;
    }
  },

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      console.log('💬 Eliminando mensaje de Supabase...');
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('❌ Error eliminando mensaje:', error);
        throw error;
      }

      console.log('✅ Mensaje eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteMessage:', error);
      throw error;
    }
  },
  
  // === CHAT ROOM UNREAD COUNTS ===
  async getChatRoomUnreadCounts(userId: string): Promise<Record<string, number>> {
    try {
      console.log('📊 Obteniendo contadores de mensajes no leídos para usuario:', userId);
      
      const { data, error } = await supabase
        .from('chat_room_unread')
        .select('room_id, unread_count')
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Error obteniendo contadores de no leídos:', error);
        return {};
      }
      
      // Convertir a un objeto {roomId: unreadCount}
      const unreadCounts: Record<string, number> = {};
      data.forEach((item: any) => {
        unreadCounts[item.room_id] = item.unread_count;
      });
      
      console.log('✅ Contadores de no leídos obtenidos:', Object.keys(unreadCounts).length);
      return unreadCounts;
    } catch (error) {
      console.error('❌ Error en getChatRoomUnreadCounts:', error);
      return {};
    }
  },
  
  async updateChatRoomUnreadCount(roomId: string, userId: string, count: number): Promise<boolean> {
    try {
      console.log('📊 Actualizando contador de no leídos:', { roomId, userId, count });
      
      // Primero verificamos si ya existe un registro
      const { data: existingData, error: checkError } = await supabase
        .from('chat_room_unread')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .limit(1);
      
      if (checkError) {
        console.error('❌ Error verificando contador existente:', checkError);
        return false;
      }
      
      if (existingData && existingData.length > 0) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('chat_room_unread')
          .update({ unread_count: count, updated_at: new Date().toISOString() })
          .eq('id', existingData[0].id);
        
        if (updateError) {
          console.error('❌ Error actualizando contador:', updateError);
          return false;
        }
      } else {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from('chat_room_unread')
          .insert({
            room_id: roomId,
            user_id: userId,
            unread_count: count
          });
        
        if (insertError) {
          console.error('❌ Error creando contador:', insertError);
          return false;
        }
      }
      
      console.log('✅ Contador actualizado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en updateChatRoomUnreadCount:', error);
      return false;
    }
  },
  
  async incrementChatRoomUnreadCount(roomId: string, userId: string): Promise<boolean> {
    try {
      console.log('📊 Incrementando contador de no leídos:', { roomId, userId });
      
      // Asegurarse de que el chat room existe primero
      const { data: roomExists, error: roomCheckError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('ticket_id', roomId)
        .limit(1);
      
      // Si no existe el chat room, crearlo primero
      if ((!roomExists || roomExists.length === 0) && !roomCheckError) {
        console.log('📊 Chat room no existe, creando uno nuevo para ticket:', roomId);
        const { error: createRoomError } = await supabase
          .from('chat_rooms')
          .insert({
            ticket_id: roomId,
            participants: [userId]
          });
          
        if (createRoomError) {
          console.error('❌ Error creando chat room:', createRoomError);
          // Intentar usar directamente el ticket_id como room_id
        }
      }
      
      // Primero verificamos si ya existe un registro
      const { data: existingData, error: checkError } = await supabase
        .from('chat_room_unread')
        .select('id, unread_count')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .limit(1);
      
      if (checkError) {
        console.error('❌ Error verificando contador existente:', checkError);
        return false;
      }
      
      if (existingData && existingData.length > 0) {
        // Actualizar incrementando el contador
        const newCount = (existingData[0].unread_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('chat_room_unread')
          .update({ 
            unread_count: newCount, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingData[0].id);
        
        if (updateError) {
          console.error('❌ Error incrementando contador:', updateError);
          return false;
        }
      } else {
        // Crear nuevo registro con contador en 1
        const { error: insertError } = await supabase
          .from('chat_room_unread')
          .insert({
            room_id: roomId,
            user_id: userId,
            unread_count: 1
          });
        
        if (insertError) {
          console.error('❌ Error creando contador:', insertError);
          return false;
        }
      }
      
      console.log('✅ Contador incrementado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en incrementChatRoomUnreadCount:', error);
      return false;
    }
  },

  // === NOTIFICACIONES ===
  async getNotifications(userId: string): Promise<AppNotification[]> {
    try {
      console.log('🔔 Obteniendo notificaciones de Supabase...');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo notificaciones:', error);
        throw error;
      }

      const notifications = data.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        ticketId: n.ticket_id,
        userId: n.user_id,
        isRead: n.is_read,
        createdAt: new Date(n.created_at)
      }));

      console.log('✅ Notificaciones obtenidas:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ Error en getNotifications:', error);
      throw error;
    }
  },

  async createNotification(notificationData: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<boolean> {
    try {
      console.log('🔔 Creando notificación en Supabase...');
      console.log('🔔 Datos:', notificationData);
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          ticket_id: notificationData.ticketId,
          user_id: notificationData.userId,
          is_read: false
        });

      if (error) {
        console.error('❌ Error creando notificación:', error);
        console.error('Detalles del error:', error.message, error.details);
        throw error;
      }

      console.log('✅ Notificación creada');
      return true;
    } catch (error) {
      console.error('❌ Error en createNotification:', error instanceof Error ? error.message : error);
      throw error;
    }
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      console.log('🔔 Marcando notificación como leída...');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('❌ Error marcando notificación:', error);
        throw error;
      }

      console.log('✅ Notificación marcada como leída');
      return true;
    } catch (error) {
      console.error('❌ Error en markNotificationAsRead:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      console.log('🔔 Marcando todas las notificaciones como leídas...');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marcando notificaciones:', error);
        throw error;
      }

      console.log('✅ Todas las notificaciones marcadas como leídas');
      return true;
    } catch (error) {
      console.error('❌ Error en markAllNotificationsAsRead:', error);
      throw error;
    }
  }
};