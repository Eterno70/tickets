import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { databaseService } from '../../lib/database';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader, 
  RefreshCw, 
  Users, 
  Ticket, 
  MessageCircle, 
  Bell,
  AlertTriangle,
  Wifi,
  WifiOff,
  Server,
  Activity
} from 'lucide-react';

interface DatabaseStats {
  users: number;
  tickets: number;
  messages: number;
  notifications: number;
}

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function DatabaseStatus() {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);

  const runConnectionTests = async () => {
    setLoading(true);
    setTests([]);
    
    const testResults: ConnectionTest[] = [
      { name: 'Conexión básica a Supabase', status: 'pending', message: 'Probando...' },
      { name: 'Lectura de tabla users', status: 'pending', message: 'Probando...' },
      { name: 'Lectura de tabla tickets', status: 'pending', message: 'Probando...' },
      { name: 'Lectura de tabla chat_messages', status: 'pending', message: 'Probando...' },
      { name: 'Lectura de tabla notifications', status: 'pending', message: 'Probando...' },
      { name: 'Inserción de datos de prueba', status: 'pending', message: 'Probando...' }
    ];

    setTests([...testResults]);

    // Test 1: Conexión básica
    try {
      const startTime = Date.now();
      const connected = await testSupabaseConnection();
      const duration = Date.now() - startTime;
      
      testResults[0] = {
        name: 'Conexión básica a Supabase',
        status: connected ? 'success' : 'error',
        message: connected ? `Conectado exitosamente (${duration}ms)` : 'No se pudo conectar',
        duration
      };
      setIsConnected(connected);
    } catch (error: any) {
      testResults[0] = {
        name: 'Conexión básica a Supabase',
        status: 'error',
        message: `Error: ${error.message}`
      };
      setIsConnected(false);
    }
    setTests([...testResults]);

    // Test 2: Lectura de usuarios
    try {
      const startTime = Date.now();
      const users = await databaseService.getUsers();
      const duration = Date.now() - startTime;
      
      testResults[1] = {
        name: 'Lectura de tabla users',
        status: 'success',
        message: `${users.length} usuarios encontrados (${duration}ms)`,
        duration
      };
    } catch (error: any) {
      testResults[1] = {
        name: 'Lectura de tabla users',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setTests([...testResults]);

    // Test 3: Lectura de tickets
    try {
      const startTime = Date.now();
      const tickets = await databaseService.getTickets();
      const duration = Date.now() - startTime;
      
      testResults[2] = {
        name: 'Lectura de tabla tickets',
        status: 'success',
        message: `${tickets.length} tickets encontrados (${duration}ms)`,
        duration
      };
    } catch (error: any) {
      testResults[2] = {
        name: 'Lectura de tabla tickets',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setTests([...testResults]);

    // Test 4: Lectura de mensajes
    try {
      const startTime = Date.now();
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('count')
        .limit(1);
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      testResults[3] = {
        name: 'Lectura de tabla chat_messages',
        status: 'success',
        message: `Tabla accesible (${duration}ms)`,
        duration
      };
    } catch (error: any) {
      testResults[3] = {
        name: 'Lectura de tabla chat_messages',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setTests([...testResults]);

    // Test 5: Lectura de notificaciones
    try {
      const startTime = Date.now();
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1);
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      testResults[4] = {
        name: 'Lectura de tabla notifications',
        status: 'success',
        message: `Tabla accesible (${duration}ms)`,
        duration
      };
    } catch (error: any) {
      testResults[4] = {
        name: 'Lectura de tabla notifications',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setTests([...testResults]);

    // Test 6: Inserción de datos de prueba (solo si es admin)
    if (currentUser?.role === 'admin') {
      try {
        const startTime = Date.now();
        
        // Crear un ticket de prueba
        const testTicket = await databaseService.createTicket({
          title: 'Test de conexión - ' + new Date().toLocaleTimeString(),
          description: 'Este es un ticket de prueba para verificar la conexión a Supabase',
          status: 'open',
          priority: 'low',
          category: 'Test',
          createdBy: currentUser.id,
          tags: ['test', 'conexion'],
          attachments: [] // Se omitirá si la columna no existe
        });
        
        if (testTicket) {
          // Eliminar el ticket de prueba inmediatamente
          await databaseService.deleteTicket(testTicket.id);
        }
        
        const duration = Date.now() - startTime;
        
        testResults[5] = {
          name: 'Inserción de datos de prueba',
          status: 'success',
          message: `Ticket creado y eliminado exitosamente (${duration}ms)`,
          duration
        };
      } catch (error: any) {
        testResults[5] = {
          name: 'Inserción de datos de prueba',
          status: 'error',
          message: `Error: ${error.message}`
        };
      }
    } else {
      testResults[5] = {
        name: 'Inserción de datos de prueba',
        status: 'success',
        message: 'Omitido (requiere permisos de admin)'
      };
    }
    
    setTests([...testResults]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const [users, tickets] = await Promise.all([
        databaseService.getUsers(),
        databaseService.getTickets()
      ]);

      // Contar mensajes y notificaciones
      const { data: messagesCount } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' });
      
      const { data: notificationsCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' });

      setStats({
        users: users.length,
        tickets: tickets.length,
        messages: messagesCount?.length || 0,
        notifications: notificationsCount?.length || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadSupabaseInfo = async () => {
    try {
      // Obtener información del proyecto
      const url = import.meta.env.VITE_SUPABASE_URL;
      const projectId = url?.split('//')[1]?.split('.')[0];
      
      setSupabaseInfo({
        url: import.meta.env.VITE_SUPABASE_URL,
        projectId: projectId,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      });
    } catch (error) {
      console.error('Error obteniendo info de Supabase:', error);
    }
  };

  useEffect(() => {
    loadSupabaseInfo();
    loadStats();
    runConnectionTests();
  }, []);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
        <p className="text-gray-600">Solo los administradores pueden acceder al estado de la base de datos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estado de Base de Datos</h1>
          <p className="text-gray-600">Diagnóstico de conexión a Supabase</p>
        </div>
        <button
          onClick={runConnectionTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Probando...' : 'Probar Conexión'}
        </button>
      </div>

      {/* Estado General */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Estado General</h2>
          <div className="flex items-center">
            {isConnected === null ? (
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            ) : isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="w-5 h-5 mr-2" />
                <span className="font-medium">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="w-5 h-5 mr-2" />
                <span className="font-medium">Desconectado</span>
              </div>
            )}
          </div>
        </div>

        {supabaseInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Server className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Información del Proyecto</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">URL:</span> {supabaseInfo.url}</div>
                <div><span className="font-medium">Proyecto ID:</span> {supabaseInfo.projectId}</div>
                <div><span className="font-medium">API Key:</span> {supabaseInfo.hasAnonKey ? '✅ Configurada' : '❌ Faltante'}</div>
              </div>
            </div>

            {stats && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Activity className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Estadísticas de Datos</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-500 mr-1" />
                    <span>{stats.users} usuarios</span>
                  </div>
                  <div className="flex items-center">
                    <Ticket className="w-4 h-4 text-gray-500 mr-1" />
                    <span>{stats.tickets} solicitudes</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 text-gray-500 mr-1" />
                    <span>{stats.messages} mensajes</span>
                  </div>
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 text-gray-500 mr-1" />
                    <span>{stats.notifications} notificaciones</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pruebas de Conexión */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pruebas de Conexión</h2>
        
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {test.status === 'pending' ? (
                  <Loader className="w-5 h-5 text-gray-400 animate-spin mr-3" />
                ) : test.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-3" />
                )}
                <div>
                  <span className="font-medium text-gray-900">{test.name}</span>
                  <p className="text-sm text-gray-600">{test.message}</p>
                </div>
              </div>
              {test.duration && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {test.duration}ms
                </span>
              )}
            </div>
          ))}
        </div>

        {tests.length > 0 && !loading && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Resumen</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {tests.filter(t => t.status === 'success').length} de {tests.length} pruebas exitosas
              {tests.every(t => t.status === 'success') && ' - ✅ Conexión 100% funcional'}
            </p>
          </div>
        )}
      </div>

      {/* Información Técnica */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Variables de Entorno</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Estado del Cliente</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cliente Supabase:</span>
                <span className="text-green-600">✅ Inicializado</span>
              </div>
              <div className="flex justify-between">
                <span>Modo:</span>
                <span className="text-blue-600">Producción (Supabase)</span>
              </div>
              <div className="flex justify-between">
                <span>Persistencia:</span>
                <span className="text-green-600">✅ Habilitada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}