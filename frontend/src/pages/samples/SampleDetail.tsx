import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sampleService, analysisService, reportService, alertService } from '../../services';
import { WaterSample } from '../../types';
import {
  FileText, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle,
  FileDown, Sparkles, MapPin, Calendar, Activity, ShieldCheck,
  CheckCircle2, Clock
} from 'lucide-react';

export const SampleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sample, setSample] = useState<WaterSample | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchSample = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await sampleService.getById(id);
      setSample(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSample();
  }, [id]);

  const handleReanalyze = async () => {
    if (!sample) return;
    setAnalyzing(true);
    try {
      await analysisService.analyzeSample(sample.id);
      await fetchSample();
    } catch (err) {
      alert('Re-analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      await alertService.updateStatus(alertId, newStatus);
      await fetchSample();
    } catch (err) {
      alert('Failed to update alert status.');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-2" />
        Loading water sample details...
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="py-16 text-center text-slate-500 space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold">Sample Not Found</h2>
        <Link to="/samples" className="text-xs font-semibold text-teal-600 hover:underline">
          &larr; Back to Sample Records
        </Link>
      </div>
    );
  }

  const p = sample.parameters;
  const a = sample.analysis;
  const anomalies = sample.anomalies || [];
  const alerts = sample.alerts || [];
  const recs = sample.recommendations || [];

  const cat = a?.predicted_category || 'Pending';
  const badgeColor =
    cat === 'Good Quality' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
    cat === 'Moderate Quality' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
    cat === 'Poor Quality' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/samples"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sample {sample.sample_id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeColor}`}>
                {cat}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Location: <span className="font-semibold text-slate-700 dark:text-slate-300">{sample.location_name}</span> &bull; Source: {sample.water_source_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}
          </button>
          <a
            href={reportService.getSamplePdfUrl(sample.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20"
          >
            <FileDown className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>

      {/* Top 3 Analytical Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Quality Classification</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{cat}</div>
          <div className="text-xs text-slate-500">
            Model: <span className="font-semibold">{a?.model_used || 'Ensemble'}</span> &bull; Conf: {a?.confidence_score ? `${Math.round(a.confidence_score * 100)}%` : 'N/A'}
          </div>
          {a?.wqi_score && (
            <div className="pt-2">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Water Quality Index</span>
                <span className="font-bold">{a.wqi_score}/100</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${a.wqi_score >= 80 ? 'bg-emerald-500' : a.wqi_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${a.wqi_score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Anomaly Detection Status */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Anomaly Screening Status</div>
          <div className="flex items-center gap-2">
            {anomalies.some(an => an.is_anomaly) ? (
              <>
                <AlertTriangle className="h-6 w-6 text-rose-500" />
                <span className="text-2xl font-extrabold text-rose-600">ANOMALY DETECTED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-2xl font-extrabold text-emerald-600">NORMAL ENVELOPE</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Severity: <span className="font-bold">{anomalies[0]?.severity || 'Normal'}</span> &bull; Isolation Score: {anomalies[0]?.anomaly_score?.toFixed(3) ?? 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 italic">
            {anomalies[0]?.notes || 'No statistical outliers flagged.'}
          </div>
        </div>

        {/* Geo / Time Context */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-400">Sampling Coordinates</div>
          <div className="space-y-1.5 pt-1 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              <span>{sample.latitude && sample.longitude ? `${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}` : 'Manual Station Coordinates'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span>{sample.collection_date ? new Date(sample.collection_date).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>Analyzed: {a?.created_at ? new Date(a.created_at).toLocaleTimeString() : 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          Parameter Measurements vs. Screening Baselines
        </h2>

        {a?.observations && a.observations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Measured Value</th>
                  <th className="py-2.5 px-3">Optimal Baseline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Observation & Analytical Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {a.observations.map((obs, idx) => {
                  const isNormal = obs.status === 'Normal';
                  const isCritical = obs.status.includes('Critical');
                  const statusBg = isNormal ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    isCritical ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {obs.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {obs.value} {obs.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {obs.optimal_range}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusBg}`}>
                          {obs.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        <div>{obs.observation}</div>
                        {obs.action_note && (
                          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                            Suggested Action: {obs.action_note}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-4 text-center">
            Click 'Re-Run AI Analysis' to generate detailed parameter observations.
          </div>
        )}
      </div>

      {/* Generated Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sample Alerts ({alerts.length})
            </h2>
            <span className="text-[11px] text-slate-400">Status update actions</span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> No active parameter alerts generated for this sample.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alt) => (
                <div key={alt.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {alt.abnormal_parameter}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alt.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {alt.severity} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {alt.alert_message}
                  </p>
                  <div className="text-[11px] text-slate-500">
                    <b>Action:</b> {alt.suggested_action}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px]">
                    <span className="text-slate-400">Status: <b>{alt.status}</b></span>
                    <div className="flex items-center gap-1.5">
                      {alt.status !== 'Under Review' && (
                        <button
                          onClick={() => handleAlertStatus(alt.alert_id, 'Under Review')}
                          className="px-2 py-0.5 rounded text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium"
                        >
                          Mark Under Review
                        </button>
                      )}
                      {alt.status !== 'Resolved' && (
                        <button
                          onClick={() => handleAlertStatus(alt.alert_id, 'Resolved')}
                          className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tailored Recommendations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Prescriptive Decision Support Recommendations
            </h2>
          </div>

          <div className="space-y-3">
            {recs.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> {r.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">{r.category}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
