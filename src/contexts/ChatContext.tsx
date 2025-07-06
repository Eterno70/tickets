import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { databaseService } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatRoom, FileAttachment, User } from '../types';
import { registrarAccionAuditoria } from '../lib/audit';
import Toast from '../components/Notifications/Toast';

interface ChatContextType {
  chatRooms: Record<string, ChatRoom>;
  messages: Record<string, ChatMessage[]>;
  loading: boolean;
  error: string | null;
  sendMessage: (ticketId: string, content: string, attachments?: FileAttachment[]) => Promise<void>;
  deleteMessage: (ticketId: string, messageId: string) => Promise<void>;
  markAsRead: (ticketId: string, userId: string) => Promise<void>;
  getUnreadCount: (ticketId: string, userId: string) => number;
  getTotalUnreadCount: (userId: string) => number;
  loadMessages: (ticketId: string) => Promise<void>;
  clearError: () => void;
  reloadUnreadCounts: () => Promise<void>;
  playMessageSound: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>({});
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ sender: string; message: string } | null>(null);

  // Función para reproducir sonido de mensaje
  const playMessageSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('🔊 No se pudo reproducir sonido de mensaje');
    }
  }, []);

  // Función para recargar los contadores de mensajes no leídos desde el backend
  const reloadUnreadCounts = useCallback(async () => {
    if (!currentUser) return;
    try {
      console.log('🔄 ChatContext - Recargando contadores de mensajes no leídos...');
      const unreadCounts = await databaseService.getChatRoomUnreadCounts(currentUser.id);
      setChatRooms(prev => {
        const updatedRooms = { ...prev };
        Object.entries(unreadCounts).forEach(([roomId, count]) => {
          if (updatedRooms[roomId]) {
            updatedRooms[roomId] = {
              ...updatedRooms[roomId],
              unreadCount: {
                ...updatedRooms[roomId].unreadCount,
                [currentUser.id]: count
              }
            };
          } else {
            updatedRooms[roomId] = {
              ticketId: roomId,
              participants: [currentUser.id],
              unreadCount: { [currentUser.id]: count }
            };
          }
        });
        return updatedRooms;
      });
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } catch (error) {
      console.error('❌ ChatContext - Error recargando contadores:', error);
    }
  }, [currentUser]);

  // Cargar contadores de mensajes no leídos al iniciar
  useEffect(() => {
    if (!currentUser) return;
    
    const loadUnreadCounts = async () => {
      try {
        console.log('🔄 ChatContext - Cargando contadores de mensajes no leídos...');
        const unreadCounts = await databaseService.getChatRoomUnreadCounts(currentUser.id);
        
        // Actualizar chatRooms con los contadores obtenidos
        setChatRooms(prev => {
          const updatedRooms = { ...prev };
          
          // Para cada roomId con contador, actualizar o crear la entrada
          Object.entries(unreadCounts).forEach(([roomId, count]) => {
            if (updatedRooms[roomId]) {
              // Actualizar room existente
              updatedRooms[roomId] = {
                ...updatedRooms[roomId],
                unreadCount: {
                  ...updatedRooms[roomId].unreadCount,
                  [currentUser.id]: count
                }
              };
            } else {
              // Crear nueva entrada para este room
              updatedRooms[roomId] = {
                ticketId: roomId,
                participants: [currentUser.id],
                unreadCount: { [currentUser.id]: count }
              };
            }
          });
          
          return updatedRooms;
        });
        
        console.log('✅ ChatContext - Contadores de no leídos cargados');
      } catch (error) {
        console.error('❌ ChatContext - Error cargando contadores:', error);
      }
    };
    
    loadUnreadCounts();
  }, [currentUser]);

  // Suscripción global a mensajes en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 ChatContext - Suscripción global a mensajes en tiempo real');

    let retries = 0;
    function subscribe() {
      console.log('[ChatContext] Suscribiéndose a canal global-chat-messages...');
      const subscription = supabase
        .channel('global-chat-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, payload => {
          console.log('[ChatContext] Evento recibido de Supabase:', payload);
          // Solo reproducir sonido si el mensaje no es del usuario actual
          if (payload.new.sender_id !== currentUser.id) {
            playMessageSound();
            setToast({
              sender: payload.new.sender_name || 'Alguien',
              message: payload.new.content.length > 50 ? payload.new.content.substring(0, 50) + '...' : payload.new.content
            });
            // Notificación del navegador solo si la pestaña está en segundo plano
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(
                payload.new.sender_name || 'Nuevo mensaje',
                {
                  body: payload.new.content.length > 50 ? payload.new.content.substring(0, 50) + '...' : payload.new.content,
                  icon: '/logo-alcaldia.png',
                  tag: payload.new.ticket_id
                }
              );
              setTimeout(() => notification.close(), 5000);
              notification.onclick = () => {
                window.focus();
                window.dispatchEvent(new CustomEvent('navigateToChat', { detail: { ticketId: payload.new.ticket_id } }));
                notification.close();
              };
            }
            // Abrir automáticamente el chat correspondiente
            window.dispatchEvent(new CustomEvent('navigateToChat', { detail: { ticketId: payload.new.ticket_id } }));
            // Incrementar el contador de no leídos para todos los participantes excepto el remitente, para cualquier chat
            setChatRooms(prev => {
              const updatedRooms = { ...prev };
              const room = updatedRooms[payload.new.ticket_id];
              if (room && room.participants) {
                room.participants.forEach(uid => {
                  if (uid !== payload.new.sender_id) {
                    room.unreadCount[uid] = (room.unreadCount[uid] || 0) + 1;
                  }
                });
              }
              return updatedRooms;
            });
            window.dispatchEvent(new CustomEvent('messageReceived'));
          }
          // Actualizar el contador de no leídos
          reloadUnreadCounts();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[ChatContext] Suscripción a Supabase exitosa.');
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('[ChatContext] Error de suscripción a Supabase, reintentando...', status);
            if (retries < 3) {
              retries++;
              setTimeout(subscribe, 1000 * retries);
            }
          }
        });
      return subscription;
    }
    const sub = subscribe();
    return () => {
      sub.unsubscribe && sub.unsubscribe();
    };
  }, [currentUser, playMessageSound, reloadUnreadCounts]);

  // Función para asegurar el ticket especial del chat privado
  const PRIVATE_CHAT_ID = '00000000-0000-0000-0000-000000000999';
  const ensurePrivateChatTicket = useCallback(async () => {
    // Buscar el ticket especial
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', PRIVATE_CHAT_ID)
      .single();
    if (error || !data) {
      // Crear el ticket especial si no existe
      await supabase.from('tickets').insert({
        id: PRIVATE_CHAT_ID,
        title: 'Chat Privado (Administradores y Técnicos)',
        description: 'Canal privado para comunicación interna del personal técnico y administradores.',
        status: 'open',
        priority: 'low',
        category: 'privado',
        created_by: currentUser?.id || null,
        assigned_to: currentUser?.id || null,
        tags: ['privado'],
        attachments: []
      });
    }
  }, [currentUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null); 
      let participants: string[] = [];
      if (ticketId === PRIVATE_CHAT_ID) {
        await ensurePrivateChatTicket();
        const allUsers = await databaseService.getUsers();
        participants = allUsers.filter(u => u.role === 'admin' || u.role === 'technician').map(u => u.id);
        await databaseService.createOrUpdateChatRoom(ticketId, participants);
      } else {
        // Para otros tickets, incluir creador y asignado
        const ticket = await databaseService.getTicketById(ticketId);
        if (ticket) {
          participants = [ticket.created_by, ticket.assigned_to].filter(Boolean);
        }
      }
      console.log('[ChatContext] Inicializando participantes para ticket', ticketId, participants);
      const messagesData = await databaseService.getChatMessages(ticketId);
      setMessages(prev => ({
        ...prev,
        [ticketId]: messagesData
      }));
      setChatRooms(prev => {
        const updated = {
          ...prev,
          [ticketId]: {
            ticketId,
            participants: participants.length ? participants : prev[ticketId]?.participants || [currentUser?.id || ''],
            unreadCount: prev[ticketId]?.unreadCount || {},
            lastMessage: messagesData[messagesData.length - 1]
          }
        };
        console.log('[ChatContext] Inicialización/actualización de chatRooms en loadMessages:', updated);
        return updated;
      });
      console.log('✅ Mensajes cargados:', messagesData.length);
    } catch (error: any) {
      console.error('❌ Error cargando mensajes:', error);
      setError('Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = useCallback(async (ticketId: string, content: string, attachments?: FileAttachment[]) => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      if (ticketId === PRIVATE_CHAT_ID) {
        await ensurePrivateChatTicket();
      }
      const newMessage = await databaseService.sendMessage(ticketId, currentUser.id, content, attachments);
      if (newMessage) {
        setMessages(prev => ({
          ...prev,
          [ticketId]: [...(prev[ticketId] || []), newMessage]
        }));
        // Notificación especial para canal privado
        if (ticketId === PRIVATE_CHAT_ID) {
          // Obtener todos los usuarios admin y técnicos
          const allUsers = await databaseService.getUsers();
          const notifyUsers = allUsers.filter(u => (u.role === 'admin' || u.role === 'technician') && u.id !== currentUser.id);
          for (const user of notifyUsers) {
            await databaseService.createNotification({
              type: 'new-message',
              title: 'Nuevo mensaje en Chat Privado',
              message: `${currentUser.name}: ${content}`,
              ticketId: ticketId,
              userId: user.id
            });
          }
        }
      }
    } catch (error) {
      setError('Error enviando mensaje');
      console.error('❌ Error en sendMessage:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteMessage = useCallback(async (ticketId: string, messageId: string) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para eliminar mensajes');
      return;
    }

    try {
      setError(null);
      console.log('💬 Eliminando mensaje:', messageId);
      
      const success = await databaseService.deleteMessage(messageId);
      
      if (success) {
        setMessages(prev => ({
          ...prev,
          [ticketId]: prev[ticketId]?.filter(msg => msg.id !== messageId) || []
        }));
        
        console.log('✅ Mensaje eliminado');
      }
    } catch (error: any) {
      console.error('❌ Error eliminando mensaje:', error);
      setError('Error al eliminar mensaje');
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (ticketId: string, userId: string) => {
    try {
      // Actualizar contador en la base de datos
      await databaseService.updateChatRoomUnreadCount(ticketId, userId, 0);
      
      // Actualizar estado local
      setChatRooms(prev => {
        const updated = {
          ...prev,
          [ticketId]: {
            ...prev[ticketId],
            unreadCount: {
              ...prev[ticketId]?.unreadCount,
              [userId]: 0
            }
          }
        };
        console.log(`[ChatContext] markAsRead: contador puesto en 0 para ticketId=${ticketId}, userId=${userId}`, updated);
        return updated;
      });
      
      // Dispatch event to force update of unread count in UI
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } catch (error: any) {
      console.error('❌ Error marcando como leído:', error);
    }
  }, []);

  const getUnreadCount = useCallback((ticketId: string, userId: string) => {
    const room = chatRooms[ticketId];
    const count = room?.unreadCount[userId] || 0;
    console.log(`[ChatContext] getUnreadCount para ticketId=${ticketId}, userId=${userId}:`, count, room);
    return count;
  }, [chatRooms]);

  const getTotalUnreadCount = useCallback((userId: string) => {
    return Object.values(chatRooms).reduce((total, room) => {
      return total + (room.unreadCount[userId] || 0);
    }, 0);
  }, [chatRooms]);

  return (
    <ChatContext.Provider value={{
      chatRooms,
      messages,
      setMessages, // Exponer setMessages
      loading,
      error,
      sendMessage,
      deleteMessage,
      markAsRead,
      getUnreadCount,
      getTotalUnreadCount,
      loadMessages,
      clearError,
      reloadUnreadCounts,
      playMessageSound
    }}>
      {children}
      {toast && (
        <Toast
          sender={toast.sender}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}