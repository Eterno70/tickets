import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { useChat } from '../../contexts/ChatContext';
import { ChatMessage as ChatMessageType, FileAttachment } from '../../types';
import { Download, Eye, FileText, Image, Archive, MoreVertical, Trash2, Reply, Heart, Copy, Edit, X, ZoomIn, RotateCw } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { supabase } from '../../lib/supabase';

interface ChatMessageProps {
  message: ChatMessageType;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ChatMessage({ message, isFirst = false, isLast = false }: ChatMessageProps) {
  const { currentUser } = useAuth();
  const { users } = useTickets();
  const { deleteMessage } = useChat();
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

  const sender = users.find(u => u.id === message.senderId);
  const isOwnMessage = currentUser?.id === message.senderId;
  const canDelete = isOwnMessage || currentUser?.role === 'technician' || currentUser?.role === 'admin';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFullTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('video/')) return <Archive className="w-5 h-5" />;
    if (type.includes('audio/')) return <Archive className="w-5 h-5" />;
    return <Archive className="w-5 h-5" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-700 border-green-200';
    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200';
    if (type.includes('video/')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (type.includes('audio/')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const canPreview = (type: string) => {
    return type.startsWith('image/') || type.includes('pdf') || type.includes('text');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (attachment: any) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!canDelete) {
      alert('No tienes permisos para eliminar este archivo');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      setDeletingAttachment(attachmentId);
      try {
        // Eliminar del array local
        let newAttachments: FileAttachment[] = [];
        if (message.attachments) {
          newAttachments = message.attachments.filter(att => att.id !== attachmentId);
          message.attachments = newAttachments;
        }

        // ACTUALIZAR EN LA BASE DE DATOS
        const { error } = await supabase
          .from('chat_messages')
          .update({ attachments: newAttachments })
          .eq('id', message.id);

        if (error) {
          alert('Error actualizando el mensaje en la base de datos: ' + error.message);
          return;
        }

        // Mostrar confirmación discreta sin alert que interrumpa
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Archivo eliminado';
        document.body.appendChild(notification);
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 2000);
      } catch (error) {
        console.error('Error deleting attachment:', error);
        // Mostrar error sin alert
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorNotification.textContent = 'Error al eliminar archivo';
        document.body.appendChild(errorNotification);
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 3000);
      } finally {
        setDeletingAttachment(null);
      }
    }
  };

  const handleDeleteMessage = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      deleteMessage(message.ticketId, message.id);
      setShowMenu(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
    alert('Mensaje copiado al portapapeles');
  };

  const handleLikeMessage = () => {
    setIsLiked(!isLiked);
  };

  const renderImagePreview = (attachment: any) => {
    return (
      <div className="relative group">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowPreview(attachment.id)}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIHN0cm9rZT0iIzlCOUJBMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LXNpemU9IjEyIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPHN2Zz4=';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative mb-3`}>
      <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        {!isOwnMessage && isLast && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-white font-medium">
              {sender?.name.charAt(0) || '?'}
            </span>
          </div>
        )}
        {!isOwnMessage && !isLast && (
          <div className="w-7 h-7 flex-shrink-0" />
        )}

        {/* Contenedor del mensaje */}
        <div className={`relative ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
          {/* Nombre del remitente (para primer mensaje en grupo) */}
          {!isOwnMessage && isFirst && (
            <div className="mb-1 ml-2">
              <span className="text-xs font-semibold text-gray-700">{sender?.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                {sender?.role === 'technician' ? 'Técnico' : sender?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          )}

          {/* Burbuja del mensaje */}
          <div className={`relative rounded-xl px-3 py-2 shadow-sm ${
            isOwnMessage 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
              : 'bg-white text-gray-900 border border-gray-200'
          } ${
            isFirst && isLast ? '' :
            isFirst ? (isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md') :
            isLast ? (isOwnMessage ? 'rounded-tr-md' : 'rounded-tl-md') :
            isOwnMessage ? 'rounded-r-md' : 'rounded-l-md'
          }`}>
            
            {/* Contenido del mensaje */}
            {message.content && (
              <div className="whitespace-pre-wrap break-words text-sm leading-normal">
                {message.content}
              </div>
            )}
            
            {/* Archivos adjuntos */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`${message.content ? 'mt-2' : ''} space-y-2`}>
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className="space-y-1">
                    {/* Vista previa de imagen */}
                    {attachment.type.startsWith('image/') && (
                      <div className="space-y-1">
                        {renderImagePreview(attachment)}
                        <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isOwnMessage 
                            ? 'border-blue-400 bg-blue-500 hover:bg-blue-400' 
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <div className="flex items-center flex-1 min-w-0">
                            <div className={`p-1 rounded mr-2 ${getFileTypeColor(attachment.type)}`}>
                              {getFileIcon(attachment.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-medium truncate ${
                                isOwnMessage ? 'text-white' : 'text-gray-900'
                              }`}>
                                {attachment.name}
                              </p>
                              <p className={`text-xs ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => setShowPreview(attachment.id)}
                              className={`p-1 rounded transition-colors ${
                                isOwnMessage 
                                  ? 'hover:bg-blue-400 text-blue-100' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="Vista previa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownload(attachment)}
                              className={`p-1 rounded transition-colors ${
                                isOwnMessage 
                                  ? 'hover:bg-blue-400 text-blue-100' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="Descargar"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={deletingAttachment === attachment.id}
                                className={`p-1 rounded transition-colors ${
                                  isOwnMessage 
                                    ? 'hover:bg-red-500 text-blue-100' 
                                    : 'hover:bg-red-100 text-red-600'
                                } disabled:opacity-50`}
                                title="Eliminar archivo"
                              >
                                {deletingAttachment === attachment.id ? (
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Archivos que no son imágenes */}
                    {!attachment.type.startsWith('image/') && (
                      <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isOwnMessage 
                          ? 'border-blue-400 bg-blue-500 hover:bg-blue-400' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={`p-1.5 rounded mr-2 ${getFileTypeColor(attachment.type)}`}>
                            {getFileIcon(attachment.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${
                              isOwnMessage ? 'text-white' : 'text-gray-900'
                            }`}>
                              {attachment.name}
                            </p>
                            <p className={`text-xs ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatFileSize(attachment.size)} • {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {canPreview(attachment.type) && (
                            <button
                              onClick={() => setShowPreview(attachment.id)}
                              className={`p-1 rounded transition-colors ${
                                isOwnMessage 
                                  ? 'hover:bg-blue-400 text-blue-100' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="Vista previa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(attachment)}
                            className={`p-1 rounded transition-colors ${
                              isOwnMessage 
                                ? 'hover:bg-blue-400 text-blue-100' 
                                : 'hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Descargar"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              disabled={deletingAttachment === attachment.id}
                              className={`p-1 rounded transition-colors ${
                                isOwnMessage 
                                  ? 'hover:bg-red-500 text-blue-100' 
                                  : 'hover:bg-red-100 text-red-600'
                              } disabled:opacity-50`}
                              title="Eliminar archivo"
                            >
                              {deletingAttachment === attachment.id ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Acciones del mensaje */}
            <div className={`absolute top-1 ${isOwnMessage ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="flex items-center space-x-1">
                {/* Reacciones rápidas */}
                <button
                  onClick={handleLikeMessage}
                  className={`p-0.5 rounded-full transition-colors ${
                    isLiked 
                      ? 'text-red-500 bg-red-50' 
                      : isOwnMessage 
                        ? 'text-blue-100 hover:bg-blue-500' 
                        : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Me gusta"
                >
                  <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                {/* Más acciones */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1 rounded-full transition-colors ${
                    isOwnMessage 
                      ? 'text-blue-100 hover:bg-blue-500' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Más opciones"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>

              {/* Menú de acciones */}
              {showMenu && (
                <div className="absolute top-6 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                  <button
                    onClick={() => {}}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Reply className="w-3 h-3 mr-2" />
                    Responder
                  </button>
                  <button
                    onClick={handleCopyMessage}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copiar texto
                  </button>
                  {isOwnMessage && (
                    <button
                      onClick={() => {}}
                      className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Editar
                    </button>
                  )}
                  {canDelete && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleDeleteMessage}
                        className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Eliminar mensaje
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          {isLast && (
            <div className={`mt-0.5 text-xs text-gray-400 ${isOwnMessage ? 'text-right' : 'text-left'} px-1`}>
              <span title={formatFullTime(message.timestamp)}>
                {formatTime(message.timestamp)}
              </span>
              {isOwnMessage && (
                <span className="ml-1 text-blue-500">✓✓</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de vista previa de archivo */}
      {showPreview && (
        (() => {
          const attachment = message.attachments?.find(a => a.id === showPreview);
          return attachment ? (
            <FilePreview
              attachment={attachment}
              onClose={() => setShowPreview(null)}
            />
          ) : null;
        })()
      )}

      {/* Overlay para cerrar menú al hacer clic fuera */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}