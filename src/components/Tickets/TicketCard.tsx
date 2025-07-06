import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { useChat } from '../../contexts/ChatContext';
import { Ticket } from '../../types';
import { Clock, User, MessageCircle, AlertTriangle, CheckCircle, Zap, UserPlus, ChevronDown, X, Play, Pause, Trash2 } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  onDelete?: () => void;
}

export function TicketCard({ ticket, onClick, onDelete }: TicketCardProps) {
  const { currentUser } = useAuth();
  const { users, updateTicket, deleteTicket } = useTickets();
  const { getUnreadCount } = useChat();
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!currentUser) return null;

  const creator = users.find(u => u.id === ticket.createdBy);
  const assignee = users.find(u => u.id === ticket.assignedTo);
  const unreadCount = getUnreadCount(ticket.id, currentUser.id);

  // Get available technicians for assignment
  const technicians = users.filter(u => u.role === 'technician');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateTicket(ticket.id, { status: newStatus as any });
    setShowStatusMenu(false);
  };

  const handleAssignTicket = (technicianId: string) => {
    updateTicket(ticket.id, { assignedTo: technicianId });
    setShowAssignMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
      await deleteTicket(ticket.id);
      if (onDelete) onDelete();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeSinceCreated = () => {
    const now = new Date();
    const diff = now.getTime() - ticket.createdAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} día${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      return 'Menos de 1 hora';
    }
  };

  const isAssignedToCurrentUser = currentUser.role === 'technician' && ticket.assignedTo === currentUser.id;

  // ID especial del chat privado
  const PRIVATE_CHAT_ID = '00000000-0000-0000-0000-000000000999';

  return (
    <div 
      className={`bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer relative
        ${isAssignedToCurrentUser ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}
        ${ticket.status === 'open' && ticket.priority === 'urgent' ? 'ring-2 ring-red-200' : ''}
        ${ticket.id === PRIVATE_CHAT_ID ? 'bg-red-50 border-red-200' : ''}`}
      onClick={onClick}
    >
      {/* Botón de eliminar para administradores en la parte inferior derecha, posición absoluta */}
      {currentUser.role === 'admin' && (
        <button
          className="p-2 rounded-full hover:bg-red-100 transition-colors absolute bottom-4 right-4 z-10 shadow-md"
          title="Eliminar ticket"
          onClick={handleDelete}
        >
          <Trash2 className="w-6 h-6 text-red-500" />
        </button>
      )}
      {/* Priority and Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
            {getPriorityIcon(ticket.priority)}
            <span className="capitalize">{ticket.priority}</span>
          </div>
          
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
            {ticket.status === 'open' && 'Abierto'}
            {ticket.status === 'in-progress' && 'En Progreso'}
            {ticket.status === 'resolved' && 'Resuelto'}
            {ticket.status === 'closed' && 'Cerrado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            #{ticket.id}
          </span>
          {isAssignedToCurrentUser && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
              Asignado a ti
            </span>
          )}
        </div>
      </div>

      {/* Ticket Content */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>Creado por: <span className="font-medium">{creator?.name}</span></span>
          </div>
          
          {assignee ? (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Asignado a: <span className="font-medium text-blue-600">{assignee.name}</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Sin asignar</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Hace {getTimeSinceCreated()}</span>
          </div>
          
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{unreadCount} nuevos</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
            {ticket.category}
          </span>
          <span className="text-xs text-gray-500">
            Actualizado: {formatDate(ticket.updatedAt)}
          </span>
        </div>
      </div>

      {/* Admin Assignment Controls */}
      {currentUser.role === 'admin' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200 mb-4">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAssignMenu(!showAssignMenu);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              {assignee ? 'Reasignar' : 'Asignar Técnico'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAssignMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-[250px]">
                <div className="p-3">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    Asignar ticket a técnico:
                  </div>
                  {technicians.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No hay técnicos disponibles
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {technicians.map((tech) => (
                        <button
                          key={tech.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignTicket(tech.id);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            tech.id === ticket.assignedTo ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${tech.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div className="flex-1">
                            <div className="font-medium">{tech.name}</div>
                            <div className="text-xs text-gray-500">
                              {tech.isOnline ? 'En línea' : 'Desconectado'}
                            </div>
                          </div>
                          {tech.id === ticket.assignedTo && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Actual</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {ticket.assignedTo && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTicket(ticket.id, { assignedTo: undefined });
                          setShowAssignMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Quitar asignación
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technician Controls - Enhanced */}
      {currentUser.role === 'technician' && isAssignedToCurrentUser && (
        <div className="pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Acciones del Técnico:</h4>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(!showStatusMenu);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
              >
                Cambiar Estado
                <ChevronDown className="w-3 h-3" />
              </button>

              {showStatusMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-[180px]">
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('in-progress');
                      }}
                      disabled={ticket.status === 'in-progress'}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-2 text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      Iniciar Trabajo
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('resolved');
                      }}
                      disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Resuelto
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('closed');
                      }}
                      disabled={ticket.status === 'closed'}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Cerrar Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('in-progress');
              }}
              disabled={ticket.status === 'in-progress'}
              className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {ticket.status === 'in-progress' ? 'En Progreso' : 'Iniciar'}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('resolved');
              }}
              disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
              className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Resolver
            </button>
          </div>

          {ticket.status === 'resolved' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('closed');
              }}
              className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cerrar Ticket
            </button>
          )}
        </div>
      )}

      {/* General Action Buttons for Admin */}
      {currentUser.role === 'admin' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('in-progress');
            }}
            disabled={ticket.status === 'in-progress'}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            En Progreso
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('resolved');
            }}
            disabled={ticket.status === 'resolved'}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Resolver
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('closed');
            }}
            disabled={ticket.status === 'closed'}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tags */}
      {ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
          {ticket.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Overlay to close menus when clicking outside */}
      {(showAssignMenu || showStatusMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setShowAssignMenu(false);
            setShowStatusMenu(false);
          }}
        />
      )}
    </div>
  );
}