import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { useChat } from '../../contexts/ChatContext';
import { Ticket, Clock, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';

export function DashboardStats() {
  const { currentUser } = useAuth();
  const { tickets, getTicketsByUser, getTicketsByAssignee } = useTickets();
  const { getTotalUnreadCount } = useChat();

  if (!currentUser) return null;

  const getStats = () => {
    if (currentUser.role === 'user') {
      const userTickets = getTicketsByUser(currentUser.id);
      return [
        {
          title: 'Mis Tickets',
          value: userTickets.length,
          icon: Ticket,
          color: 'bg-blue-500',
          change: '+2 este mes'
        },
        {
          title: 'En Progreso',
          value: userTickets.filter(t => t.status === 'in-progress').length,
          icon: Clock,
          color: 'bg-yellow-500',
          change: '50% completado'
        },
        {
          title: 'Resueltos',
          value: userTickets.filter(t => t.status === 'resolved').length,
          icon: CheckCircle,
          color: 'bg-green-500',
          change: '+1 esta semana'
        },
        {
          title: 'Mensajes',
          value: getTotalUnreadCount(currentUser.id),
          icon: MessageCircle,
          color: 'bg-purple-500',
          change: 'Sin leer'
        }
      ];
    }

    if (currentUser.role === 'technician') {
      const assignedTickets = getTicketsByAssignee(currentUser.id);
      return [
        {
          title: 'Asignados',
          value: assignedTickets.length,
          icon: Ticket,
          color: 'bg-blue-500',
          change: '+3 hoy'
        },
        {
          title: 'Pendientes',
          value: assignedTickets.filter(t => t.status === 'open').length,
          icon: AlertTriangle,
          color: 'bg-red-500',
          change: 'Requieren atención'
        },
        {
          title: 'En Progreso',
          value: assignedTickets.filter(t => t.status === 'in-progress').length,
          icon: Clock,
          color: 'bg-yellow-500',
          change: 'Trabajando en ellos'
        },
        {
          title: 'Completados',
          value: assignedTickets.filter(t => t.status === 'resolved').length,
          icon: CheckCircle,
          color: 'bg-green-500',
          change: '+5 esta semana'
        }
      ];
    }

    // Admin stats
    return [
      {
        title: 'Total Tickets',
        value: tickets.length,
        icon: Ticket,
        color: 'bg-blue-500',
        change: '+12% vs mes anterior'
      },
      {
        title: 'Abiertos',
        value: tickets.filter(t => t.status === 'open').length,
        icon: AlertTriangle,
        color: 'bg-red-500',
        change: '15% del total'
      },
      {
        title: 'En Progreso',
        value: tickets.filter(t => t.status === 'in-progress').length,
        icon: Clock,
        color: 'bg-yellow-500',
        change: '30% del total'
      },
      {
        title: 'Resueltos',
        value: tickets.filter(t => t.status === 'resolved').length,
        icon: CheckCircle,
        color: 'bg-green-500',
        change: '85% tasa resolución'
      }
    ];
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}