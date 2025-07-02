import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, Save, Bell, Mail, Shield, Database, Palette } from 'lucide-react';

export function SystemSettings() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sound: true,
      desktop: false
    },
    system: {
      autoAssign: true,
      escalationTime: 24,
      workingHours: '09:00-18:00',
      timezone: 'America/Mexico_City'
    },
    security: {
      sessionTimeout: 30,
      passwordExpiry: 90,
      twoFactor: false,
      loginAttempts: 5
    },
    appearance: {
      theme: 'light',
      language: 'es',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    }
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const handleSave = () => {
    // Here you would save settings to backend
    console.log('Saving settings:', settings);
    alert('Configuración guardada exitosamente');
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Notificaciones por email</label>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Notificaciones push</label>
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => updateSetting('notifications', 'push', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Sonidos de notificación</label>
              <input
                type="checkbox"
                checked={settings.notifications.sound}
                onChange={(e) => updateSetting('notifications', 'sound', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Notificaciones de escritorio</label>
              <input
                type="checkbox"
                checked={settings.notifications.desktop}
                onChange={(e) => updateSetting('notifications', 'desktop', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Sistema</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Asignación automática</label>
              <input
                type="checkbox"
                checked={settings.system.autoAssign}
                onChange={(e) => updateSetting('system', 'autoAssign', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de escalación (horas)
              </label>
              <input
                type="number"
                value={settings.system.escalationTime}
                onChange={(e) => updateSetting('system', 'escalationTime', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horario laboral
              </label>
              <input
                type="text"
                value={settings.system.workingHours}
                onChange={(e) => updateSetting('system', 'workingHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona horaria
              </label>
              <select
                value={settings.system.timezone}
                onChange={(e) => updateSetting('system', 'timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="America/Mexico_City">Ciudad de México</option>
                <option value="America/New_York">Nueva York</option>
                <option value="Europe/Madrid">Madrid</option>
                <option value="Asia/Tokyo">Tokio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de sesión (minutos)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiración de contraseña (días)
              </label>
              <input
                type="number"
                value={settings.security.passwordExpiry}
                onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Autenticación de dos factores</label>
              <input
                type="checkbox"
                checked={settings.security.twoFactor}
                onChange={(e) => updateSetting('security', 'twoFactor', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intentos de login máximos
              </label>
              <input
                type="number"
                value={settings.security.loginAttempts}
                onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Apariencia</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select
                value={settings.appearance.language}
                onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de fecha
              </label>
              <select
                value={settings.appearance.dateFormat}
                onChange={(e) => updateSetting('appearance', 'dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de hora
              </label>
              <select
                value={settings.appearance.timeFormat}
                onChange={(e) => updateSetting('appearance', 'timeFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">24 horas</option>
                <option value="12h">12 horas (AM/PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}