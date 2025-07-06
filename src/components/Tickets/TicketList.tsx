import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { TicketCard } from './TicketCard';
import { CreateTicketModal } from './CreateTicketModal';
import { Plus, Filter, Search, Users, AlertTriangle, Clock, CheckCircle, Target } from 'lucide-react';

interface TicketListProps {
  onTicketClick?: (ticketId: string) => void;
  onDeleteTicket?: () => void;
}

export function TicketList({ onTicketClick, onDeleteTicket }: TicketListProps) {
  const { currentUser } = useAuth();
  const { tickets, getTicketsByUser, getTicketsByAssignee, users, getPinnedTickets, isTicketPinned } = useTickets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  if (!currentUser) return null;

  const getFilteredTickets = () => {
    let filteredTickets = currentUser.role === 'user' 
      ? getTicketsByUser(currentUser.id)
      : currentUser.role === 'technician'
      ? getTicketsByAssignee(currentUser.id)
      : tickets;

    // Status filter
    if (filter !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === filter);
    }

    // Assignment filter (only for admin)
    if (currentUser.role === 'admin' && assignmentFilter !== 'all') {
      if (assignmentFilter === 'unassigned') {
        filteredTickets = filteredTickets.filter(ticket => !ticket.assignedTo);
      } else if (assignmentFilter === 'assigned') {
        filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo);
      }
    }

    // Search filter
    if (search) {
      filteredTickets = filteredTickets.filter(ticket => {
        const creator = users.find(u => u.id === ticket.createdBy);
        const assignee = users.find(u => u.id === ticket.assignedTo);
        const s = search.toLowerCase();
        return (
          ticket.title.toLowerCase().includes(s) ||
          ticket.description.toLowerCase().includes(s) ||
          (creator?.name?.toLowerCase().includes(s) ?? false) ||
          (assignee?.name?.toLowerCase().includes(s) ?? false) ||
          ticket.tags.some(tag => tag.toLowerCase().includes(s))
        );
      });
    }

   return filteredTickets.sort((a, b) => {
  // First by creation date (newest first)
  const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();
  if (dateDiff !== 0) return dateDiff;
  
  // Then by priority (urgent > high > medium > low)
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return priorityOrder[b.priority] - priorityOrder[a.priority];
});
};

  // Ordenar: primero los anclados (en orden de anclaje), luego el resto
  const filteredTicketsRaw = getFilteredTickets();
  const pinnedIds = getPinnedTickets();
  const pinnedTickets = pinnedIds
    .map(id => filteredTicketsRaw.find(t => t.id === id))
    .filter(Boolean);
  const unpinnedTickets = filteredTicketsRaw.filter(t => !pinnedIds.includes(t.id));
  const filteredTickets = [...pinnedTickets, ...unpinnedTickets];
  
  const unassignedCount = currentUser.role === 'admin' 
    ? tickets.filter(t => !t.assignedTo).length 
    : 0;

  // Get technician-specific stats
  const getTechnicianStats = () => {
    if (currentUser.role !== 'technician') return null;
    
    const assignedTickets = getTicketsByAssignee(currentUser.id);
    return {
      total: assignedTickets.length,
      open: assignedTickets.filter(t => t.status === 'open').length,
      inProgress: assignedTickets.filter(t => t.status === 'in-progress').length,
      resolved: assignedTickets.filter(t => t.status === 'resolved').length,
      // Solo contar urgentes que NO estén cerrados ni resueltos
      urgent: assignedTickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length
    };
  };

  const techStats = getTechnicianStats();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'open', label: 'Abiertos' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'resolved', label: 'Resueltos' },
    { value: 'closed', label: 'Cerrados' }
  ];

  const assignmentOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'assigned', label: 'Asignados' },
    { value: 'unassigned', label: 'Sin asignar' }
  ];

  const handleTicketClick = (ticketId: string) => {
    if (onTicketClick) {
      onTicketClick(ticketId);
    }
  };

  const getPageTitle = () => {
    switch (currentUser.role) {
      case 'user':
        return 'Mis Tickets';
      case 'technician':
        return 'Tickets Asignados';
      case 'admin':
        return 'Gestión de Tickets';
      default:
        return 'Tickets';
    }
  };

  const getPageDescription = () => {
    switch (currentUser.role) {
      case 'user':
        return 'Gestiona y da seguimiento a tus solicitudes de soporte';
      case 'technician':
        return 'Tickets asignados por el administrador para tu atención';
      case 'admin':
        return 'Panel completo de administración de tickets y asignaciones';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-1">{getPageDescription()}</p>
          
          {currentUser.role === 'admin' && unassignedCount > 0 && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-orange-700 font-medium">
                {unassignedCount} ticket{unassignedCount !== 1 ? 's' : ''} sin asignar requieren atención
              </span>
            </div>
          )}

          {currentUser.role === 'technician' && techStats && techStats.urgent > 0 && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 font-medium">
                {techStats.urgent} ticket{techStats.urgent !== 1 ? 's' : ''} urgente{techStats.urgent !== 1 ? 's' : ''} requieren atención inmediata
              </span>
            </div>
          )}
        </div>
        
        {(currentUser.role === 'user' || currentUser.role === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Solicitud
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {currentUser.role === 'admin' && (
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
              >
                {assignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats for Admin */}
      {currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Asignar</p>
                <p className="text-3xl font-bold text-orange-600">{unassignedCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Técnicos Activos</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.role === 'technician' && u.isOnline).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats for Technician */}
      {currentUser.role === 'technician' && techStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asignados</p>
                <p className="text-3xl font-bold text-blue-600">{techStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-3xl font-bold text-red-600">{techStats.urgent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abiertos</p>
                <p className="text-3xl font-bold text-orange-600">{techStats.open}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-3xl font-bold text-yellow-600">{techStats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">{techStats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 text-xl mb-4">
              {currentUser.role === 'technician' ? (
                <Target className="w-16 h-16 mx-auto mb-4" />
              ) : (
                <Filter className="w-16 h-16 mx-auto mb-4" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay tickets disponibles
            </h3>
            <p className="text-gray-600">
              {currentUser.role === 'user' && 'Crea tu primer ticket para comenzar'}
              {currentUser.role === 'admin' && search && 'Intenta ajustar los filtros de búsqueda'}
              {currentUser.role === 'technician' && 'No tienes tickets asignados en este momento'}
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => handleTicketClick(ticket.id)}
              onDelete={onDeleteTicket}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}