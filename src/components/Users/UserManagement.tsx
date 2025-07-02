import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { User } from '../../types';
import { Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Mail, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function UserManagement() {
  const { currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser, loading } = useTickets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Debug: Log users data
  React.useEffect(() => {
    console.log('👥 UserManagement - Estado:', {
      currentUser: currentUser?.email,
      usersCount: users.length,
      loading,
      hasUsers: users.length > 0,
      firstUser: users[0]?.name || 'N/A'
    });
  }, [users, currentUser, loading]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'technician': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
      case 'user': return 'Usuario';
      default: return role;
    }
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      console.log('💾 Guardando usuario:', userData);
      
      if (editingUser) {
        // Actualizar usuario existente
        await updateUser(editingUser.id, userData);
      } else {
        // Crear nuevo usuario
        if (!userData.password) {
          throw new Error('La contraseña es requerida para nuevos usuarios');
        }
        await addUser(userData);
      }
      
      setShowCreateModal(false);
      setEditingUser(null);
      
      // Mostrar mensaje de éxito
      const successMessage = editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';
      
      // Crear notificación de éxito temporal
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = successMessage;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="technician">Técnicos</option>
              <option value="user">Usuarios</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando usuarios...</h3>
            <p className="text-gray-600">Obteniendo datos del sistema local</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {user.isOnline ? (
                    <div className="flex items-center text-green-600">
                      <UserCheck className="w-5 h-5 mr-1" />
                      <span className="text-xs font-medium">En línea</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <UserX className="w-5 h-5 mr-1" />
                      <span className="text-xs font-medium">Desconectado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.department && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Departamento:</span> {user.department}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
                {user.isOnline ? (
                  <span className="text-green-600 font-medium">● Actualmente en línea</span>
                ) : (
                  <span>Última actividad: {new Intl.DateTimeFormat('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(user.lastSeen)}</span>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center font-medium"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`)) {
                      deleteUser(user.id);
                    }
                  }}
                  className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center font-medium"
                  disabled={user.id === currentUser.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {users.length === 0 ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Search className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {users.length === 0 ? 'No hay usuarios en el sistema' : 'No se encontraron usuarios'}
          </h3>
          <p className="text-gray-600">
            {users.length === 0 
              ? 'Crea el primer usuario para comenzar'
              : 'Intenta ajustar los filtros de búsqueda o crear un nuevo usuario'
            }
          </p>
        </div>
      )}

      {/* Debug info para desarrollo */}

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: (user: Partial<User> & { password?: string }) => Promise<void>;
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    phone: user?.phone || '',
    department: user?.department || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Only include password if it's provided (for new users or password changes)
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        department: formData.department
      };
      
      if (formData.password) {
        userData.password = formData.password;
      }
      
      await onSave(userData);
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Error al guardar el usuario';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="user">Usuario</option>
                <option value="technician">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!user}
                  placeholder={user ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!user && (
                <p className="text-xs text-gray-500 mt-2">
                  Ingrese una contraseña segura para el nuevo usuario
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                placeholder="Ej: Servicios Públicos, Administración, Obras"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}