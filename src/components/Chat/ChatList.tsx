import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { useChat } from '../../contexts/ChatContext';
import { MessageCircle, Clock, Search, Filter, Users, Star, MoreVertical, Pin } from 'lucide-react';

interface ChatListProps {
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
}

export function ChatList({ selectedTicketId, onSelectTicket }: ChatListProps) {
  const { currentUser } = useAuth();
  const { tickets, getTicketsByUser, getTicketsByAssignee, users, pinTicket, unpinTicket, isTicketPinned, getPinnedTickets, updateTicket, deleteTicket } = useTickets();
  const { getUnreadCount, chatRooms, getTotalUnreadCount, markAsRead: markChatAsRead, reloadUnreadCounts } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Force re-render when unread counts change
  const [, setForceUpdate] = useState(0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [assignMenuOpenId, setAssignMenuOpenId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [assignModalTicket, setAssignModalTicket] = useState<string | null>(null);

  // Cerrar menú contextual al hacer clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);
  
  // Update component when unread counts change
  useEffect(() => {
    const handleUnreadCountUpdate = () => {
      console.log('🔄 ChatList - Actualizando contadores de mensajes no leídos');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('messagesRead', handleUnreadCountUpdate);
    window.addEventListener('messageReceived', handleUnreadCountUpdate);
    window.addEventListener('unreadCountsUpdated', handleUnreadCountUpdate);
    window.addEventListener('notificationReceived', handleUnreadCountUpdate);
    window.addEventListener('notificationRead', handleUnreadCountUpdate);
    
    return () => {
      window.removeEventListener('messagesRead', handleUnreadCountUpdate);
      window.removeEventListener('messageReceived', handleUnreadCountUpdate);
      window.removeEventListener('unreadCountsUpdated', handleUnreadCountUpdate);
      window.removeEventListener('notificationReceived', handleUnreadCountUpdate);
      window.removeEventListener('notificationRead', handleUnreadCountUpdate);
    };
  }, []);

  // Obtener técnicos disponibles
  const technicians = users.filter(u => u.role === 'technician');

  // Cerrar menú de asignación si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAssignMenuOpenId(null);
      }
    }
    if (assignMenuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assignMenuOpenId]);

  if (!currentUser) return null;

  const getUserTickets = () => {
    if (currentUser.role === 'user') {
      return getTicketsByUser(currentUser.id);
    } else if (currentUser.role === 'technician') {
      return getTicketsByAssignee(currentUser.id);
    } else {
      return tickets;
    }
  };

  // Ordenar: primero los anclados (en orden de anclaje), luego el resto
  const userTicketsRaw = getUserTickets().filter(ticket => {
    const creator = users.find(u => u.id === ticket.createdBy);
    const assignee = users.find(u => u.id === ticket.assignedTo);
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      ticket.title.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search) ||
      (creator?.name?.toLowerCase().includes(search) ?? false) ||
      (assignee?.name?.toLowerCase().includes(search) ?? false) ||
      ticket.tags.some(tag => tag.toLowerCase().includes(search));
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  const pinnedIds = getPinnedTickets();
  const pinnedTickets = pinnedIds
    .map(id => userTicketsRaw.find(t => t.id === id))
    .filter(Boolean);
  const unpinnedTickets = userTicketsRaw.filter(t => !pinnedIds.includes(t.id));
  const userTickets = [...pinnedTickets, ...unpinnedTickets];

  // Log para depuración de tickets y contadores
  console.log('userTickets:', userTickets.map(t => ({ id: t.id, title: t.title, unread: getUnreadCount(t.id, currentUser.id) })));
  console.log('Total unread (sidebar):', getTotalUnreadCount(currentUser.id));

  // Forzar recarga de contadores de no leídos
  const marcarTodosLosChatsComoLeidos = async () => {
    if (!currentUser) return;
    console.log('Marcando todos los chats como leídos...');
    for (const ticket of userTickets) {
      console.log('Marcando como leído:', ticket.id, ticket.title);
      await markChatAsRead(ticket.id, currentUser.id);
    }
    await reloadUnreadCounts();
    alert('Todos los chats marcados como leídos');
    console.log('Después de marcar todos como leídos, total unread:', getTotalUnreadCount(currentUser.id));
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const assignModal = assignModalTicket ? ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-lg font-bold mb-4">Asignar técnico</h2>
        {technicians.length === 0 ? (
          <div className="text-gray-500 mb-4">No hay técnicos disponibles</div>
        ) : (
          <div className="space-y-2 mb-4">
            {technicians.map(tech => (
              <button
                key={tech.id}
                className="block w-full text-left px-4 py-2 rounded hover:bg-blue-100"
                disabled={assignLoading}
                onClick={async () => {
                  setAssignLoading(true);
                  await updateTicket(assignModalTicket, { assignedTo: tech.id });
                  setAssignLoading(false);
                  setAssignModalTicket(null);
                  setMenuOpenId(null);
                }}
              >{tech.name}</button>
            ))}
          </div>
        )}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={() => setAssignModalTicket(null)}
        >×</button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="bg-white border-r border-gray-200 w-80 flex-shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          {/* Botón para marcar todos los chats como leídos */}
          {userTickets.some(ticket => getUnreadCount(ticket.id, currentUser.id) > 0) && (
            <button
              onClick={marcarTodosLosChatsComoLeidos}
              className="text-xs text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1 font-semibold shadow-sm hover:bg-green-200 transition-all ml-auto"
            >
              Marcar todos los chats como leídos
            </button>
          )}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Chats</h2>
              <p className="text-xs text-gray-600">{userTickets.length} conversaciones</p>
              {userTickets.every(ticket => getUnreadCount(ticket.id, currentUser.id) === 0) && (
                <div className="flex items-center mt-1 text-green-600 text-xs font-semibold">
                  <span className="mr-1">✅</span> Todos los chats están leídos
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
              <Users className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'open', label: 'Abiertos' },
            { key: 'in-progress', label: 'En Progreso' },
            { key: 'closed', label: 'Cerrados' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List with Scroll */}
      <div className="flex-1 overflow-y-auto">
        {userTickets.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No hay conversaciones</h3>
            <p className="text-xs text-gray-500">
              {searchTerm ? 'No se encontraron resultados' : 'Las conversaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {userTickets.map((ticket) => {
              const unreadCount = getUnreadCount(ticket.id, currentUser.id);
              const chatRoom = chatRooms[ticket.id];
              const isSelected = selectedTicketId === ticket.id;
              const assignedUser = users.find(u => u.id === ticket.assignedTo);
              
              // Mostrar vista previa del último mensaje si existe
              const lastMessage = chatRoom?.lastMessage;
              const lastMessagePreview = lastMessage?.content || 
                                       (lastMessage?.attachments?.length ? 
                                        `📎 ${lastMessage.attachments.length} archivo(s)` : 
                                        'Haz clic para iniciar conversación');

              return (
                <div
                  key={ticket.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTicket(ticket.id)}
                  onKeyPress={e => { if (e.key === 'Enter') onSelectTicket(ticket.id); }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-all duration-200 relative group cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  {/* Priority Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(ticket.priority)}`} />
                  
                  <div className="ml-2">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {ticket.title}
                          </h3>
                          {ticket.priority === 'urgent' && (
                            <Star className="w-3 h-3 text-red-500 fill-current" />
                          )}
                        </div>
                        
                        {/* Status and Category */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status === 'open' && 'Abierto'}
                            {ticket.status === 'in-progress' && 'En Progreso'}
                            {ticket.status === 'resolved' && 'Resuelto'}
                            {ticket.status === 'closed' && 'Cerrado'}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-1">
                          {unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center font-medium">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {chatRoom?.lastMessage 
                              ? formatLastMessageTime(chatRoom.lastMessage.timestamp)
                              : formatLastMessageTime(ticket.updatedAt)
                            }
                          </span>
                        </div>
                        
                        {assignedUser && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {assignedUser.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700 font-medium">{assignedUser.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Last Message Preview */}
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {lastMessagePreview}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 font-mono">
                          #{ticket.id.slice(0, 6)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lastMessage 
                            ? formatLastMessageTime(lastMessage.timestamp)
                            : formatLastMessageTime(ticket.updatedAt)
                          }
                        </span>
                        {ticket.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {ticket.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                            {ticket.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          className="p-1 hover:bg-gray-200 rounded"
                          title={isTicketPinned(ticket.id) ? 'Desanclar ticket' : 'Anclar ticket'}
                          onClick={e => {
                            e.stopPropagation();
                            isTicketPinned(ticket.id) ? unpinTicket(ticket.id) : pinTicket(ticket.id);
                          }}
                        >
                          <Pin className={`w-3 h-3 ${isTicketPinned(ticket.id) ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} />
                        </button>
                        {currentUser.role === 'admin' && (
                          <div className="relative inline-block">
                            <button
                              className="p-1 hover:bg-gray-200 rounded"
                              onClick={e => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === ticket.id ? null : ticket.id);
                              }}
                            >
                              <MoreVertical className="w-3 h-3 text-gray-400" />
                            </button>
                            {menuOpenId === ticket.id && (
                              <div ref={menuRef} className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setAssignModalTicket(ticket.id);
                                  }}
                                >Asignar</button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateTicket(ticket.id, { status: 'in-progress' });
                                    setMenuOpenId(null);
                                  }}
                                >En progreso</button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateTicket(ticket.id, { status: 'resolved' });
                                    setMenuOpenId(null);
                                  }}
                                >Resuelto</button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateTicket(ticket.id, { status: 'closed' });
                                    setMenuOpenId(null);
                                  }}
                                >Cerrado</button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  onClick={async e => {
                                    e.stopPropagation();
                                    setMenuOpenId(null);
                                    if (window.confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
                                      await deleteTicket(ticket.id);
                                    }
                                  }}
                                >Eliminar</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{userTickets.filter(t => t.status === 'open').length} abiertos</span>
          <span>{userTickets.filter(t => getUnreadCount(t.id, currentUser.id) > 0).length} no leídos</span>
          <span>{userTickets.filter(t => t.priority === 'urgent').length} urgentes</span>
        </div>
      </div>
      {/* Modal de asignación de técnico */}
      {assignModal}
    </div>
  );
}