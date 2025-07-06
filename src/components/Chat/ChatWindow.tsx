import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useTickets } from '../../contexts/TicketContext';
import { supabase } from '../../lib/supabase';
import { ChatMessage } from './ChatMessage';
import { FileUpload } from './FileUpload';
import { Send, Paperclip, Loader, MoreVertical, Info, Smile, Hash } from 'lucide-react';
import { FileAttachment } from '../../types';

interface ChatWindowProps {
  ticketId: string;
}

export function ChatWindow({ ticketId }: ChatWindowProps) {
  const { currentUser } = useAuth();
  const { messages, sendMessage, markAsRead, loadMessages, loading, error, playMessageSound, setMessages } = useChat();
  const { tickets, users } = useTickets();
  const [newMessage, setNewMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cambiar identificador del chat privado a UUID especial
  const PRIVATE_CHAT_ID = '00000000-0000-0000-0000-000000000999';

  // Si es chat privado, no buscamos ticket real
  const ticket = ticketId === PRIVATE_CHAT_ID ? null : tickets.find(t => t.id === ticketId);
  const ticketMessages = messages[ticketId] || [];
  const creator = ticketId === PRIVATE_CHAT_ID ? null : users.find(u => u.id === ticket?.createdBy);
  const assignee = ticketId === PRIVATE_CHAT_ID ? null : users.find(u => u.id === ticket?.assignedTo);

  // Suscribirse a cambios en tiempo real para este ticket específico
  useEffect(() => {
    if (!ticketId || !currentUser) return;

    console.log('🔄 ChatWindow - Suscribiéndose a cambios en tiempo real para ticket:', ticketId);

    // Suscribirse a cambios en mensajes de este ticket específico
    const subscription = supabase
      .channel(`chat:${ticketId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public',
        table: 'chat_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, payload => {
        console.log('🔄 ChatWindow - Nuevo mensaje en tiempo real:', payload);
        // Solo reproducir sonido si el mensaje no es del usuario actual
        if (payload.new.sender_id !== currentUser.id) {
          playMessageSound();
        }
        // Agregar el mensaje recibido directamente al estado local
        setMessages(prev => {
          const currentMessages = prev[ticketId] || [];
          if (!currentMessages.some(msg => msg.id === payload.new.id)) {
            return {
              ...prev,
              [ticketId]: [...currentMessages, {
                id: payload.new.id,
                ticketId: payload.new.ticket_id,
                senderId: payload.new.sender_id,
                content: payload.new.content,
                timestamp: new Date(payload.new.created_at),
                attachments: payload.new.attachments || [],
                isSystem: payload.new.is_system || false
              }]
            };
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      console.log('🔄 ChatWindow - Cancelando suscripción para ticket:', ticketId);
      subscription.unsubscribe();
    };
  }, [ticketId, currentUser, setMessages, playMessageSound]);

  // Cargar mensajes cuando cambia el ticket
  useEffect(() => {
    if (ticketId) {
      console.log('🔄 Cargando mensajes para ticket:', ticketId);
      loadMessages(ticketId);
    }
  }, [ticketId, loadMessages]);

  // Marcar como leído cuando se abre el chat
  useEffect(() => {
    if (currentUser && ticketId && messages[ticketId] && messages[ticketId].length > 0) {
      markAsRead(ticketId, currentUser.id);
    }
  }, [ticketId, currentUser, messages, markAsRead]);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current && ticketMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    try {
      await sendMessage(ticketId, newMessage, attachments);
      setNewMessage('');
      setAttachments([]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (files: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!currentUser || (!ticket && ticketId !== PRIVATE_CHAT_ID)) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Selecciona una conversación</h3>
          <p className="text-gray-600 max-w-sm">
            Elige un ticket de la lista para comenzar a chatear y resolver problemas
          </p>
        </div>
      </div>
    );
  }

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
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del Chat */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {ticketId === PRIVATE_CHAT_ID ? (
                  <h3 className="text-base font-bold text-gray-900 truncate">Chat Privado (Administradores y Técnicos)</h3>
                ) : (
                  <h3 className="text-base font-bold text-gray-900 truncate">{ticket.title}</h3>
                )}
                {!ticketId === PRIVATE_CHAT_ID && (
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500 font-mono">#{ticket.id.slice(0, 6)}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'open' && 'Abierto'}
                      {ticket.status === 'in-progress' && 'En Progreso'}
                      {ticket.status === 'resolved' && 'Resuelto'}
                      {ticket.status === 'closed' && 'Cerrado'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority === 'urgent' && 'Urgente'}
                      {ticket.priority === 'high' && 'Alta'}
                      {ticket.priority === 'medium' && 'Media'}
                      {ticket.priority === 'low' && 'Baja'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Botón de más opciones eliminado por solicitud */}
            </div>
          </div>
          {/* Participantes compactos */}
          {!ticketId === PRIVATE_CHAT_ID && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span>Por: <span className="font-medium text-gray-900">{creator?.name}</span></span>
                {assignee && (
                  <span>• Asignado: <span className="font-medium text-blue-600">{assignee.name}</span></span>
                )}
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {ticket.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Área de Mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-3"
      >
        {loading && ticketMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <span className="text-sm text-gray-600">Cargando mensajes...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error cargando mensajes</h3>
              <p className="text-red-600 max-w-sm mx-auto">{error}</p>
            </div>
          </div>
        ) : ticketMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Inicia la conversación!</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              Envía el primer mensaje para comenzar a gestionar esta solicitud. 
              El equipo municipal estará aquí para ayudarte.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mensaje de bienvenida compacto sin icono Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-3">
                <div />
                <div>
                  <h4 className="text-xs font-semibold text-blue-900 mb-1">Chat de la Solicitud</h4>
                  <p className="text-sm text-blue-700">
                    Comunícate directamente con el equipo municipal para gestionar esta solicitud.
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            {ticketMessages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                isFirst={index === 0 || ticketMessages[index - 1].senderId !== message.senderId}
                isLast={index === ticketMessages.length - 1 || ticketMessages[index + 1].senderId !== message.senderId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Preview de archivos adjuntos */}
      {attachments.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                <Paperclip className="w-4 h-4 mr-2" />
                <span className="truncate max-w-[120px]">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="ml-1 text-blue-500 hover:text-blue-700 font-bold text-sm leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de subida de archivos */}
      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* Input de mensaje */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <div className="p-3">
          <form onSubmit={handleSend} className="space-y-2">
            <div className="flex items-end space-x-2">
              {/* Botón de adjuntar */}
              <button
                type="button"
                onClick={() => setShowFileUpload(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={sending}
                title="Adjuntar archivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              {/* Input de mensaje */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensaje..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-sm placeholder-gray-500"
                  rows={1}
                  disabled={sending}
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                />
                
                <button
                  type="button"
                  className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Emojis"
                  disabled={sending}
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              
              {/* Botón de enviar */}
              <button
                type="submit"
                disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[40px] min-h-[40px] shadow-md hover:shadow-lg"
                title="Enviar mensaje"
              >
                {sending ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Texto de ayuda */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Enter para enviar • Shift+Enter nueva línea</span>
              <div className="flex items-center space-x-2">
                <button type="button" className="hover:text-gray-600 transition-colors" title="Mencionar usuario">@</button>
                <button type="button" className="hover:text-gray-600 transition-colors" title="Comandos">/</button>
                <button type="button" className="hover:text-gray-600 transition-colors" title="Formato">**</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}