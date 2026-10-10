import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, KeyRound, Clock, UserCheck } from 'lucide-react';
import { api } from '../api/client';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ logs: AuditLog[]; meta: any }>('/admin/audit-logs?limit=50');
      setLogs(Array.isArray(res) ? res : (res as any)?.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400';
    if (action.includes('UPDATE')) return 'bg-indigo-950/70 border-indigo-500/30 text-indigo-400';
    if (action.includes('DELETE') || action.includes('DAMAGE')) return 'bg-rose-950/70 border-rose-500/30 text-rose-400';
    return 'bg-brand-card border-brand-border text-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-gold" />
            <span>Immutable Security Audit Log</span>
          </h3>
          <p className="text-xs text-slate-400">
            Append-only telemetry for sensitive admin operations, price updates, and stock adjustments
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 bg-brand-card hover:bg-brand-border border border-brand-border rounded-xl text-slate-300 hover:text-white transition-colors"
          title="Refresh Log Stream"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Admin Personnel</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold">Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Retrieving tamper-evident security records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-card/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {log.first_name ? `${log.first_name} ${log.last_name || ''}` : 'System Admin'}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.admin_email || 'admin@huma'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[10px] text-slate-400">
                      {log.new_values ? (
                        typeof log.new_values === 'string' ? log.new_values : JSON.stringify(log.new_values)
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
