import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TicketProvider } from './contexts/TicketContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginForm } from './components/Login/LoginForm';
import { initializeRealtimeSubscriptions } from './lib/supabase';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardStats } from './components/Dashboard/DashboardStats';
import { ModernAdminPanel } from './components/Admin/ModernAdminPanel';
import { TicketList } from './components/Tickets/TicketList';
import { ChatList } from './components/Chat/ChatList';
import { ChatWindow } from './components/Chat/ChatWindow';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { UserManagement } from './components/Users/UserManagement';
import { ReportsAnalytics } from './components/Reports/ReportsAnalytics';
import { SystemSettings } from './components/Settings/SystemSettings';
import { DatabaseStatus } from './components/Admin/DatabaseStatus';
import AuditPanel from './components/Admin/AuditPanel';

function App() {
  function AppContent() {
    const { currentUser, loading } = useAuth();
    const [activeView, setActiveView] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    // Inicializar suscripciones en tiempo real cuando el usuario inicia sesión
    React.useEffect(() => {
      if (currentUser) {
        console.log('🔄 App - Usuario autenticado, inicializando suscripciones en tiempo real');
        initializeRealtimeSubscriptions();
      }
    }, [currentUser]);

    // Solicitar permiso de notificaciones al iniciar sesión
    React.useEffect(() => {
      if (currentUser && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }, [currentUser]);

    // Set default view based on user role
    React.useEffect(() => {
      if (currentUser && !activeView) {
        switch (currentUser.role) {
          case 'user':
            setActiveView('tickets'); // Users go directly to their tickets
            break;
          case 'technician':
            setActiveView('tickets'); // Technicians go to their assigned tickets
            break;
          case 'admin':
            setActiveView('dashboard'); // Admins go to dashboard overview
            break;
          default:
            setActiveView('dashboard');
        }
      }
    }, [currentUser, activeView]);

    // Listen for admin panel navigation events
    React.useEffect(() => {
      const handleAdminNavigation = (event: CustomEvent<{ section: string }>) => {
        const { section } = event.detail;
        setActiveView(section);
      };

      window.addEventListener('navigateToAdminSection', handleAdminNavigation as EventListener);
      
      // Escuchar evento global para abrir chat automáticamente
      const handleNavigateToChat = (event: CustomEvent<{ ticketId: string }>) => {
        setSelectedTicketId(event.detail.ticketId);
        setActiveView('chat');
      };
      window.addEventListener('navigateToChat', handleNavigateToChat as EventListener);

      return () => {
        window.removeEventListener('navigateToAdminSection', handleAdminNavigation as EventListener);
        window.removeEventListener('navigateToChat', handleNavigateToChat as EventListener);
      };
    }, []);

    // Show loading screen while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto animate-pulse shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">TicketFlow</h2>
            <p className="text-lg text-gray-600 mb-4">Iniciando sistema...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return <LoginForm />;
    }

    const handleTicketClick = (ticketId: string) => {
      setSelectedTicketId(ticketId);
      setActiveView('chat');
    };

    const handleNavigateToTicket = (ticketId: string) => {
      setSelectedTicketId(ticketId);
      setActiveView('chat');
    };
    
    const handleDeleteTicket = () => {
      // Refresh the ticket list after deletion
      if (activeView === 'tickets') {
        // Force re-render by updating a state
        setActiveView('tickets');
      }
    };
    
    const renderMainContent = () => {
      switch (activeView) {
        case 'dashboard':
          // Show modern admin panel for admins, regular dashboard for others
          if (currentUser.role === 'admin') {
            return <ModernAdminPanel />;
          }
          return (
            <div className="space-y-6">
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Nuevo ticket creado</p>
                        <p className="text-xs text-gray-600">Hace 15 minutos</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Ticket resuelto</p>
                        <p className="text-xs text-gray-600">Hace 1 hora</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Ticket actualizado</p>
                        <p className="text-xs text-gray-600">Hace 2 horas</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tiempo promedio de resolución</span>
                        <span className="font-medium">2.5 días</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Satisfacción del cliente</span>
                        <span className="font-medium">4.8/5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tickets resueltos este mes</span>
                        <span className="font-medium">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        
        case 'tickets':
          return <TicketList onTicketClick={handleTicketClick} onDeleteTicket={handleDeleteTicket} />;
        
        case 'chat':
          return (
            <div className="flex h-full bg-gray-50">
              <ChatList 
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
              <div className="flex-1 min-w-0 bg-white border-l border-gray-200">
                {selectedTicketId ? (
                  <ChatWindow ticketId={selectedTicketId} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-gray-900 mb-1">Selecciona una conversación</p>
                      <p className="text-sm text-gray-600">Elige un ticket de la lista para comenzar a chatear</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        
        case 'notifications':
          return <NotificationCenter onTicketClick={handleTicketClick} />;
        
        case 'users':
          return <UserManagement />;
        
        case 'reports':
          return <ReportsAnalytics />;
        
        case 'settings':
          return <SystemSettings />;
        
        case 'database-status':
          return <DatabaseStatus />;
        
        case 'audit':
          return <AuditPanel />;
        
        case 'private-chat':
          // Solo admin y técnicos pueden ver este chat
          if (currentUser.role === 'admin' || currentUser.role === 'technician') {
            // Usamos un ID especial para el canal privado
            const PRIVATE_CHAT_ID = '00000000-0000-0000-0000-000000000999';
            return (
              <div className="flex h-full bg-gray-50">
                {/* No hay lista de tickets, solo un canal privado */}
                <div className="flex-1 min-w-0 bg-white border-l border-gray-200">
                  <ChatWindow ticketId={PRIVATE_CHAT_ID} />
                </div>
              </div>
            );
          }
          // Si no es admin ni técnico, no mostrar nada
          return null;
        
        default:
          return currentUser.role === 'admin' ? <ModernAdminPanel /> : <DashboardStats />;
      }
    };

    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onNavigateToTicket={handleNavigateToTicket} />
          <main className="flex-1 overflow-hidden">
            {activeView === 'chat' ? (
              // Chat view needs special handling for its layout - no padding, full height
              <div className="h-full">
                {renderMainContent()}
              </div>
            ) : activeView === 'dashboard' && currentUser.role === 'admin' ? (
              // Modern admin panel needs full height without padding
              <div className="h-full overflow-y-auto">
                {renderMainContent()}
              </div>
            ) : (
              // All other views get scrollable container with padding
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  {renderMainContent()}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <TicketProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </TicketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;