# 🚀 Guía de Deploy - Sistema de Tickets

## Opciones de Deploy

### 1. Vercel (Recomendado) - GRATIS

#### Pasos:
1. **Crear cuenta en Vercel**: Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. **Conectar repositorio**: 
   - Haz clic en "New Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio de tu aplicación
3. **Configurar variables de entorno**:
   - En la configuración del proyecto, ve a "Environment Variables"
   - Agrega:
     - `VITE_SUPABASE_URL`: Tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase
4. **Deploy**: Vercel detectará automáticamente que es un proyecto Vite y hará el deploy

#### Ventajas:
- ✅ Deploy automático con cada push
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Dominio personalizado gratuito
- ✅ Muy fácil de configurar

### 2. Netlify - GRATIS

#### Pasos:
1. **Crear cuenta en Netlify**: Ve a [netlify.com](https://netlify.com)
2. **Conectar repositorio**:
   - Haz clic en "New site from Git"
   - Conecta tu repositorio de GitHub
3. **Configurar build**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Configurar variables de entorno**:
   - Ve a Site settings > Environment variables
   - Agrega las variables de Supabase

### 3. GitHub Pages - GRATIS

#### Pasos:
1. **Instalar GitHub Actions**:
   - Crea el archivo `.github/workflows/deploy.yml`
2. **Configurar variables de entorno**:
   - Ve a Settings > Secrets and variables > Actions
   - Agrega las variables de Supabase

## Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## Comandos Útiles

```bash
# Build local para probar
npm run build

# Preview del build
npm run preview

# Verificar que todo funciona
npm run lint
```

## Notas Importantes

1. **Supabase**: Asegúrate de que tu proyecto de Supabase esté configurado para producción
2. **CORS**: Configura los dominios permitidos en Supabase
3. **SSL**: Todas las plataformas mencionadas incluyen HTTPS automático
4. **Dominio**: Puedes usar un dominio personalizado en cualquiera de estas plataformas

## Soporte

Si tienes problemas con el deploy, revisa:
- Los logs de build en la plataforma elegida
- Las variables de entorno están correctamente configuradas
- La conexión a Supabase funciona desde el dominio de producción 