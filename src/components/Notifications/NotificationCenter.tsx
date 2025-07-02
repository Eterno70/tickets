import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useState, useEffect } from 'react';
import { Bell, Check, MessageCircle, UserPlus, AlertTriangle, Ticket } from 'lucide-react';

interface NotificationCenterProps {
  onTicketClick: (ticketId: string) => void;
}

export function NotificationCenter({ onTicketClick }: NotificationCenterProps) {
  const { currentUser } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  
  // Force re-render when notifications change
  const [, setForceUpdate] = useState(0);
  
  // Update component when notifications change
  useEffect(() => {
    const handleNotificationUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('notificationReceived', handleNotificationUpdate);
    window.addEventListener('notificationRead', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationReceived', handleNotificationUpdate);
      window.removeEventListener('notificationRead', handleNotificationUpdate);
    };
  }, []);

  if (!currentUser) return null;

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new-message': return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'ticket-assigned': return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'ticket-updated': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'ticket-created': return <Ticket className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
      
      // Dispatch event to force update of notification count
      const event = new CustomEvent('notificationRead');
      window.dispatchEvent(event);
    }
    onTicketClick(notification.ticketId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
          >
            <Check className="w-4 h-4 mr-1" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay notificaciones
          </h3>
          <p className="text-gray-600">
            Las notificaciones aparecerán aquí cuando tengas actividad nueva
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {userNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                notification.isRead
                  ? 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      notification.isRead ? 'text-gray-900' : 'text-blue-900'
                    }`}>
                      {notification.title}
                    </p>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    notification.isRead ? 'text-gray-600' : 'text-blue-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                      Ticket #{notification.ticketId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}