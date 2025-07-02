import React, { useState, useEffect } from 'react';
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
  const { tickets, getTicketsByUser, getTicketsByAssignee, users } = useTickets();
  const { getUnreadCount, chatRooms, getTotalUnreadCount } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Force re-render when unread counts change
  const [, setForceUpdate] = useState(0);
  
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

  const userTickets = getUserTickets().filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="bg-white border-r border-gray-200 w-80 flex-shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Chats</h2>
              <p className="text-xs text-gray-600">{userTickets.length} conversaciones</p>
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
            { key: 'in-progress', label: 'En Progreso' }
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
                <button
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-all duration-200 relative group ${
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
                          <div className="flex items-center">
                            <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {assignedUser.name.charAt(0)}
                              </span>
                            </div>
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
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Pin className="w-3 h-3 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <MoreVertical className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
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
    </div>
  );
}