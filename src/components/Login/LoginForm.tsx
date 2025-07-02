import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../lib/database';
import { Mail, Lock, User, Loader, AlertCircle, Building } from 'lucide-react';
import { registrarAccionAuditoria } from '../../lib/audit';

export function LoginForm() {
  const { login, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(Date.now()); // Key para forzar re-render
  
  // Referencias para acceso directo a los inputs
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const success = await login(email.trim(), password);
      if (success) {
        // Registrar acción de auditoría de login
        registrarAccionAuditoria({
          user_id: success.id,
          user_name: success.name,
          action_type: 'login',
          details: { email: email.trim(), user_agent: navigator.userAgent }
        });
      } else {
        setError('Usuario no encontrado. Usa uno de los botones de acceso rápido.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Todos los campos obligatorios deben ser completados');
        return;
      }

      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Crear usuario con rol 'user'
      const newUser = await databaseService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'user', // Solo usuarios normales pueden registrarse
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        password: password
      });

      if (newUser) {
        // Registro exitoso, ahora hacer login automático
        const success = await login(email.trim(), password);
        if (success) {
          // El usuario será redirigido automáticamente por el contexto de auth
        } else {
          setError('Usuario creado pero error al iniciar sesión. Intenta iniciar sesión manualmente.');
        }
      }
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('Ya existe un usuario con este email. Intenta iniciar sesión.');
      } else {
        setError('Error al crear la cuenta. Intenta nuevamente.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const resetFormCompletely = () => {
    console.log('🧹 LIMPIEZA COMPLETA - Iniciando limpieza total de formulario...');
    
    // 1. Limpiar estados de React
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setDepartment('');
    setError('');
    
    // 2. Forzar re-render del formulario completo
    setFormKey(Date.now());
    
    // 3. Limpiar valores directamente en los inputs del DOM con múltiples intentos
    const clearInputs = () => {
      const allInputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"], input[type="tel"]');
      allInputs.forEach((input: any) => {
        if (input) {
          input.value = '';
          input.defaultValue = '';
          input.setAttribute('autocomplete', 'new-password');
          input.setAttribute('data-lpignore', 'true');
          input.setAttribute('data-form-type', 'other');
          input.removeAttribute('data-com.bitwarden.browser.user-edited');
        }
      });
      
      // Limpiar también el formulario completo
      if (formRef.current) {
        formRef.current.reset();
      }
    };
    
    // Ejecutar limpieza múltiples veces para asegurar efectividad
    clearInputs();
    setTimeout(clearInputs, 50);
    setTimeout(clearInputs, 100);
    setTimeout(clearInputs, 200);
    setTimeout(clearInputs, 500);
    
    console.log('✅ LIMPIEZA COMPLETA - Todos los campos han sido limpiados');
  };

  // Limpiar campos cuando el componente se monta (al cargar la página)
  useEffect(() => {
    console.log('🔄 LoginForm montado - Ejecutando limpieza inicial...');
    resetFormCompletely();
    
    // Limpiar también después de un breve delay para asegurar que el DOM esté listo
    const timeouts = [100, 300, 500, 1000].map(delay => 
      setTimeout(() => {
        resetFormCompletely();
      }, delay)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Escuchar evento de logout para limpiar campos
  useEffect(() => {
    const handleUserLoggedOut = () => {
      // Registrar acción de auditoría de logout
      if (email) {
        registrarAccionAuditoria({
          user_id: '', // No hay usuario activo, solo email
          user_name: '',
          action_type: 'logout',
          details: { email }
        });
      }
      resetFormCompletely();
    };

    // Escuchar el evento personalizado de logout
    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  // También limpiar campos cuando se cambia de modo
  const switchMode = () => {
    resetFormCompletely();
    setTimeout(() => {
      setIsRegisterMode(!isRegisterMode);
    }, 100);
  };

  const quickLogin = (credentials: { email: string; password: string }) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError(''); // Clear any previous errors
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Alcaldía Municipal de Cabañas Oeste</h2>
          <p className="text-lg text-gray-600 mb-2">Unidad de Informática</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm text-blue-700">
              {isRegisterMode ? 'Registro de Nuevo Usuario' : 'Sistema de Gestión para Soporte Técnico'}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 text-center">
              {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              {isRegisterMode 
                ? 'Completa los datos para crear tu cuenta de usuario'
                : 'Ingresa tus credenciales para acceder al sistema'
              }
            </p>
          </div>

          {/* Formulario con key única para forzar re-render completo */}
          <form 
            key={formKey}
            ref={formRef}
            onSubmit={isRegisterMode ? handleRegister : handleLogin} 
            className="space-y-6"
            autoComplete="off"
            data-lpignore="true"
          >
            {isRegisterMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <input
                    key={`name-${formKey}`}
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="Tu nombre completo"
                    required={isRegisterMode}
                    disabled={loginLoading}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  key={`email-${formKey}`}
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  placeholder={isRegisterMode ? "tu@email.com" : "tu@empresa.com"}
                  disabled={loginLoading}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  key={`password-${formKey}`}
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  placeholder={isRegisterMode ? "Mínimo 6 caracteres" : "••••••••"}
                  required
                  disabled={loginLoading}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              {isRegisterMode && (
                <p className="text-xs text-gray-500 mt-2">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Teléfono (opcional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input
                      key={`phone-${formKey}`}
                      ref={phoneRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      placeholder="+52 55 1234 5678"
                      disabled={loginLoading}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Departamento/Área (opcional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input
                      key={`department-${formKey}`}
                      ref={departmentRef}
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      placeholder="Ej: Servicios Públicos, Administración"
                      disabled={loginLoading}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 text-sm font-medium">Error de autenticación</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg"
            >
              {loginLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-3" />
                  {isRegisterMode ? 'Creando cuenta...' : 'Iniciando sesión...'}
                </>
              ) : (
                isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Switch between login and register */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-4">
            <button
              onClick={switchMode}
              disabled={loginLoading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isRegisterMode 
                ? '¿Ya tienes cuenta? Iniciar sesión' 
                : '¿No tienes cuenta? Registrarse'
              }
            </button>
            
            <Building className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              {isRegisterMode 
                ? 'Al registrarte, tendrás acceso como usuario para crear solicitudes'
                : 'Ingrese con sus credenciales asignadas'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}