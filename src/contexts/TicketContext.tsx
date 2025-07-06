import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { databaseService } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { Ticket, User } from '../types';
import { registrarAccionAuditoria } from '../lib/audit';

interface TicketContextType {
  tickets: Ticket[];
  users: User[];
  loading: boolean;
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  assignTicket: (ticketId: string, userId: string) => Promise<void>;
  getTicketsByUser: (userId: string) => Ticket[];
  getTicketsByAssignee: (userId: string) => Ticket[];
  addUser: (user: Omit<User, 'id' | 'isOnline' | 'lastSeen'> & { password?: string }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  pinTicket: (ticketId: string) => void;
  unpinTicket: (ticketId: string) => void;
  isTicketPinned: (ticketId: string) => boolean;
  getPinnedTickets: () => string[];
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedTickets, setPinnedTickets] = useState<string[]>([]);

  // Cargar tickets anclados desde localStorage al iniciar
  useEffect(() => {
    if (currentUser) {
      const key = `pinnedTickets_${currentUser.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setPinnedTickets(JSON.parse(stored));
      } else {
        setPinnedTickets([]);
      }
    }
  }, [currentUser]);

  // Guardar tickets anclados en localStorage cuando cambian
  useEffect(() => {
    if (currentUser) {
      const key = `pinnedTickets_${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(pinnedTickets));
    }
  }, [pinnedTickets, currentUser]);

  const pinTicket = (ticketId: string) => {
    setPinnedTickets(prev => prev.includes(ticketId) ? prev : [...prev, ticketId]);
  };

  const unpinTicket = (ticketId: string) => {
    setPinnedTickets(prev => prev.filter(id => id !== ticketId));
  };

  const isTicketPinned = (ticketId: string) => {
    return pinnedTickets.includes(ticketId);
  };

  const getPinnedTickets = () => pinnedTickets;

  // Suscribirse a cambios en tiempo real para tickets
  React.useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 TicketContext - Configurando escucha de eventos en tiempo real');

    const handleRealtimeTicket = (event: CustomEvent) => {
      const payload = event.detail;
      console.log('🔄 TicketContext - Evento de ticket en tiempo real recibido:', payload);

     if (payload.eventType === 'INSERT') {
  // Nuevo ticket creado
  const newTicket: Ticket = {
    id: payload.new.id,
    title: payload.new.title,
    description: payload.new.description,
    status: payload.new.status,
    priority: payload.new.priority,
    category: payload.new.category,
    createdBy: payload.new.created_by,
    assignedTo: payload.new.assigned_to,
    createdAt: new Date(payload.new.created_at),
    updatedAt: new Date(payload.new.updated_at),
    tags: payload.new.tags || [],
    attachments: payload.new.attachments || []
  };

  // ✅ VERIFICACIÓN ANTI-DUPLICADOS
  setTickets(prev => {
    const exists = prev.some(ticket => ticket.id === newTicket.id);
    if (exists) {
      console.log('🔄 Ticket ya existe, ignorando duplicado:', newTicket.id);
      return prev;
    }
    console.log('🔄 Agregando nuevo ticket:', newTicket.id);
    return [newTicket, ...prev];
  });
}
      else if (payload.eventType === 'UPDATE') {
        // Ticket actualizado
        setTickets(prev => prev.map(ticket => {
          if (ticket.id === payload.new.id) {
            return {
              ...ticket,
              title: payload.new.title,
              description: payload.new.description,
              status: payload.new.status,
              priority: payload.new.priority,
              category: payload.new.category,
              assignedTo: payload.new.assigned_to,
              updatedAt: new Date(payload.new.updated_at),
              tags: payload.new.tags || [],
              attachments: payload.new.attachments || []
            };
          }
          return ticket;
        }));
      }
      else if (payload.eventType === 'DELETE') {
        // Ticket eliminado
        setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id));
      }
    };

    window.addEventListener('realtimeTicket', handleRealtimeTicket as EventListener);

    return () => {
      window.removeEventListener('realtimeTicket', handleRealtimeTicket as EventListener);
    };
  }, [currentUser]);

  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 TicketContext - Cargando datos en modo local...', { 
        currentUser: currentUser?.email
      });
      
      const [ticketsData, usersData] = await Promise.all([
        databaseService.getTickets(),
        databaseService.getUsers()
      ]);
      
      console.log('📊 TicketContext - Datos recibidos:', { 
        tickets: ticketsData.length, 
        usuarios: usersData.length,
        usuariosDetalle: usersData.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
      });
      
      setTickets(ticketsData);
      setUsers(usersData);
      console.log('✅ TicketContext - Estado actualizado:', { 
        ticketsEnEstado: ticketsData.length, 
        usuariosEnEstado: usersData.length 
      });
    } catch (error) {
      console.error('❌ TicketContext - Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      console.log('🔄 TicketContext - Usuario detectado, iniciando carga...', currentUser.email);
      loadData();
    } else {
      console.log('⚠️ TicketContext - No hay usuario, esperando...');
      setLoading(false);
    }
  }, [currentUser]);

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      if (!currentUser) {
        console.error('No hay usuario actual');
        return null;
      }

      console.log('🎫 Creando ticket...');
      
      const newTicketData = {
        ...ticketData,
        createdBy: currentUser.id,
        attachments: []
      };
      
      const newTicket = await databaseService.createTicket(newTicketData);
      
      if (newTicket) {
        // Add to local state immediately
        setTickets(prev => [newTicket, ...prev]);
        // Registrar acción de auditoría
        if (currentUser) {
          registrarAccionAuditoria({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'crear_ticket',
            ticket_id: newTicket.id,
            details: { titulo: newTicket.title, descripcion: newTicket.description, prioridad: newTicket.priority, categoria: newTicket.category }
          });
        }
        // Agregar información del creador para las notificaciones
        const ticketWithCreator = {
          ...newTicket,
          createdByName: currentUser?.name || ''
        };
        // Dispatch event for notifications - with a slight delay to ensure it's processed
        setTimeout(() => {
          console.log('🔔 Dispatching ticketCreated event for notifications');
          const event = new CustomEvent('ticketCreated', { 
            detail: { ticket: ticketWithCreator } 
          });
          window.dispatchEvent(event);
        }, 100);
        console.log('✅ Ticket creado:', newTicket.title);
      }
      
      return newTicket;
    } catch (error) {
      console.error('❌ Error creando ticket:', error);
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      console.log('🎫 Actualizando ticket:', id);
      
      const success = await databaseService.updateTicket(id, updates);
      
      if (success) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === id 
            ? { ...ticket, ...updates, updatedAt: new Date() }
            : ticket
        ));
        // Registrar acción de auditoría
        if (currentUser) {
          registrarAccionAuditoria({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'actualizar_ticket',
            ticket_id: id,
            details: { updates }
          });
          // Auditar cambio de estado
          if (updates.status) {
            registrarAccionAuditoria({
              user_id: currentUser.id,
              user_name: currentUser.name,
              action_type: 'cambio_estado_ticket',
              ticket_id: id,
              details: { nuevo_estado: updates.status }
            });
          }
        }
        // Disparar eventos para notificaciones
        if (updates.assignedTo) {
          const ticket = tickets.find(t => t.id === id);
          if (ticket) {
            const event = new CustomEvent('ticketAssigned', { 
              detail: { 
                ticketId: id, 
                assignedTo: updates.assignedTo, 
                ticketTitle: ticket.title 
              } 
            });
            window.dispatchEvent(event);
          }
        }
        
        console.log('✅ Ticket actualizado');
      }
    } catch (error) {
      console.error('❌ Error actualizando ticket:', error);
      throw error;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      console.log('🎫 Eliminando ticket:', id);
      // 1. Eliminar todos los registros de audit_logs relacionados con el ticket
      await databaseService.deleteAuditLogsByTicketId(id);
      // 2. Insertar un registro de auditoría indicando que el ticket fue eliminado
      if (currentUser) {
        await databaseService.createAuditLog({
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'eliminar_ticket',
          ticket_id: null,
          details: { mensaje: `El ticket con ID ${id} fue eliminado por ${currentUser.name} el ${new Date().toLocaleString()}` }
        });
      }
      // 3. Eliminar el ticket
      const success = await databaseService.deleteTicket(id);
      if (success) {
        setTickets(prev => prev.filter(ticket => ticket.id !== id));
        const event = new CustomEvent('ticketDeleted', { detail: { ticketId: id } });
        window.dispatchEvent(event);
        console.log('✅ Ticket eliminado');
      }
    } catch (error) {
      console.error('❌ Error eliminando ticket:', error);
      throw error;
    }
  };

  const assignTicket = async (ticketId: string, userId: string) => {
    await updateTicket(ticketId, { assignedTo: userId });
    // Registrar acción de auditoría de asignación de ticket
    if (currentUser) {
      registrarAccionAuditoria({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action_type: 'asignar_ticket',
        ticket_id: ticketId,
        details: { asignado_a: userId }
      });
    }
  };

  const getTicketsByUser = (userId: string) => {
    return tickets.filter(ticket => ticket.createdBy === userId);
  };

  const getTicketsByAssignee = (userId: string) => {
    return tickets.filter(ticket => ticket.assignedTo === userId);
  };

  const addUser = async (userData: Omit<User, 'id' | 'isOnline' | 'lastSeen'> & { password?: string }) => {
    try {
      console.log('👤 Creando usuario...');
      const newUser = await databaseService.createUser(userData);
      if (newUser) {
        setUsers(prev => [newUser, ...prev]);
        // Registrar acción de auditoría
        if (currentUser) {
          registrarAccionAuditoria({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'crear_usuario',
            details: { usuario_creado: newUser.id, datos: newUser }
          });
        }
        console.log('✅ Usuario creado:', newUser.name);
      }
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      console.log('👤 Actualizando usuario:', id);
      const success = await databaseService.updateUser(id, updates);
      if (success) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, ...updates } : user
        ));
        // Registrar acción de auditoría
        if (currentUser) {
          registrarAccionAuditoria({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'actualizar_usuario',
            details: { usuario_actualizado: id, cambios: updates }
          });
          // Auditar cambio de rol
          if (updates.role) {
            registrarAccionAuditoria({
              user_id: currentUser.id,
              user_name: currentUser.name,
              action_type: 'cambio_rol_usuario',
              details: { usuario_actualizado: id, nuevo_rol: updates.role }
            });
          }
        }
        console.log('✅ Usuario actualizado');
      }
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      console.log('👤 Eliminando usuario:', id);
      const success = await databaseService.deleteUser(id);
      if (success) {
        setUsers(prev => prev.filter(user => user.id !== id));
        // Registrar acción de auditoría
        if (currentUser) {
          registrarAccionAuditoria({
            user_id: currentUser.id,
            user_name: currentUser.name,
            action_type: 'eliminar_usuario',
            details: { usuario_eliminado: id }
          });
        }
        console.log('✅ Usuario eliminado');
      }
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      throw error;
    }
  };

  return (
    <TicketContext.Provider value={{
      tickets,
      users,
      loading,
      createTicket,
      updateTicket,
      deleteTicket,
      assignTicket,
      getTicketsByUser,
      getTicketsByAssignee,
      addUser,
      updateUser,
      deleteUser,
      pinTicket,
      unpinTicket,
      isTicketPinned,
      getPinnedTickets
    }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}