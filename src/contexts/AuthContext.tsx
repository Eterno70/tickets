import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../lib/auth';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        console.log('🔍 AuthContext - Verificando usuario almacenado...');
        const user = await authService.getCurrentUser();
        if (user) {
          console.log('✅ AuthContext - Usuario encontrado en localStorage:', user);
          setCurrentUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            department: user.department,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen
          });
        } else {
          console.log('ℹ️ AuthContext - No hay usuario almacenado en localStorage');
        }
      } catch (error) {
        console.error('❌ AuthContext - Error verificando usuario:', error);
        // Limpiar localStorage corrupto
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🔐 Intentando iniciar sesión con datos demo...');
      const { user, error } = await authService.signIn(email, password);
      
      if (error) {
        console.error('❌ Error de login:', error);
        return false;
      }
      
      if (user) {
        const userData: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen
        };
        
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('✅ Login exitoso, usuario guardado en localStorage:', user.name);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error inesperado en login:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🔐 Logout - Cerrando sesión...');
    if (currentUser) {
      await authService.signOut(currentUser.id);
    }
    
    // Limpiar estado y localStorage
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    
    // Limpiar campos del formulario de login con múltiples intentos
    setTimeout(() => {
      const event = new CustomEvent('userLoggedOut');
      window.dispatchEvent(event);
    }, 100);
    
    // Segundo intento para asegurar limpieza
    setTimeout(() => {
      const event = new CustomEvent('userLoggedOut');
      window.dispatchEvent(event);
    }, 500);
    
    // Limpiar autocompletado del navegador directamente
    setTimeout(() => {
      const allInputs = document.querySelectorAll('input[type="email"], input[type="password"]');
      allInputs.forEach((input: any) => {
        if (input) {
          input.value = '';
          input.defaultValue = '';
          input.setAttribute('autocomplete', 'off');
        }
      });
    }, 200);
    
    console.log('✅ Logout - Sesión cerrada y localStorage limpiado');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}