import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { useChat } from '../../contexts/ChatContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  BarChart3, 
  Users, 
  Ticket, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Shield,
  Database,
  Settings,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  UserCheck,
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  Star,
  Target,
  Gauge
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center ${trendColor} text-sm font-medium`}>
          {React.createElement(trendIcon, { className: "w-4 h-4 mr-1" })}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

function QuickAction({ title, description, icon: Icon, color, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </button>
  );
}

export function ModernAdminPanel() {
  const { currentUser } = useAuth();
  const { tickets, users } = useTickets();
  const { getTotalUnreadCount } = useChat();
  const { getUnreadCount } = useNotifications();
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a este panel</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular delay para UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isOnline).length;
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
  const unreadMessages = getTotalUnreadCount(currentUser.id);
  const unreadNotifications = getUnreadCount();

  const resolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : '0';
  const userGrowth = '+12%';
  const ticketGrowth = '+8%';
  const responseTime = '2.3h';

  const metrics = [
    {
      title: 'Usuarios Totales',
      value: totalUsers,
      change: userGrowth,
      trend: 'up' as const,
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Usuarios Activos',
      value: activeUsers,
      change: `${((activeUsers / totalUsers) * 100).toFixed(0)}%`,
      trend: 'up' as const,
      icon: UserCheck,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'Total Solicitudes',
      value: totalTickets,
      change: ticketGrowth,
      trend: 'up' as const,
      icon: Ticket,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      title: 'Tickets Abiertos',
      value: openTickets,
      change: '-5%',
      trend: 'down' as const,
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    },
    {
      title: 'Tasa Resolución',
      value: `${resolutionRate}%`,
      change: '+3%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
    },
    {
      title: 'Tiempo Respuesta',
      value: responseTime,
      change: '-15%',
      trend: 'down' as const,
      icon: Clock,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    }
  ];

  const quickActions = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y administrar cuentas de usuario',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => {
        const event = new CustomEvent('navigateToAdminSection', { detail: { section: 'users' } });
        window.dispatchEvent(event);
      }
    },
    {
      title: 'Reportes y Análisis',
      description: 'Ver estadísticas detalladas y generar reportes',
      icon: BarChart3,
      color: 'bg-green-500',
      onClick: () => {
        const event = new CustomEvent('navigateToAdminSection', { detail: { section: 'reports' } });
        window.dispatchEvent(event);
      }
    },
    {
      title: 'Estado de Base de Datos',
      description: 'Verificar conexión y rendimiento del sistema',
      icon: Database,
      color: 'bg-orange-500',
      onClick: () => {
        const event = new CustomEvent('navigateToAdminSection', { detail: { section: 'database-status' } });
        window.dispatchEvent(event);
      }
    },
    {
      title: 'Configuración del Sistema',
      description: 'Ajustar parámetros y configuraciones globales',
      icon: Settings,
      color: 'bg-purple-500',
      onClick: () => {
        const event = new CustomEvent('navigateToAdminSection', { detail: { section: 'settings' } });
        window.dispatchEvent(event);
      }
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'user_created',
      message: 'Nuevo usuario registrado: Ana Martínez',
      time: 'Hace 5 min',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'ticket_resolved',
      message: 'Ticket #1234 resuelto por María García',
      time: 'Hace 12 min',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'urgent_ticket',
      message: 'Ticket urgente creado: Servidor caído',
      time: 'Hace 18 min',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 4,
      type: 'system_update',
      message: 'Actualización del sistema completada',
      time: 'Hace 1 hora',
      icon: Settings,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                <img 
                  src="/logo-alcaldia.png" 
                  alt="Alcaldía de Cabañas Oeste" 
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDhMMjAgMTJIMTJMMTYgOFoiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEyIiB5PSIxNCIgd2lkdGg9IjgiIGhlaWdodD0iMTAiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Unidad de Informática</h1>
                <p className="text-gray-600">Bienvenido(a), {currentUser.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Acciones Rápidas</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Herramientas de administración</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Actividad Reciente</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todo
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Estado del Sistema</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">
                  Operativo
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    Almacenamiento Local
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  ✓ Disponible
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Aplicación</span>
                </div>
                <span className="text-sm font-medium text-blue-600">✓ Operativa</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    Datos Demo
                  </span>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  ✓ Cargados
                </span>
              </div>
            </div>
            
            {/* Información del sistema */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Estadísticas Locales</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Usuarios: <span className="font-medium">{users.length}</span></div>
                <div>Tickets: <span className="font-medium">{tickets.length}</span></div>
                <div>Funcionarios: <span className="font-medium">{users.filter(u => u.role === 'technician').length}</span></div>
                <div>Administradores: <span className="font-medium">{users.filter(u => u.role === 'admin').length}</span></div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-gray-600">
                  Sistema en funcionamiento
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Rendimiento</h2>
              <Gauge className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Uso de CPU</span>
                  <span className="text-sm font-bold text-gray-900">23%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Uso de Memoria</span>
                  <span className="text-sm font-bold text-gray-900">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Almacenamiento</span>
                  <span className="text-sm font-bold text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiempo de respuesta promedio</span>
                  <span className="font-bold text-green-600">142ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Notifications */}
        {(urgentTickets > 0 || unreadNotifications > 0) && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold text-red-900">Alertas del Sistema</h2>
              </div>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {urgentTickets + unreadNotifications} alertas
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentTickets > 0 && (
                <div className="bg-white p-4 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-900">Tickets Urgentes</h3>
                      <p className="text-sm text-red-700">{urgentTickets} tickets requieren atención inmediata</p>
                    </div>
                  </div>
                </div>
              )}
              
              {unreadNotifications > 0 && (
                <div className="bg-white p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Notificaciones</h3>
                      <p className="text-sm text-orange-700">{unreadNotifications} notificaciones sin leer</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}