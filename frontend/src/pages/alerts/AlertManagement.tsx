import React, { useEffect, useState } from 'react';
import { alertService } from '../../services';
import { Alert } from '../../types';
import { BellRing, ShieldAlert, CheckCircle2, Clock, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertService.list({
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      await alertService.updateStatus(alertId, newStatus);
      fetchAlerts();
    } catch (err) {
      alert('Failed to update alert status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Alert & Corrective Action Operations
          </h1>
          <p className="text-xs text-slate-500">
            Real-time notifications generated when parameters breach screening thresholds or trigger anomaly scores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Severities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Measured vs Threshold</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Message & Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No alerts found for current criteria.
                  </td>
                </tr>
              ) : (
                alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {alt.alert_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {alt.location_name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-teal-600">
                      {alt.abnormal_parameter}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <b>{alt.measured_value}</b> <span className="text-slate-400">({alt.threshold_value})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === 'High' ? 'bg-rose-100 text-rose-800' :
                        alt.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                      <div>{alt.alert_message}</div>
                      <div className="text-[10px] text-teal-600 font-semibold mt-0.5">Rec: {alt.suggested_action}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'Active' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        alt.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alt.status !== 'Active' && (
                          <button
                            onClick={() => handleUpdateStatus(alt.alert_id, 'Active')}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px]"
                          >
                            Active
                          </button>
                        )}
                        {alt.status !== 'Under Review' && (
                          <button
                            onClick={() => handleUpdateStatus(alt.alert_id, 'Under Review')}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[10px]"
                          >
                            Review
                          </button>
                        )}
                        {alt.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(alt.alert_id, 'Resolved')}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-[10px]"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
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
