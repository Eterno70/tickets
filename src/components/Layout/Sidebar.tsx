import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useEffect, useState } from 'react';
import { 
  Ticket, 
  Users, 
  Settings, 
  MessageCircle, 
  Bell, 
  User,
  Activity,
  BarChart3,
  Home,
  Shield,
  Wrench,
  Database
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { currentUser } = useAuth();
  const { getTotalUnreadCount } = useChat();
  const { getUnreadCount } = useNotifications();
  
  // Force re-render when unread counts change
  const [, setForceUpdate] = useState(0);
  
  // Update component when notifications or messages change
  useEffect(() => {
    const handleCountUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('notificationReceived', handleCountUpdate);
    window.addEventListener('notificationRead', handleCountUpdate);
    window.addEventListener('messageReceived', handleCountUpdate);
    window.addEventListener('messagesRead', handleCountUpdate);
    
    return () => {
      window.removeEventListener('notificationReceived', handleCountUpdate);
      window.removeEventListener('notificationRead', handleCountUpdate);
      window.removeEventListener('messageReceived', handleCountUpdate);
      window.removeEventListener('messagesRead', handleCountUpdate);
    };
  }, []);

  if (!currentUser) return null;

  const unreadChats = getTotalUnreadCount(currentUser.id);
  const unreadNotifications = getUnreadCount();

  const getMenuItems = () => {
    const baseItems = [
      { 
        id: 'tickets', 
        label: currentUser.role === 'user' ? 'Mis Tickets' : 
               currentUser.role === 'technician' ? 'Tickets Asignados' : 'Gestión de Tickets', 
        icon: Ticket 
      },
      { id: 'chat', label: 'Chat', icon: MessageCircle, badge: unreadChats },
      { id: 'notifications', label: 'Notificaciones', icon: Bell, badge: unreadNotifications }
    ];

    if (currentUser.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        ...baseItems,
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'reports', label: 'Reportes', icon: BarChart3 },
        { id: 'audit', label: 'Auditoría', icon: Activity },
        { id: 'database-status', label: 'Base de Datos', icon: Database },
        { id: 'settings', label: 'Configuración', icon: Settings }
      ];
    }

    if (currentUser.role === 'technician') {
      return [
        ...baseItems,
        { id: 'reports', label: 'Mis Reportes', icon: BarChart3 }
      ];
    }

    // User role
    return baseItems;
  };

  const menuItems = getMenuItems();

  const getRoleInfo = () => {
    switch (currentUser.role) {
      case 'user':
        return {
          title: 'Ciudadano',
          subtitle: 'Gestiona tus solicitudes',
          icon: User,
          color: 'bg-green-500'
        };
      case 'technician':
        return {
          title: 'Funcionario',
          subtitle: 'Tickets asignados',
          icon: Wrench,
          color: 'bg-blue-500'
        };
      case 'admin':
        return {
          title: 'Administrador',
          subtitle: 'Control total',
          icon: Shield,
          color: 'bg-purple-500'
        };
      default:
        return {
          title: 'Alcaldía Municipal',
          subtitle: 'Sistema de tickets',
          icon: User,
          color: 'bg-gray-500'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      {/* Logo and Brand */}
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-2 shadow-lg flex items-center justify-center">
          <img 
            src="/logo-alcaldia.png" 
            alt="Alcaldía de Cabañas Oeste" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzMzNzNkYyIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVIMTVMMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxNSIgeT0iMTgiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
            }}
          />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-bold text-white leading-tight">Unidad de Informática</h1>
          <p className="text-xs text-gray-300">Alcaldía Cabañas Oeste</p>
        </div>
      </div>

      {/* User Role Card */}
      <div className="mb-6">
        <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className={`${roleInfo.color} w-12 h-12 rounded-full flex items-center justify-center`}>
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3 flex-1">
            <p className="font-semibold text-white">{currentUser.name}</p>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-xs text-green-400 font-medium">En línea</span>
            </div>
          </div>
        </div>
      </div>


      {/* Navigation Menu */}
      <nav className="space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Navegación
        </div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-bold animate-pulse ${
                  isActive 
                    ? 'bg-white text-blue-600' 
                    : 'bg-red-500 text-white'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>


    </div>
  );
}