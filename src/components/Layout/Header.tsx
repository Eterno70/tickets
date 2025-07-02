import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LogOut, Settings, Bell, X, User, Shield, Wrench, BarChart3, Users, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onNavigateToTicket?: (ticketId: string) => void;
}

export function Header({ onNavigateToTicket }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const { getUnreadCount, getNotificationsByUser, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Force re-render when unread count changes
  const [, setForceUpdate] = useState(0);
  
  // Solicitar permisos de notificación al cargar el componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Solicitar permisos después de una interacción del usuario
      const requestPermission = () => {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Permiso de notificaciones:', permission);
          
          // Si se conceden los permisos, mostrar notificación de bienvenida
          if (permission === 'granted' && currentUser) {
            const notification = new Notification('Bienvenido a TicketFlow', {
              body: `Hola ${currentUser.name}, ahora recibirás notificaciones de tus tickets`,
              icon: '/Logo.png'
            });
            
            // Cerrar la notificación después de 5 segundos
            setTimeout(() => notification.close(), 5000);
          }
        });
      };

      // Agregar listener para solicitar permisos después de interacción
      const handleUserInteraction = () => {
        requestPermission();
        // Eliminar listeners después de solicitar
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [currentUser]);
  
  // Update component when notifications change
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('🔄 Header - Actualizando contador de notificaciones');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('notificationReceived', handleNotificationUpdate);
    window.addEventListener('notificationRead', handleNotificationUpdate);
    window.addEventListener('messageReceived', handleNotificationUpdate);
    window.addEventListener('messagesRead', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationReceived', handleNotificationUpdate);
      window.removeEventListener('notificationRead', handleNotificationUpdate);
      window.removeEventListener('messageReceived', handleNotificationUpdate);
      window.removeEventListener('messagesRead', handleNotificationUpdate);
    };
  }, []);

  if (!currentUser) return null;

  const unreadCount = getUnreadCount();
  const userNotifications = getNotificationsByUser(currentUser.id);

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new-message': return '💬';
      case 'ticket-assigned': return '👤';
      case 'ticket-updated': return '⚠️';
      case 'ticket-created': return '🎫';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
      
      // Dispatch event to force update of notification count
      const event = new CustomEvent('notificationRead');
      window.dispatchEvent(event);
    }
    setShowNotifications(false);
    
    // Navigate to the ticket
    if (onNavigateToTicket) {
      onNavigateToTicket(notification.ticketId);
    }
    
    // Navigate to the ticket
    if (onNavigateToTicket) {
      onNavigateToTicket(notification.ticketId);
    }
  };
  
  // Escuchar eventos de navegación desde notificaciones del navegador
  React.useEffect(() => {
    const handleNavigateToTicket = (event: CustomEvent) => {
      const { ticketId } = event.detail;
      if (onNavigateToTicket) {
        onNavigateToTicket(ticketId);
      }
    };

    window.addEventListener('navigateToTicket', handleNavigateToTicket as EventListener);
    
    return () => {
      window.removeEventListener('navigateToTicket', handleNavigateToTicket as EventListener);
    };
  }, [onNavigateToTicket]);

  const getRoleInfo = () => {
    switch (currentUser.role) {
      case 'user':
        return {
          title: 'Portal Ciudadano',
          description: 'Gestiona tus solicitudes municipales',
          icon: User,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'technician':
        return {
          title: 'Panel de Funcionario',
          description: 'Gestiona solicitudes asignadas',
          icon: Wrench,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'admin':
        return {
          title: 'Panel Administrativo',
          description: 'Unidad de Informática',
          icon: Shield,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          title: 'Sistema Municipal',
          description: 'Gestión de solicitudes ciudadanas',
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* HEADER PRINCIPAL CON Z-INDEX MÁXIMO - SIEMPRE VISIBLE */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 relative shadow-sm flex-shrink-0" style={{ zIndex: 99999 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Role-specific header */}
            <div className={`flex items-center p-3 rounded-lg border ${roleInfo.bgColor} ${roleInfo.borderColor}`}>
              <RoleIcon className={`w-6 h-6 ${roleInfo.color} mr-3`} />
              <div>
                <h2 className={`text-xl font-bold ${roleInfo.color}`}>
                  {roleInfo.title}
                </h2>
                <p className="text-sm text-gray-600">{roleInfo.description}</p>
              </div>
            </div>
            
            {/* Welcome message */}
            <div className="hidden md:block">
              <p className="text-gray-600">
                Bienvenido, <span className="font-semibold text-gray-900">{currentUser.name}</span>
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600 font-medium">En línea</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown - CON SCROLL */}
              {showNotifications && (
                <div 
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col" 
                  style={{ 
                    zIndex: 99998,
                    maxHeight: '70vh' // Altura máxima del 70% de la ventana
                  }}
                >
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Marcar todas como leídas
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div 
                    className="overflow-y-auto flex-1"
                    style={{ 
                      maxHeight: 'calc(70vh - 80px)' // Altura máxima menos el header
                    }}
                  >
                    {userNotifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No hay notificaciones</p>
                      </div>
                    ) : (
                      userNotifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${
                                !notification.isRead ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.createdAt)}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                                  #{notification.ticketId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {userNotifications.length > 10 && (
                    <div className="p-3 text-center border-t border-gray-200 flex-shrink-0">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* OVERLAY PARA CERRAR DROPDOWNS - Z-INDEX ALTO PERO MENOR QUE LOS DROPDOWNS */}
      {showNotifications && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 99997 }}
          onClick={() => {
            setShowNotifications(false);
          }}
        />
      )}
    </>
  );
}