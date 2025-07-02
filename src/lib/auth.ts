// Servicio de autenticación con Supabase
import { supabase } from './supabase';
import type { User } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'technician' | 'admin';
  phone?: string;
  department?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export const authService = {
  // Sign in con Supabase
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Autenticando con Supabase:', email);
      
      // Buscar usuario en la base de datos
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        console.error('❌ Usuario no encontrado:', userError);
        return { user: null, error: 'Usuario no encontrado' };
      }

      // En un entorno real, aquí verificarías el hash de la contraseña
      // Por ahora, aceptamos cualquier contraseña para demo
      console.log('✅ Usuario encontrado en Supabase');

      // Actualizar estado online
      await supabase
        .from('users')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userData.id);

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        department: userData.department,
        isOnline: true,
        lastSeen: new Date()
      };
      
      console.log('✅ Autenticación exitosa:', user.name);
      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Error en autenticación:', error);
      return { user: null, error: 'Error inesperado al iniciar sesión' };
    }
  },

  // Sign out
  async signOut(userId: string): Promise<void> {
    try {
      console.log('🔐 Cerrando sesión...');
      
      // Actualizar estado offline
      await supabase
        .from('users')
        .update({ 
          is_online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId);
      
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔍 getCurrentUser - Verificando localStorage...');
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        console.log('ℹ️ getCurrentUser - No hay datos en localStorage');
        return null;
      }

      const userData = JSON.parse(storedUser);
      console.log('📊 getCurrentUser - Datos encontrados:', userData);
      
      // Verificar que el usuario aún existe en Supabase
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (error || !dbUser) {
        console.log('❌ Usuario no encontrado en Supabase, limpiando localStorage');
        localStorage.removeItem('currentUser');
        return null;
      }

      // Actualizar datos del usuario con información fresca de la BD
      const freshUser: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        phone: dbUser.phone,
        department: dbUser.department,
        isOnline: dbUser.is_online,
        lastSeen: new Date(dbUser.last_seen)
      };

      console.log('✅ getCurrentUser - Usuario válido encontrado:', freshUser.name);
      return freshUser;
    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  },

  // Crear usuario (solo para admins)
  async createUser(userData: Omit<AuthUser, 'id' | 'isOnline' | 'lastSeen'> & { password: string }): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Creando usuario en Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          department: userData.department,
          password_hash: userData.password, // En producción, hashear la contraseña
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando usuario:', error);
        return { user: null, error: error.message };
      }

      const newUser: AuthUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        department: data.department,
        isOnline: data.is_online,
        lastSeen: new Date(data.last_seen)
      };
      
      console.log('✅ Usuario creado en Supabase:', newUser.name);
      return { user: newUser, error: null };
    } catch (error: any) {
      console.error('❌ Error creando usuario:', error);
      return { user: null, error: error.message };
    }
  },

  // Cambiar contraseña
  async changePassword(userId: string, newPassword: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};