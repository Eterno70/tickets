# TicketFlow - Sistema de Gestión de Tickets

Sistema completo de gestión de tickets con chat en tiempo real, notificaciones y panel de administración conectado a Supabase.

## 🚀 Características
## 
- **Autenticación con Supabase** 
- **Chat en tiempo real** entre usuarios y técnicos
- **Notificaciones en tiempo real** con sonido
- **Panel de administrador** completo
- **Gestión de usuarios** con diferentes roles
- **Sistema de tickets** con estados y prioridades
- **Reportes y análisis** 
- **Responsive design** para todos los dispositivos
- **Base de datos PostgreSQL** con Supabase

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + Custom Users Table
- **Tiempo real**: Supabase Realtime
- **Iconos**: Lucide React

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ticketflow
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env con las credenciales de Supabase
VITE_SUPABASE_URL=https://wfykgzmaijulvvdwexcm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeWtnem1haWp1bHZ2ZHdleGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzgxOTgsImV4cCI6MjA2NjcxNDE5OH0.xajVg18SWFeI3I1RIqS4keY64fz6w4ap566fPCaAE68
```

4. **Iniciar el proyecto**
```bash
npm run dev
```

## 🔧 Configuración de Base de Datos

### Supabase (Actual)
La aplicación está conectada a Supabase PostgreSQL:
- **Proyecto**: ticketsBolt
- **URL**: https://wfykgzmaijulvvdwexcm.supabase.co
- **Datos persistentes** en PostgreSQL
- **Autenticación personalizada** con tabla users
- **Tiempo real** con Supabase Realtime

### Estructura de Tablas

La aplicación utiliza las siguientes tablas en Supabase:

1. **users** - Gestión de usuarios
2. **tickets** - Sistema de tickets
3. **chat_messages** - Mensajes del chat
4. **notifications** - Sistema de notificaciones

## 👥 Usuarios del Sistema

Los usuarios se gestionan directamente en la base de datos de Supabase. Puedes crear usuarios desde el panel de administración de la aplicación.

### Roles Disponibles:
- **user**: Usuario final que puede crear tickets
- **technician**: Técnico que puede resolver tickets asignados
- **admin**: Administrador con acceso completo

## 🔔 Características del Sistema

- **Notificaciones en tiempo real** desde Supabase
- **Sonido de notificación** personalizado
- **Notificaciones del navegador** con permisos
- **Contador de no leídas** en tiempo real
- **Mensajes instantáneos** con Supabase
- **Adjuntar archivos** con vista previa
- **Estados de lectura** y timestamps
- **Eliminación de mensajes** con permisos
- **Vista previa de archivos** integrada

## 📊 Funcionalidades Principales

### Dashboard
- Estadísticas en tiempo real desde Supabase
- Gráficos de rendimiento
- Actividad reciente
- Métricas por rol

### Gestión de Tickets
- Crear, editar y eliminar tickets
- Asignación automática o manual
- Estados: Abierto, En Progreso, Resuelto, Cerrado
- Prioridades: Baja, Media, Alta, Urgente
- Categorías personalizables
- Tags y filtros avanzados

### Gestión de Usuarios
- Crear usuarios con diferentes roles
- Actualizar perfiles y permisos
- Estado en línea/desconectado
- Departamentos y información de contacto

### Reportes
- Estadísticas de resolución
- Rendimiento por técnico
- Análisis de categorías
- Exportación de datos

## 🔒 Seguridad

- **Autenticación con Supabase** PostgreSQL
- **Validación de permisos** por roles
- **Datos seguros** en Supabase
- **Conexión SSL** encriptada
- **Row Level Security** (RLS) en Supabase

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm run preview
```

### Variables de Entorno Requeridas
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 📱 Responsive Design

- **Mobile First** approach
- **Breakpoints optimizados** para todos los dispositivos
- **Navegación adaptativa** según el tamaño de pantalla
- **Componentes flexibles** que se adaptan automáticamente

## 🎨 Diseño

- **Tailwind CSS** para estilos consistentes
- **Componentes reutilizables** y modulares
- **Tema coherente** con colores y tipografía
- **Animaciones suaves** y micro-interacciones
- **Iconografía consistente** con Lucide React

## 💾 Base de Datos Supabase

✅ **Conectado a Supabase PostgreSQL**

La aplicación está completamente integrada con Supabase:
- ✅ Conexión configurada y funcionando
- ✅ Tablas creadas en Supabase
- ✅ Autenticación personalizada
- ✅ Tiempo real con Supabase Realtime
- ✅ Todas las operaciones CRUD funcionando

## 🔧 Configuración de Supabase

### Tablas Requeridas

Asegúrate de que tu proyecto de Supabase tenga las siguientes tablas:

```sql
-- Tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'technician', 'admin')),
  phone TEXT,
  department TEXT,
  password_hash TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tickets
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes de chat
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ticket-assigned', 'ticket-updated', 'new-message', 'ticket-created')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación:
- Revisar la documentación en el código
- Verificar logs en la consola del navegador
- Verificar conexión a Supabase
- Contactar al equipo de desarrollo

---

**TicketFlow** - Sistema completo de gestión de tickets con Supabase PostgreSQL.