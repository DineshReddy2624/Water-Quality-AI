import React, { useEffect, useState } from 'react';
import { anomalyService } from '../../services';
import { AnomalyRecord } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnomalyDetectionPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await anomalyService.list(true, severityFilter || undefined);
      setAnomalies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Unsupervised Anomaly Detection
          </h1>
          <p className="text-xs text-slate-500">
            Statistical multi-dimensional outlier scoring powered by Isolation Forest and threshold screening rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={fetchAnomalies}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500">
          Detected Outliers & Parameter Deviations ({anomalies.length})
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {anomalies.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> No anomalies matching the selected severity.
            </div>
          ) : (
            anomalies.map((anom) => {
              const sevCol =
                anom.severity === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200' :
                anom.severity === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200' :
                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200';

              return (
                <div key={anom.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/samples/${anom.sample_code || anom.sample_id}`} className="font-bold text-sm text-teal-600 hover:underline">
                        {anom.sample_code || `Sample #${anom.sample_id}`}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sevCol}`}>
                        {anom.severity} Severity
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Anomaly Score: <span className="font-bold text-slate-900 dark:text-white">{anom.anomaly_score.toFixed(3)}</span> &bull; {anom.detected_method}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {anom.notes}
                  </p>

                  {/* Abnormal parameters badges */}
                  {anom.abnormal_parameters && anom.abnormal_parameters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {anom.abnormal_parameters.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                          {p.name}: <b>{p.value} {p.unit}</b> ({p.status})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
