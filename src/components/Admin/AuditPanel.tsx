import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  ticket_id?: string;
  message_id?: string;
  details: any;
  created_at: string;
}

function DetallesLegibles({ detalles, tipoAccion }: { detalles: any, tipoAccion?: string }) {
  const [expandir, setExpandir] = React.useState(false);

  // Miniatura para imágenes
  if (detalles && detalles.url && detalles.type && detalles.type.startsWith('image/')) {
    return (
      <div className="flex items-center space-x-3">
        <img src={detalles.url} alt={detalles.nombre || detalles.name} className="w-12 h-12 object-cover rounded border" />
        <div>
          <div className="font-semibold text-gray-800">{detalles.nombre || detalles.name}</div>
          <div className="text-xs text-gray-500">{detalles.uploadedAt ? new Date(detalles.uploadedAt).toLocaleString() : ''}</div>
        </div>
      </div>
    );
  }

  // Lista de archivos/imágenes
  if (Array.isArray(detalles)) {
    return (
      <ul className="list-disc pl-4">
        {detalles.map((item, idx) => (
          <li key={idx}><DetallesLegibles detalles={item} tipoAccion={tipoAccion} /></li>
        ))}
      </ul>
    );
  }

  // Acciones sobre tickets
  if (typeof detalles === 'object' && detalles) {
    // Asignación de ticket
    if (tipoAccion === 'asignar_ticket') {
      return (
        <div>
          <div><span className="font-semibold">Asignado a:</span> {detalles.asignado_a}</div>
          {detalles.fecha && <div><span className="font-semibold">Fecha:</span> {new Date(detalles.fecha).toLocaleString()}</div>}
        </div>
      );
    }
    // Cambio de estado de ticket
    if (tipoAccion === 'cambio_estado_ticket') {
      return (
        <div>
          <div><span className="font-semibold">Nuevo estado:</span> {detalles.nuevo_estado}</div>
          {detalles.usuario_ticket && <div><span className="font-semibold">Usuario del ticket:</span> {detalles.usuario_ticket}</div>}
        </div>
      );
    }
    // Mensaje en ticket
    if (tipoAccion === 'mensaje') {
      return (
        <div>
          <div><span className="font-semibold">Mensaje:</span> {detalles.contenido}</div>
          {detalles.usuario_ticket && <div><span className="font-semibold">Usuario del ticket:</span> {detalles.usuario_ticket}</div>}
        </div>
      );
    }
    // Subida de archivo
    if (tipoAccion === 'subir_archivo' && detalles.url && detalles.type && detalles.type.startsWith('image/')) {
      return (
        <div className="flex items-center space-x-3">
          <img src={detalles.url} alt={detalles.nombre || detalles.name} className="w-12 h-12 object-cover rounded border" />
          <div>
            <div className="font-semibold text-gray-800">{detalles.nombre || detalles.name}</div>
            <div className="text-xs text-gray-500">{detalles.uploadedAt ? new Date(detalles.uploadedAt).toLocaleString() : ''}</div>
          </div>
        </div>
      );
    }
    // Resumir detalles extensos
    const keys = Object.keys(detalles);
    if (!expandir && keys.length > 4) {
      return (
        <div>
          <ul className="list-none pl-0">
            {keys.slice(0, 4).map((key, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold text-gray-700">{key}:</span>{' '}
                {typeof detalles[key] === 'object' ? <DetallesLegibles detalles={detalles[key]} /> : <span className="text-gray-800">{String(detalles[key])}</span>}
              </li>
            ))}
          </ul>
          <button className="text-blue-600 text-xs mt-1" onClick={() => setExpandir(true)}>Ver más...</button>
        </div>
      );
    }
    return (
      <ul className="list-none pl-0">
        {Object.entries(detalles).map(([key, value], idx) => (
          <li key={idx} className="mb-1">
            <span className="font-semibold text-gray-700">{key}:</span>{' '}
            {typeof value === 'object' ? <DetallesLegibles detalles={value} /> : <span className="text-gray-800">{String(value)}</span>}
          </li>
        ))}
      </ul>
    );
  }
  if (!detalles) return <span className="text-gray-400">Sin detalles</span>;
  return <span>{String(detalles)}</span>;
}

export default function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [userFilter, actionFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (userFilter) query = query.eq('user_name', userFilter);
    if (actionFilter) query = query.eq('action_type', actionFilter);
    if (dateFilter) {
      const start = new Date(dateFilter);
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }
    const { data, error } = await query;
    if (!error && data) {
      setLogs(data);
      // Extraer usuarios y acciones únicos para los filtros
      setUsers(Array.from(new Set(data.map((log: any) => log.user_name).filter(Boolean))));
      setActions(Array.from(new Set(data.map((log: any) => log.action_type).filter(Boolean))));
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Auditoría de Actividades</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario</label>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Todos</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Acción</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Todas</option>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <button
          onClick={() => { setUserFilter(''); setActionFilter(''); setDateFilter(''); }}
          className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Limpiar filtros
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Realizado por</th>
              <th className="px-4 py-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">No hay registros</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{log.user_name || log.user_id}</td>
                  <td className="px-4 py-2">{log.action_type}</td>
                  <td className="px-4 py-2">{log.user_name || log.user_id}</td>
                  <td className="px-4 py-2 whitespace-pre-wrap break-all max-w-xs">
                    <DetallesLegibles detalles={log.details} tipoAccion={log.action_type} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 