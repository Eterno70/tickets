import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { databaseService } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatRoom, FileAttachment, User } from '../types';
import { registrarAccionAuditoria } from '../lib/audit';

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>({});
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Suscribirse a cambios en tiempo real para mensajes de chat
  React.useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 ChatContext - Configurando escucha de eventos en tiempo real');

    const handleRealtimeMessage = (event: CustomEvent) => {
      const payload = event.detail;
      console.log('🔄 ChatContext - Evento de mensaje en tiempo real recibido:', payload);

      if (payload.eventType === 'INSERT') {
        const newMessage = {
          id: payload.new.id,
          ticketId: payload.new.ticket_id,
          senderId: payload.new.sender_id,
          content: payload.new.content,
          timestamp: new Date(payload.new.created_at),
          attachments: payload.new.attachments || [],
          isSystem: payload.new.is_system || false
        };

        // Solo actualizar si no es el remitente (para evitar duplicados)
        if (newMessage.senderId !== currentUser.id) {
          console.log('🔄 ChatContext - Actualizando mensajes con nuevo mensaje:', newMessage);
          
          setMessages(prev => {
            // Si ya tenemos mensajes para este ticket
            if (prev[newMessage.ticketId]) {
              // Verificar que el mensaje no esté ya en la lista (evitar duplicados)
              const messageExists = prev[newMessage.ticketId].some(msg => msg.id === newMessage.id);
              if (!messageExists) {
                return {
                  ...prev,
                  [newMessage.ticketId]: [...prev[newMessage.ticketId], newMessage]
                };
              }
            }
            return prev;
          });

          // Actualizar chatRoom con el último mensaje y contador de no leídos
          setChatRooms(prev => {
            const currentRoom = prev[newMessage.ticketId] || {
              ticketId: newMessage.ticketId, 
              participants: [currentUser.id], 
              unreadCount: {} 
            };

            const currentUnreadCount = currentRoom.unreadCount[currentUser.id] || 0;

            return {
              ...prev,
              [newMessage.ticketId]: {
                ...currentRoom,
                lastMessage: newMessage,
                unreadCount: {
                  ...currentRoom.unreadCount,
                  [currentUser.id]: currentUnreadCount + 1
                }
              }
            };
          });

          // Actualizar contador en la base de datos
          databaseService.incrementChatRoomUnreadCount(
            newMessage.ticketId,
            currentUser.id
          ).catch(err => 
            console.error('❌ Error incrementando contador en BD:', err)
          );

          // Reproducir sonido de notificación
          playMessageSound();
        }
        
        // Dispatch event to force update of notification count in UI
        const updateEvent = new CustomEvent('messageReceived');
        window.dispatchEvent(updateEvent);
      }
    };

    window.addEventListener('realtimeMessage', handleRealtimeMessage as EventListener);

    return () => {
      window.removeEventListener('realtimeMessage', handleRealtimeMessage as EventListener);
    };
  }, [currentUser]);

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null); 
      
      console.log('💬 Cargando mensajes para ticket:', ticketId);
      
      const messagesData = await databaseService.getChatMessages(ticketId);
      
      setMessages(prev => ({
        ...prev,
        [ticketId]: messagesData
      }));

      // Marcar mensajes como leídos al cargar
      if (currentUser) {
        await databaseService.updateChatRoomUnreadCount(ticketId, currentUser.id, 0);
        
        // Dispatch event to force update of unread count in UI
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }

      // Crear o actualizar chat room
      setChatRooms(prev => ({
        ...prev,
        [ticketId]: {
          ticketId,
          participants: prev[ticketId]?.participants || [currentUser?.id || ''],
          unreadCount: prev[ticketId]?.unreadCount || {},
          lastMessage: messagesData[messagesData.length - 1]
        }
      }));
      
      console.log('✅ Mensajes cargados:', messagesData.length);
    } catch (error: any) {
      console.error('❌ Error cargando mensajes:', error);
      setError('Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = useCallback(async (ticketId: string, content: string, attachments?: FileAttachment[]) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para enviar mensajes');
      return;
    }

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    try {
      setError(null);
      
      console.log('💬 Enviando mensaje:', { ticketId, content, attachments: attachments?.length || 0 });
      
      const newMessage = await databaseService.sendMessage(ticketId, currentUser.id, content, attachments);
      
      if (newMessage) {
        setMessages(prev => ({
          ...prev,
          [ticketId]: [...(prev[ticketId] || []), newMessage]
        }));
        
        setChatRooms(prev => ({
          ...prev,
          [ticketId]: {
            ...prev[ticketId],
            ticketId,
            participants: prev[ticketId]?.participants || [currentUser.id],
            unreadCount: prev[ticketId]?.unreadCount || {},
            lastMessage: newMessage
          }
        }));
        
        // Registrar acción de auditoría
        registrarAccionAuditoria({
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'mensaje',
          ticket_id: ticketId,
          message_id: newMessage.id,
          details: { contenido: content, attachments }
        });
        
        // Disparar evento para notificaciones
        const event = new CustomEvent('newMessage', { 
          detail: { 
            ticketId, 
            senderId: currentUser.id, 
            content,
            senderName: currentUser.name
          } 
        });
        window.dispatchEvent(event);
        
        console.log('✅ Mensaje enviado exitosamente');
      }
    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error);
      setError('Error al enviar mensaje');
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
      setChatRooms(prev => ({
        ...prev,
        [ticketId]: {
          ...prev[ticketId],
          unreadCount: {
            ...prev[ticketId]?.unreadCount,
            [userId]: 0
          }
        }
      }));
      
      // Dispatch event to force update of unread count in UI
      const updateEvent = new CustomEvent('messagesRead');
      window.dispatchEvent(updateEvent);
    } catch (error: any) {
      console.error('❌ Error marcando como leído:', error);
    }
  }, []);

  const getUnreadCount = useCallback((ticketId: string, userId: string) => {
    const room = chatRooms[ticketId];
    return room?.unreadCount[userId] || 0;
  }, [chatRooms]);

  const getTotalUnreadCount = useCallback((userId: string) => {
    return Object.values(chatRooms).reduce((total, room) => {
      return total + (room.unreadCount[userId] || 0);
    }, 0);
  }, [chatRooms]);

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

  return (
    <ChatContext.Provider value={{
      chatRooms,
      messages,
      loading,
      error,
      sendMessage,
      deleteMessage,
      markAsRead,
      getUnreadCount,
      getTotalUnreadCount,
      loadMessages,
      clearError,
      reloadUnreadCounts
    }}>
      {children}
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