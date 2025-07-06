import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { databaseService } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { AppNotification } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  loading: boolean;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => number;
  getNotificationsByUser: (userId: string) => AppNotification[];
  removeNotification: (id: string) => void; // <-- Agregado
  removeAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Suscribirse a cambios en tiempo real para notificaciones
  React.useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 NotificationContext - Configurando escucha de eventos en tiempo real');

    const handleRealtimeNotification = (event: CustomEvent) => {
      const payload = event.detail;
      console.log('🔄 NotificationContext - Evento de notificación en tiempo real recibido:', payload);

      if (payload.eventType === 'INSERT' && payload.new.user_id === currentUser.id) {
        const newNotification: AppNotification = {
          id: payload.new.id,
          type: payload.new.type,
          title: payload.new.title,
          message: payload.new.message,
          ticketId: payload.new.ticket_id,
          userId: payload.new.user_id,
          isRead: payload.new.is_read,
          createdAt: new Date(payload.new.created_at)
        };

        console.log('🔄 NotificationContext - Agregando nueva notificación:', newNotification);
        
        setNotifications(prev => [newNotification, ...prev]);
        playNotificationSound();
        showBrowserNotification(newNotification);
      }
    };

    window.addEventListener('realtimeNotification', handleRealtimeNotification as EventListener);

    return () => {
      window.removeEventListener('realtimeNotification', handleRealtimeNotification as EventListener);
    };
  }, [currentUser]);

  // Cargar notificaciones iniciales
  const loadNotifications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔔 Cargando notificaciones...');
      
      const notificationsData = await databaseService.getNotifications(currentUser.id);
      setNotifications(notificationsData);
      
      console.log('✅ Notificaciones cargadas:', notificationsData.length);
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  // Función para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('🔊 No se pudo reproducir sonido de notificación');
    }
  }, []);

  // Función para mostrar notificación del navegador
  const showBrowserNotification = useCallback((notification: AppNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/vite.svg',
          tag: notification.ticketId,
          requireInteraction: false,
          silent: false
        });

        setTimeout(() => {
          browserNotification.close();
        }, 5000);

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          
          const event = new CustomEvent('navigateToTicket', { 
            detail: { ticketId: notification.ticketId } 
          });
          window.dispatchEvent(event);
        };
      } catch (error) {
        console.log('🔔 No se pudo mostrar notificación del navegador');
      }
    }

    // Hacer parpadear el título de la página
    if (document.hidden) {
      const originalTitle = document.title;
      let isBlinking = true;
      
      const blinkInterval = setInterval(() => {
        document.title = isBlinking ? '🔔 Nueva notificación!' : originalTitle;
        isBlinking = !isBlinking;
      }, 1000);

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          clearInterval(blinkInterval);
          document.title = originalTitle;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      setTimeout(() => {
        clearInterval(blinkInterval);
        document.title = originalTitle;
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, 10000);
    }
  }, []);

  const addNotification = useCallback(async (notificationData: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      // Evitar notificaciones para tickets eliminados
      if (
        notificationData.type === 'ticket-updated' &&
        notificationData.message &&
        notificationData.message.toLowerCase().includes('ha sido eliminado')
      ) {
        console.log('⛔ No se crea notificación para ticket eliminado');
        return;
      }
      console.log('🔔 Creando notificación:', notificationData.title);
      console.log('🔔 Detalles:', notificationData);
      
      const success = await databaseService.createNotification(notificationData);
      
      if (success) {
        const newNotification: AppNotification = {
          ...notificationData,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          isRead: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        playNotificationSound();
        showBrowserNotification(newNotification);
        
        // Dispatch event to force update of notification count in UI
        window.dispatchEvent(new CustomEvent('notificationReceived'));
        
        console.log('✅ Notificación creada');
      } else {
        console.log('❌ Error al crear notificación en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
    }
  }, [playNotificationSound, showBrowserNotification]);

  // Escuchar eventos personalizados de otros contextos
  useEffect(() => {
    const handleTicketCreated = (event: CustomEvent) => {
      console.log('🔔 NotificationContext - Evento ticketCreated recibido:', event.detail);
      const { ticket } = event.detail;
      
      // Solo notificar a administradores y técnicos cuando se crea un ticket
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'technician')) {
        console.log('🔔 NotificationContext - Creando notificación para:', currentUser.name, currentUser.role);
        addNotification({
          type: 'ticket-created',
          title: 'Nuevo ticket creado',
          message: `${ticket.createdByName || 'Un usuario'} creó: ${ticket.title}`,
          ticketId: ticket.id,
          userId: currentUser.id
        });
      } else {
        console.log('🔔 NotificationContext - Usuario no es admin/técnico, no se crea notificación');
      }
    };

    const handleTicketAssigned = (event: CustomEvent) => {
      const { ticketId, assignedTo, ticketTitle } = event.detail;
      
      if (currentUser?.id === assignedTo) {
        addNotification({
          type: 'ticket-assigned',
          title: 'Ticket asignado',
          message: `Se te ha asignado el ticket: ${ticketTitle}`,
          ticketId,
          userId: assignedTo
        });
      }
    };

    const handleNewMessage = (event: CustomEvent) => {
      const { ticketId, senderId, content, senderName } = event.detail;
      // Solo notificar si no es el remitente del mensaje
      if (currentUser && currentUser.id !== senderId) {
          addNotification({
          type: 'new-message',
          title: 'Nuevo mensaje',
          message: `${senderName || 'Alguien'}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
          ticketId,
          userId: currentUser?.id || ''
        });
    }
};
    const handleTicketDeleted = (event: CustomEvent) => {
      const { ticketId } = event.detail;
      
      if (currentUser?.role === 'admin') {
        addNotification({
          type: 'ticket-updated',
          title: 'Ticket eliminado',
          message: `El ticket #${ticketId.slice(0, 6)} ha sido eliminado`,
          ticketId,
          userId: currentUser.id
        });
      }
    };

    const handleTicketStatusChanged = (event: CustomEvent) => {
      const { ticketId, newStatus, ticketTitle, changedBy } = event.detail;
      
      if (currentUser && currentUser.id !== changedBy) {
        const statusLabels = {
          'open': 'abierto',
          'in-progress': 'en progreso',
          'resolved': 'resuelto',
          'closed': 'cerrado'
        };
        
        addNotification({
          type: 'ticket-updated',
          title: 'Estado de ticket actualizado',
          message: `"${ticketTitle}" cambió a ${statusLabels[newStatus] || newStatus}`,
          ticketId,
          userId: currentUser.id
        });
      }
    };
    window.addEventListener('ticketCreated', handleTicketCreated as EventListener);
    window.addEventListener('ticketAssigned', handleTicketAssigned as EventListener);
    window.addEventListener('newMessage', handleNewMessage as EventListener);
    window.addEventListener('ticketDeleted', handleTicketDeleted as EventListener);
    window.addEventListener('ticketStatusChanged', handleTicketStatusChanged as EventListener);
    
    return () => {
      window.removeEventListener('ticketCreated', handleTicketCreated as EventListener);
      window.removeEventListener('ticketAssigned', handleTicketAssigned as EventListener);
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
      window.removeEventListener('ticketDeleted', handleTicketDeleted as EventListener);
      window.removeEventListener('ticketStatusChanged', handleTicketStatusChanged as EventListener);
    };
  }, [addNotification, currentUser]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log('✅ Marcando notificación como leída:', id);
      
      const success = await databaseService.markNotificationAsRead(id);
      
      if (success) {
        setNotifications(prev => prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        ));
        
        // Dispatch event to force update of notification count in UI
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return false;
    try {
      console.log('✅ Marcando todas las notificaciones como leídas');
      const success = await databaseService.markAllNotificationsAsRead(currentUser.id);
      if (success) {
        setNotifications(prev => prev.map(notification =>
          notification.userId === currentUser.id
            ? { ...notification, isRead: true }
            : notification
        ));
        // Recargar notificaciones desde backend para forzar actualización visual
        await loadNotifications();
        // Dispatch event to force update of notification count in UI DESPUÉS de actualizar el estado
        setTimeout(() => {
          const updateEvent = new CustomEvent('notificationRead');
          window.dispatchEvent(updateEvent);
          console.log('✅ Estado de notificaciones tras marcar como leídas:', notifications);
        }, 100);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Error marcando todas las notificaciones como leídas:', error);
      return false;
    }
  }, [currentUser, loadNotifications, notifications]);

  const getUnreadCount = useCallback(() => {
    if (!currentUser) return 0;
    const count = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;
    console.log(`[NotificationContext] getUnreadCount para userId=${currentUser.id}:`, count, notifications);
    return count;
  }, [notifications, currentUser]);

  const getNotificationsByUser = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [notifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const removeAllNotifications = useCallback(async () => {
    if (!currentUser) return;
    await markAllAsRead();
  }, [currentUser, markAllAsRead]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      getUnreadCount,
      getNotificationsByUser,
      removeNotification,
      removeAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}