import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Settings, Bell, X, User, Shield, Wrench, BarChart3, Users, ChevronDown } from 'lucide-react';

interface HeaderProps {
}

export default function Header({}: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const { notifications, markAsRead, getUnreadCount, getNotificationsByUser } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const unreadCount = getUnreadCount();
  const userNotifications = getNotificationsByUser(currentUser.id);

  // Solicitar permisos de notificación al cargar el componente
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Solicitar permisos después de una interacción del usuario
      const requestPermission = () => {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Permiso de notificaciones:', permission);
        });
      };
    requestPermission(); // ← ✅ AGREGAR SOLO ESTA LÍNEA
      
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
  }, []);

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
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getUserRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'technician':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'manager':
        return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'supervisor':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      technician: 'Técnico',
      manager: 'Gerente',
      supervisor: 'Supervisor',
      user: 'Usuario'
    };
    return roleNames[role as keyof typeof roleNames] || 'Usuario';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Tickets
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Notificaciones</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No hay notificaciones</p>
                      ) : (
                        <div className="space-y-2">
                          {userNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                notification.isRead 
                                  ? 'bg-gray-50 hover:bg-gray-100' 
                                  : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-lg">
                                  {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${
                                    notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTime(new Date(notification.createdAt))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 p-2 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  {getUserRoleIcon()}
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {currentUser.fullName || currentUser.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleDisplayName(currentUser.role)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </button>

              {/* Dropdown del menú de usuario */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Aquí puedes agregar navegación a configuración
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Configuración
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}