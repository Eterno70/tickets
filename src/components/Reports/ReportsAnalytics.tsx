import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import { BarChart3, TrendingUp, Clock, Users, Download, Calendar } from 'lucide-react';

export function ReportsAnalytics() {
  const { currentUser } = useAuth();
  const { tickets, users } = useTickets();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('overview');

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'technician')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const getFilteredTickets = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return tickets.filter(ticket => ticket.createdAt >= cutoffDate);
  };

  const filteredTickets = getFilteredTickets();

  const getStats = () => {
    const total = filteredTickets.length;
    const resolved = filteredTickets.filter(t => t.status === 'resolved').length;
    const inProgress = filteredTickets.filter(t => t.status === 'in-progress').length;
    const open = filteredTickets.filter(t => t.status === 'open').length;
    
    const resolutionRate = total > 0 ? (resolved / total * 100).toFixed(1) : '0';
    
    const avgResolutionTime = filteredTickets
      .filter(t => t.status === 'resolved')
      .reduce((acc, ticket) => {
        const diff = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
        return acc + diff;
      }, 0) / (resolved || 1);
    
    const avgDays = (avgResolutionTime / (1000 * 60 * 60 * 24)).toFixed(1);

    return {
      total,
      resolved,
      inProgress,
      open,
      resolutionRate,
      avgResolutionTime: avgDays
    };
  };

  const getCategoryStats = () => {
    const categories = {};
    filteredTickets.forEach(ticket => {
      categories[ticket.category] = (categories[ticket.category] || 0) + 1;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  };

  const getPriorityStats = () => {
    const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };
    filteredTickets.forEach(ticket => {
      priorities[ticket.priority]++;
    });
    return priorities;
  };

  const getTechnicianStats = () => {
    const techStats = {};
    const technicians = users.filter(u => u.role === 'technician');
    
    technicians.forEach(tech => {
      const assignedTickets = filteredTickets.filter(t => t.assignedTo === tech.id);
      const resolvedTickets = assignedTickets.filter(t => t.status === 'resolved');
      
      techStats[tech.id] = {
        name: tech.name,
        assigned: assignedTickets.length,
        resolved: resolvedTickets.length,
        rate: assignedTickets.length > 0 ? (resolvedTickets.length / assignedTickets.length * 100).toFixed(1) : '0'
      };
    });
    
    return techStats;
  };

  const stats = getStats();
  const categoryStats = getCategoryStats();
  const priorityStats = getPriorityStats();
  const technicianStats = getTechnicianStats();

  const exportReport = () => {
    const reportData = {
      period: `Últimos ${dateRange} días`,
      generated: new Date().toISOString(),
      stats,
      categories: categoryStats,
      priorities: priorityStats,
      technicians: technicianStats
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-tickets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-gray-500 text-sm mt-1">Últimos {dateRange} días</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tasa de Resolución</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.resolutionRate}%</p>
              <p className="text-gray-500 text-sm mt-1">{stats.resolved} de {stats.total}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgResolutionTime}</p>
              <p className="text-gray-500 text-sm mt-1">días para resolver</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Técnicos Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Object.keys(technicianStats).length}</p>
              <p className="text-gray-500 text-sm mt-1">trabajando en tickets</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets por Categoría</h3>
          <div className="space-y-3">
            {categoryStats.map(([category, count], index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-gray-700">{category}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Prioridad</h3>
          <div className="space-y-3">
            {Object.entries(priorityStats).map(([priority, count]) => {
              const colors = {
                urgent: 'bg-red-600',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500'
              };
              const labels = {
                urgent: 'Urgente',
                high: 'Alta',
                medium: 'Media',
                low: 'Baja'
              };
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-gray-700">{labels[priority]}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[priority]} h-2 rounded-full`}
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technician Performance */}
      {currentUser.role === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento de Técnicos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Técnico</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Asignados</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Resueltos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tasa de Resolución</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(technicianStats).map(([techId, data]) => (
                  <tr key={techId} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{data.name}</td>
                    <td className="py-3 px-4 text-gray-600">{data.assigned}</td>
                    <td className="py-3 px-4 text-gray-600">{data.resolved}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(data.rate) >= 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(data.rate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}