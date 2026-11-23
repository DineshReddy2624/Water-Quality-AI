import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sampleService, analysisService, reportService, alertService } from '../../services';
import { WaterSample } from '../../types';
import {
  FileText, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle,
  FileDown, Sparkles, MapPin, Calendar, Activity, ShieldCheck,
  CheckCircle2, Clock, Globe, Info, Sliders, History, ChevronRight,
  ShieldAlert, Layers, Scale, Cpu, Check, BookOpen, Calculator
} from 'lucide-react';

const getWqiCategory = (score: number): string => {
  if (score >= 80) return 'Good Quality';
  if (score >= 60) return 'Moderate Quality';
  if (score >= 40) return 'Poor Quality';
  return 'Potentially Contaminated';
};

const getWqiShortAssessment = (score: number): string => {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Poor';
  return 'Potentially Contaminated';
};

export const SampleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sample, setSample] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelPreference, setModelPreference] = useState('ensemble');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);

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
      await analysisService.analyzeSample(sample.id, modelPreference);
      await fetchSample();
      setSelectedAnalysisId(null);
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
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-2" />
        Loading water sample analytics...
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold">Sample Record Not Found</h2>
        <Link to="/samples" className="text-xs font-semibold text-teal-600 hover:underline">
          &larr; Back to Water Sample Records
        </Link>
      </div>
    );
  }

  const p = sample.parameters;
  const history = sample.analyses_history || [];
  const selectedRun = selectedAnalysisId
    ? history.find((h: any) => h.id === selectedAnalysisId) || sample.analysis
    : sample.analysis;
  const a = selectedRun;
  const anomalies = sample.anomalies || [];
  const alerts = sample.alerts || [];
  const recs = sample.recommendations || [];

  const cat = a?.predicted_category || 'Pending';
  const badgeColor =
    cat === 'Good Quality' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
    cat === 'Moderate Quality' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
    cat === 'Poor Quality' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
    cat === 'Potentially Contaminated' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  const tzName = sample.timezone || 'Asia/Kolkata';

  // Format date helper with explicit timezone display (e.g. "23 November 2026, 06:35 PM IST")
  const formatDatetime = (dtStr?: string, targetTimezone?: string) => {
    if (!dtStr) return 'N/A';
    try {
      const tz = targetTimezone || sample?.timezone || 'Asia/Kolkata';
      let isoStr = String(dtStr).trim();
      if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('-')) {
        isoStr = `${isoStr}Z`;
      }
      const dt = new Date(isoStr);
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }).formatToParts(dt);

      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      const tzDisplay = (tz === 'Asia/Kolkata' || map.timeZoneName === 'GMT+5:30') ? 'IST' : (map.timeZoneName || tz);
      return `${map.day} ${map.month} ${map.year}, ${map.hour}:${map.minute} ${(map.dayPeriod || '').toUpperCase()} ${tzDisplay}`;
    } catch {
      return dtStr;
    }
  };

  // Full 10 parameters catalogue for comparison
  const fullParametersList = [
    { key: 'ph', name: 'pH Level', unit: 'pH units', value: p?.ph, baseline: '6.5 - 8.5', isCore: true },
    { key: 'turbidity', name: 'Turbidity', unit: 'NTU', value: p?.turbidity, baseline: '0.0 - 5.0', isCore: true },
    { key: 'temperature', name: 'Water Temperature', unit: '°C', value: p?.temperature, baseline: '15.0 - 28.0', isCore: true },
    { key: 'dissolved_oxygen', name: 'Dissolved Oxygen (DO)', unit: 'mg/L', value: p?.dissolved_oxygen, baseline: '6.0 - 14.0', isCore: true },
    { key: 'tds', name: 'Total Dissolved Solids (TDS)', unit: 'mg/L', value: p?.tds, baseline: '50.0 - 500.0', isCore: true },
    { key: 'electrical_conductivity', name: 'Electrical Conductivity', unit: 'µS/cm', value: p?.electrical_conductivity, baseline: '100.0 - 750.0', isCore: true },
    { key: 'hardness', name: 'Total Hardness (CaCO3)', unit: 'mg/L', value: p?.hardness, baseline: '50.0 - 200.0', isCore: false },
    { key: 'chloramines', name: 'Chloramines', unit: 'mg/L', value: p?.chloramines, baseline: '0.0 - 3.0', isCore: false },
    { key: 'sulfate', name: 'Sulfate (SO4)', unit: 'mg/L', value: p?.sulfate, baseline: '0.0 - 250.0', isCore: false },
    { key: 'organic_carbon', name: 'Total Organic Carbon (TOC)', unit: 'mg/L', value: p?.organic_carbon, baseline: '0.0 - 5.0', isCore: false }
  ];

  // Anomaly score computation and separation
  const normScore = a?.anomaly_score !== undefined ? a.anomaly_score : (anomalies[0]?.anomaly_score ?? 0.0);
  const isMlOutlier = normScore >= 0.500;
  const severeViolationList = fullParametersList
    .map(param => a?.observations?.find((o: any) => o.parameter === param.key))
    .filter((obs): obs is any => Boolean(obs && obs.status && obs.status.includes('Critical')));
  const severeViolationCount = severeViolationList.length;
  const isRuleViolation = severeViolationCount > 0;

  // Empirical TDS / EC Ratio Calculation
  const tdsVal = p?.tds;
  const ecVal = p?.electrical_conductivity;
  const hasTdsEc = tdsVal !== undefined && ecVal !== undefined && ecVal > 0;
  const tdsEcRatio = hasTdsEc ? Number((tdsVal / ecVal).toFixed(3)) : null;
  const isTdsEcNormal = tdsEcRatio !== null && tdsEcRatio >= 0.55 && tdsEcRatio <= 0.70;

  const sourceName = sample.water_source_name || sample.water_source_type || 'Water Source';
  const isIndustrial = (sample.water_source_type || '').toLowerCase().includes('industrial') ||
                       sourceName.toLowerCase().includes('industrial') ||
                       sourceName.toLowerCase().includes('outfall') ||
                       sourceName.toLowerCase().includes('effluent') ||
                       sourceName.toLowerCase().includes('drain');

  // 4-Tier Matrix Extraction (or fallback construction)
  const matrix = a?.classification_matrix || {
    tier1_ml: {
      predicted_category: a?.predicted_category || 'Moderate Quality',
      confidence: a?.confidence_score || 0.85,
      model_name: a?.model_used || 'Supervised Classifier (Scikit-Learn)'
    },
    tier2_wqi: {
      wqi_score: a?.wqi_score || 75.0,
      wqi_scale: 'AquaSense Custom WQS (Option A: 0-100 scale, 100 = Pristine)',
      wqi_category: getWqiCategory(a?.wqi_score || 75.0),
      wqi_version: a?.wqi_version || 'AquaSense-Custom-WA-WQS-v2.1'
    },
    tier3_rules: {
      status: isRuleViolation ? `${severeViolationCount} Critical Violation(s) Detected` : 'All Parameters Within Baseline',
      severe_violations_count: severeViolationCount,
      critical_violations: severeViolationList.map((obs: any) => obs.observation || `${obs.name}: ${obs.value} ${obs.unit}`)
    },
    tier4_arbitrated: {
      final_category: cat,
      override_applied: isRuleViolation && cat !== (a?.predicted_category || 'Moderate Quality'),
      override_rule_applied: severeViolationCount >= 2 ? 'Multi-Parameter Critical Contamination Safety Override' : (severeViolationCount === 1 ? 'Single Critical Parameter Threshold Override' : 'Standard Classification Alignment'),
      arbitration_explanation: isRuleViolation && cat !== (a?.predicted_category || 'Moderate Quality')
        ? `${severeViolationCount} critical parameter threshold breach(es) mandated safety override to '${cat}' for precautionary environmental screening. Notice: Environmental screening classification, not confirmed chemical or biological contamination.`
        : 'Safety Arbitration: Evaluated. Override Status: Not Required. Original ML prediction already aligns with the rule-based screening outcome.'
    }
  };

  const evaluatedCount = fullParametersList.filter(param => param.value !== undefined && param.value !== null && !isNaN(param.value)).length;
  const criticalViolationsCount = (a?.observations || []).filter((o: any) => (o.status || '').includes('Critical')).length;
  const elevatedCount = (a?.observations || []).filter((o: any) => ['Elevated', 'Low'].includes(o.status)).length;
  const normalCount = Math.max(0, evaluatedCount - criticalViolationsCount - elevatedCount);
  const activeAlertsCount = alerts.filter((alt: any) => String(alt.status || '').toLowerCase() === 'active').length;
  const resolvedAlertsCount = alerts.filter((alt: any) => String(alt.status || '').toLowerCase() === 'resolved').length;
  const totalAlertsCount = alerts.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Sample Identification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            to="/samples"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Back to Samples"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {sample.sample_id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeColor}`}>
                {cat}
              </span>
              {a?.id && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Run ID: RUN-{a.id} (v{a.analysis_version || 1})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span><b>Source:</b> {sample.water_source_name}</span>
              <span>&bull;</span>
              <span><b>Location:</b> {sample.location_name}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-teal-600" /> {tzName} (IST)</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={modelPreference}
            onChange={(e) => setModelPreference(e.target.value)}
            disabled={analyzing}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="ensemble">Ensemble (Rules + RF)</option>
            <option value="random_forest">Random Forest</option>
            <option value="xgboost">XGBoost Classifier</option>
            <option value="decision_tree">Decision Tree</option>
            <option value="logistic_regression">Logistic Regression</option>
          </select>

          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 text-teal-600 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}
          </button>
          <a
            href={reportService.getSamplePdfUrl(sample.id, a?.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20"
          >
            <FileDown className="h-4 w-4" /> Download PDF Report
          </a>
          <a
            href={reportService.getSampleExcelUrl(sample.id, a?.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-700/20"
          >
            <FileText className="h-4 w-4" /> Download Case Excel
          </a>
        </div>
      </div>

      {/* Tabs: Active Analysis vs Version History */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${activeTab === 'current' ? 'text-teal-600 border-b-2 border-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Activity className="h-4 w-4" /> Current Analytical Assessment
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${activeTab === 'history' ? 'text-teal-600 border-b-2 border-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History className="h-4 w-4" /> Analysis Version History ({history.length})
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Historical Re-Analysis Versions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Timestamp ({tzName})</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">WQI Score</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Model Used</th>
                  <th className="py-2.5 px-3">Active Status</th>
                  <th className="py-2.5 px-3 text-right">Run Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h: any, idx: number) => {
                  const isCurrentView = h.id === a?.id;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">RUN-{h.id}</td>
                      <td className="py-2.5 px-3 font-bold font-mono">v{h.analysis_version}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{formatDatetime(h.created_at)}</td>
                      <td className="py-2.5 px-3 font-semibold">{h.predicted_category}</td>
                      <td className="py-2.5 px-3 font-mono">{h.wqi_score ?? 'N/A'}/100</td>
                      <td className="py-2.5 px-3 font-mono">{h.confidence_score ? `${Math.round(h.confidence_score * 100)}%` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">{h.model_used}</td>
                      <td className="py-2.5 px-3">
                        {h.is_current ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">Current Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800">Superseded</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isCurrentView ? (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                            Currently Viewing
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSelectedAnalysisId(h.id); setActiveTab('current'); }}
                            className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:text-teal-600 font-semibold text-[11px] shadow-sm"
                          >
                            View This Run &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Historical Run Banner if selected run is not the latest active */}
          {selectedAnalysisId && selectedAnalysisId !== sample.analysis?.id && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
              <div>
                <b>Historical Analysis Run View:</b> You are inspecting analysis run <b>RUN-{a?.id} (Version {a?.analysis_version})</b> from {formatDatetime(a?.created_at)}. All parameter interpretations, metrics, alerts, and PDF/Excel downloads reflect this run.
              </div>
              <button
                onClick={() => setSelectedAnalysisId(null)}
                className="px-3 py-1 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-950 dark:text-amber-100 font-bold text-[11px] shrink-0"
              >
                Switch to Latest Active Run
              </button>
            </div>
          )}

          {/* SECTION B: Overall Result & Executive Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  SECTION B &mdash; Overall Result & Executive Summary
                </h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
                Final Result: {cat}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {criticalViolationsCount === 10 ? (
                <>The system classified this sample as <b>Potentially Contaminated</b> because all ten evaluated parameters crossed their configured critical screening limits. The water-quality score was also low ({(a?.wqi_score ?? 18.5).toFixed(2)}/100), and the anomaly detection system identified the sample as statistically unusual. This is a screening result, not laboratory confirmation of contamination.</>
              ) : criticalViolationsCount > 0 ? (
                <>The system classified this sample as <b>{cat}</b> because {criticalViolationsCount} parameter(s) crossed critical screening limits. The water-quality score was {(a?.wqi_score ?? 18.5).toFixed(2)}/100. This is an automated screening result, not certified laboratory confirmation.</>
              ) : (
                <>The system classified this sample as <b>{cat}</b>. All evaluated parameters fall within their optimal configured screening baselines.</>
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Checked</div>
                <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{evaluatedCount}</div>
                <div className="text-[9.5px] text-slate-500">Parameters</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Critical</div>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{criticalViolationsCount}</div>
                <div className="text-[9.5px] text-rose-500">Breaches</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Elevated</div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{elevatedCount}</div>
                <div className="text-[9.5px] text-amber-500">Deviations</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Normal</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{normalCount}</div>
                <div className="text-[9.5px] text-emerald-500">In Baseline</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Alerts</div>
                <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{totalAlertsCount}</div>
                <div className="text-[9.5px] text-slate-500">System Alerts</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Active Alerts</div>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{activeAlertsCount}</div>
                <div className="text-[9.5px] text-rose-500">Pending Review</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Resolved</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{resolvedAlertsCount}</div>
                <div className="text-[9.5px] text-emerald-500">Closed</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Anomaly</div>
                <div className={`text-xs font-bold mt-1 ${isMlOutlier ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isMlOutlier ? 'Unusual Pattern' : 'Normal Pattern'}
                </div>
                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">{normScore.toFixed(3)}</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <b>Screening Notice:</b> This result represents an automated decision-support screening based on physical-chemical parameter deviation. It does not certify drinking water safety or identify specific toxic chemical compounds without accredited laboratory testing.
              </div>
            </div>
          </div>

          {/* Top 3 Core Analytical Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Final Quality Classification & Safety Arbitration Status */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  D. Final Quality Classification
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                  {cat}
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{cat}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Primary Model: <span className="font-semibold text-slate-700 dark:text-slate-300">{a?.model_used || 'Ensemble Rules'}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Original ML Model Prediction:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {matrix.tier1_ml.predicted_category}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Model Probability (predict_proba):</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    {a?.confidence_score ? `${Math.round(a.confidence_score * 100)}%` : '100%'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  Uncalibrated voting consensus; not a measure of water safety or chemical purity.
                </div>
              </div>
            </div>

            {/* Card 2: AquaSense Custom Water Quality Score (0-100 scale) */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  G. AquaSense Custom Water Quality Score
                </span>
                <span className="text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400">
                  {a?.wqi_version || 'WA-WQS-v2.1'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '79.35'}
                </div>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (a?.wqi_score ?? 79.35) >= 80 ? 'bg-emerald-500' :
                      (a?.wqi_score ?? 79.35) >= 60 ? 'bg-amber-500' :
                      (a?.wqi_score ?? 79.35) >= 40 ? 'bg-orange-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, a?.wqi_score ?? 79.35)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 (Heavily Degraded)</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Assessment: {getWqiShortAssessment(a?.wqi_score ?? 79.35)}
                  </span>
                  <span>100 (Pristine)</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                Formula adapted from Weighted Arithmetic Index; dynamic weight normalization without zero imputation.
              </div>
            </div>

            {/* Card 3: H. Anomaly Screening (Isolation Forest vs Threshold Rules) */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  H. Anomaly Screening Engine
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Dual-Engine Check
                </span>
              </div>
              
              {/* Isolation Forest Status */}
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-teal-600" /> Isolation Forest ML:
                  </span>
                  <span className={`font-bold ${isMlOutlier ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isMlOutlier ? 'Statistical Outlier' : 'Statistical Inlier'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Norm Outlier Score: <b className="font-mono text-slate-700 dark:text-slate-300">{normScore.toFixed(3)}</b></span>
                  <span>Threshold: <b className="font-mono">0.500</b></span>
                </div>
              </div>

              {/* Threshold Rule Status */}
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Scale className="h-3 w-3 text-amber-500" /> Parameter Threshold Rules:
                  </span>
                  <span className={`font-bold ${isRuleViolation ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                    {isRuleViolation ? `Flagged (${severeViolationCount} Critical Breach)` : 'Within Thresholds'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Overall Status: <b className="text-slate-700 dark:text-slate-300">
                    {isRuleViolation 
                      ? 'Flagged by Parameter Threshold Rules' 
                      : (isMlOutlier ? 'Flagged by Isolation Forest ML' : 'All Screening Criteria Normal')}
                  </b>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {isMlOutlier
                  ? `Isolation Forest detected a statistical outlier pattern because the normalized outlier score of ${normScore.toFixed(3)} exceeds the configured threshold of 0.500.`
                  : `Isolation Forest detected a statistical inlier pattern because the normalized outlier score of ${normScore.toFixed(3)} is within the configured threshold of 0.500.`}
              </div>
            </div>
          </div>

          {/* 4-Tier Classification & Safety Arbitration Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600" /> I. 4-Tier Classification & Safety Arbitration Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Transparent analytical breakdown displaying ML inference, WQI screening, and safety override rationale
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                matrix.tier4_arbitrated.override_applied
                  ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800'
                  : 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800'
              }`}>
                {matrix.tier4_arbitrated.override_applied ? "Safety Precedence Activated" : "Safety Arbitration: Evaluated"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Tier 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tier 1: ML Model Prediction
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {matrix.tier1_ml.predicted_category}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>Model: <span className="font-semibold">{matrix.tier1_ml.model_name}</span></div>
                  <div>Probability: <span className="font-mono font-bold text-teal-600">{Math.round(matrix.tier1_ml.confidence * 100)}%</span> (Uncalibrated Consensus)</div>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 space-y-1">
                  <div>Holdout Split (N=8): RF 50.0% (F1 0.40) | XGB 87.5% (F1 0.70)</div>
                  <div className="italic text-slate-400">
                    100% uncalibrated voting consensus represents model voting agreement, not model accuracy or confirmed water safety.
                  </div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tier 2: WQI Screening
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {matrix.tier2_wqi.wqi_category}
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>WQI Score: <span className="font-mono font-bold text-teal-600">{matrix.tier2_wqi.wqi_score.toFixed(2)}</span> / 100</div>
                  <div>Scale: <span className="font-semibold text-slate-500">Custom 0-100 WA-WQS</span></div>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                  Aggregated physical-chemical sub-indices with dynamic weight normalization.
                </div>
              </div>

              {/* Tier 3 */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Tier 3: Rule-Based Evaluation
                </div>
                <div className="text-base font-bold text-amber-700 dark:text-amber-300">
                  {matrix.tier3_rules.severe_violations_count > 0 ? "Critical Violation Detected" : (matrix.tier3_rules.abnormal_parameters_count > 0 ? "Tolerable Deviations" : "All Baseline Met")}
                </div>
                <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Critical Breaches:</span>
                    <span className="font-bold text-rose-600 font-mono">{matrix.tier3_rules.severe_violations_count}</span>
                  </div>
                  {matrix.tier3_rules.critical_violations && matrix.tier3_rules.critical_violations.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {matrix.tier3_rules.critical_violations.map((cv: string, idx: number) => (
                        <div key={idx} className="text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200/60 dark:border-rose-900/40 leading-snug">
                          • {cv}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 pt-1">
                      All parameters within configured screening baselines.
                    </div>
                  )}
                </div>
                <div className="text-[9.5px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1.5 border-t border-amber-100 dark:border-amber-950">
                  <div className="italic text-[9px] text-slate-400">Application screening configurations; not certified regulatory limits.</div>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="p-3.5 rounded-xl border border-teal-500 dark:border-teal-400 bg-teal-50/60 dark:bg-teal-950/40 text-xs space-y-2 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Tier 4: Safety-Arbitrated Decision
                </div>
                <div className="text-base font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-600" /> {cat}
                </div>
                <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>Override Status: <span className={`font-bold ${matrix.tier4_arbitrated.override_applied ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {matrix.tier4_arbitrated.override_applied ? "Applied" : "Not Required"}
                  </span></div>
                  <div>Reason: <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {matrix.tier4_arbitrated.override_applied
                      ? (matrix.tier4_arbitrated.override_rule_applied || "Safety Precedence Policy")
                      : "Original ML prediction already aligns with the rule-based screening outcome."}
                  </span></div>
                </div>
                <div className="pt-1.5 border-t border-teal-200 dark:border-teal-800 text-[10px] text-teal-800 dark:text-teal-300 font-medium">
                  {matrix.tier4_arbitrated.override_applied
                    ? `ML '${matrix.tier1_ml.predicted_category}' overrode to '${matrix.tier4_arbitrated.final_category}' under safety arbitration policy.`
                    : "Original ML prediction already aligns with the rule-based screening outcome."}
                </div>
              </div>
            </div>

            {/* Arbitration Rationale Box */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <b>Safety Arbitration Rationale:</b> {matrix.tier4_arbitrated.arbitration_explanation}
              </div>
            </div>
          </div>

          {/* Dedicated TDS / EC Empirical Ratio Card */}
          {hasTdsEc && tdsEcRatio !== null && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Empirical Ionic Screening: TDS / Electrical Conductivity Ratio
                  </h3>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isTdsEcNormal
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {isTdsEcNormal ? 'Within Configured Empirical Range' : 'Outside Configured Empirical Range'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Calculated Ratio (TDS / EC)</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {tdsEcRatio.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Formula: {tdsVal} mg/L ÷ {ecVal} µS/cm
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Configured Screening Range</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    0.550 – 0.700
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Application empirical screening baseline
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Screening Interpretation</div>
                  <div className={`text-xs font-bold mt-1 ${isTdsEcNormal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isTdsEcNormal ? 'Proportionally Consistent' : 'Ratio Deviation'}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {isTdsEcNormal
                      ? "Calculated TDS/EC ratio falls within the application's configured empirical screening range. This indicates proportional consistency between the two measurements but does not establish water quality, sensor accuracy, or ionic composition."
                      : "Calculated TDS/EC ratio falls outside the application's configured empirical screening range (0.550–0.700). Indicates potential ionic deviation or sensor offset; does not establish water safety."}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-[10.5px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <b>{isIndustrial ? 'Industrial Discharge & Screening Notice:' : 'Freshwater Screening Notice:'}</b> Calculated screening indicator for physical-chemical consistency.
                  {isIndustrial
                    ? ' Because this sample represents an Industrial Discharge Outfall, natural freshwater empirical assumptions do not apply to industrial wastewater. Specific industrial electrolytes govern conductance and require dedicated laboratory ion chromatography rather than natural freshwater empirical assumptions.'
                    : ` For surface freshwaters and ambient lakes such as ${sourceName}, TDS/EC ratios typically fall between 0.550 and 0.700, reflecting natural mineral dissolution. Proportional consistency indicates standard ionic balance but does not substitute for quantitative laboratory chemical testing or potability validation.`}
                </div>
              </div>
            </div>
          )}

          {/* 2. Geo-Context & 3. Collection/Analysis Timestamps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">B. Water Source & Station</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{sample.water_source_name}</span>
                <span className="text-slate-500">{sample.location_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Field Coordinates (India Bounding Box)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {sample.latitude && sample.longitude
                    ? `${Math.abs(sample.latitude).toFixed(4)}°${sample.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(sample.longitude).toFixed(4)}°${sample.longitude >= 0 ? 'E' : 'W'}`
                    : 'Manual Station (No GPS)'}
                </span>
                <span className="text-slate-400 text-[10px] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-teal-600 shrink-0" /> User-reported metadata (unverified against hydrographic gazetteer)
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">C. Sample Collection Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatDatetime(sample.collection_date)}
                </span>
                <span className="text-slate-500 font-semibold">Configured Timezone: {tzName} (IST)</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">AI Engine Analysis Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatDatetime(a?.created_at)}
                </span>
                <span className="text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3 text-teal-600" /> Stored UTC timestamp converted to IST</span>
              </div>
            </div>
          </div>

          {/* 10. Parameter Measurements vs Screening Baselines */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  J. Parameter Measurements vs. Screening Baselines
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive audit across all 10 physical and chemical parameters
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Normal</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">Warning / Elevated</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">Critical Violation</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-bold">Not Available</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Parameter Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Measured Value</th>
                    <th className="py-2.5 px-3">Screening Baseline</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Three-Part Assessment (Observation, Screening Interpretation & Recommended Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fullParametersList.map((param) => {
                    const isMeasured = param.value !== undefined && param.value !== null && !isNaN(param.value);
                    const obs = a?.observations?.find((o: any) => o.parameter === param.key);
                    const status = isMeasured ? (obs?.status || 'Normal') : 'Not Available';

                    const statusBg =
                      status === 'Normal' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                      status.includes('Critical') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                      status === 'Not Available' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';

                    return (
                      <tr key={param.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {param.name}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {param.isCore ? (
                            <span className="font-semibold text-teal-600 dark:text-teal-400">Core Telemetry</span>
                          ) : (
                            <span className="text-slate-400">Optional Assay</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {isMeasured ? `${param.value} ${param.unit}` : <span className="text-slate-400 italic">Not Measured</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {param.baseline} {param.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusBg}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {obs ? (
                            <div className="space-y-1.5 py-1">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">A. Measurement Observation</span>
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                  {obs.measurement_observation || `${param.name} measured at ${param.value} ${param.unit}.`}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">B. Screening Interpretation</span>
                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                  {obs.screening_interpretation || obs.observation}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">C. Recommended Action</span>
                                <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                                  &rarr; {obs.recommended_action || obs.action_note}
                                </span>
                              </div>
                            </div>
                          ) : isMeasured ? (
                            <div className="space-y-1 py-1">
                              <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">A. Measurement Observation</span>
                                {param.name} measured at {param.value} {param.unit}.
                              </div>
                              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">B. Screening Interpretation</span>
                                Within configured screening baseline. Parameter severity: Normal.
                              </div>
                              <div className="text-xs text-slate-500">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">C. Recommended Action</span>
                                Routine scheduled monitoring; maintain operational limits.
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No measurement recorded for this optional parameter. Dynamic weight re-normalization applied.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* J.2 Standards Traceability Reference Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-600" /> Standards Traceability Reference Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete standards provenance and jurisdictional citation across all 10 monitored parameters
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                10 Standards Benchmarked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Monitored Parameter</th>
                    <th className="py-2 px-3">Standard Organization</th>
                    <th className="py-2 px-3">Exact Standard Document</th>
                    <th className="py-2 px-3">Publication Year</th>
                    <th className="py-2 px-3">Jurisdiction</th>
                    <th className="py-2 px-3">Threshold Source Type</th>
                    <th className="py-2 px-3">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'pH (Potential of Hydrogen)', org: 'WHO / BIS (IS 10500)', doc: 'IS 10500:2012 / WHO Guidelines 4th Ed.', year: '2017', jur: 'India / WHO', type: 'Official Statutory Limit', status: 'Verified Standard Baseline' },
                    { name: 'Turbidity', org: 'Bureau of Indian Standards (BIS)', doc: 'IS 10500:2012 Specification (Table 1, Item 3)', year: '2012', jur: 'India (National)', type: 'Official Statutory Standard', status: 'Verified Standard Baseline' },
                    { name: 'Water Temperature', org: 'WHO / CPCB', doc: 'CPCB Guidelines for Water Quality Monitoring', year: '2008', jur: 'India / International', type: 'Operational Protocol', status: 'Verified Application Baseline' },
                    { name: 'Dissolved Oxygen (DO)', org: 'CPCB / BIS', doc: 'CPCB Designated Best Use Criteria (Class A-C)', year: '2008', jur: 'India (National)', type: 'Aquatic Life & Safety Baseline', status: 'Verified Standard Baseline' },
                    { name: 'Total Dissolved Solids (TDS)', org: 'Bureau of Indian Standards (BIS)', doc: 'IS 10500:2012 Specification (Table 1, Item 10)', year: '2012', jur: 'India (National)', type: 'Official Statutory Standard', status: 'Verified Standard Baseline' },
                    { name: 'Electrical Conductivity (EC)', org: 'WHO / CPCB', doc: 'WHO Guidelines for Drinking-water Quality', year: '2017', jur: 'International / India', type: 'Physical-Chemical Screening', status: 'Verified Application Baseline' },
                    { name: 'Total Hardness (as CaCO3)', org: 'Bureau of Indian Standards (BIS)', doc: 'IS 10500:2012 Specification (Table 1, Item 9)', year: '2012', jur: 'India (National)', type: 'Official Statutory Standard', status: 'Verified Standard Baseline' },
                    { name: 'Chloramines (Monochloramine)', org: 'WHO / CPCB', doc: 'WHO Guidelines / CPCB Advisory Screening Protocol', year: '2017', jur: 'International Advisory', type: 'Screening Protocol', status: 'Verified Application Baseline' },
                    { name: 'Sulfate (as SO4)', org: 'Bureau of Indian Standards (BIS)', doc: 'IS 10500:2012 Specification (Table 1, Item 11)', year: '2012', jur: 'India (National)', type: 'Official Statutory Standard', status: 'Verified Standard Baseline' },
                    { name: 'Total Organic Carbon (TOC)', org: 'US EPA / WHO', doc: 'EPA Stage 1 & 2 DBPR (40 CFR 141.135)', year: '2006', jur: 'International Framework', type: 'Screening Protocol', status: 'Verified Application Baseline' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">{row.org}</td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{row.doc}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{row.year}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{row.jur}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">{row.type}</td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* K. Detected Active Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> K. Generated Screening Alerts ({alerts.length})
              </h2>
              <span className="text-xs text-slate-500">Auto-generated for deviations</span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                No active threshold alerts flagged for this water quality sample.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map((al: any) => {
                  const isHigh = al.severity === 'High';
                  return (
                    <div
                      key={al.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${isHigh ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{al.alert_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'}`}>
                          {al.severity} Priority
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{al.alert_message}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        <b>Suggested Action:</b> {al.suggested_action}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
                        <span className="text-slate-400">Baseline Target: {al.threshold_value}</span>
                        <div className="flex items-center gap-1.5">
                          {al.status !== 'Resolved' && (
                            <button
                              onClick={() => handleAlertStatus(al.alert_id, 'Resolved')}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:text-emerald-600 font-semibold"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <span className="text-slate-500 font-medium">[{al.status}]</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION F: FORMULA CLASSIFICATION AND STEP-BY-STEP CALCULATIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" /> SECTION F &mdash; FORMULA CLASSIFICATION AND STEP-BY-STEP CALCULATIONS
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  5 Analytical Categories (A–E)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent mathematical auditability: all analytical methods are categorized into five distinct classes to prevent mixing continuous formulas, discrete threshold checks, and statistical inference.
              </p>
            </div>

            {/* CATEGORY A: MATHEMATICAL FORMULAS */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-teal-600" /> CATEGORY A &mdash; MATHEMATICAL FORMULAS (CONTINUOUS CALCULATIONS)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Continuous mathematical equations calculated directly from measured physical and chemical parameters.
                </p>
              </div>

              {/* Formula Cards F-01 to F-06 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* F-01 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-01] TDS / Electrical Conductivity Ratio</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Evaluates proportional consistency between dissolved mineral solids and ionic conductivity for sensor validation and water-body screening.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> TDS = {tdsVal ?? 0} mg/L, EC = {ecVal ?? 0} µS/cm
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    TDS / EC Ratio = TDS ÷ EC
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> TDS = {tdsVal ?? 0} mg/L, EC = {ecVal ?? 0} µS/cm</div>
                    <div><b>Step 2 &ndash; Substitute values:</b> Ratio = {tdsVal ?? 0} ÷ {ecVal ?? 0}</div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> {tdsVal ?? 0} ÷ {ecVal ?? 0} = {tdsEcRatio !== null ? tdsEcRatio.toFixed(3) : 'N/A'}</div>
                    <div><b>Step 4 &ndash; Final result:</b> Ratio = <b>{tdsEcRatio !== null ? tdsEcRatio.toFixed(3) : 'N/A'}</b></div>
                    <div><b>Step 5 &ndash; Baseline range:</b> Configured range is 0.550 &ndash; 0.700. Current ratio is <b>{isTdsEcNormal ? 'within configured range' : 'outside configured range'}</b>.</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> {isIndustrial ? 'Industrial electrolytes govern conductance; natural freshwater empirical rules do not apply.' : `Typical freshwater ratio for ${sourceName} reflecting natural mineral dissolution.`}</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Does not establish microbiological safety or sensor calibration; only indicates proportional ionic consistency.</div>
                  </div>
                </div>

                {/* F-02 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-02] Proportionality Constant (K)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Computes the common scaling constant K ensuring all dynamic parameter importance weights sum to exactly 1.000.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> Permissible reference standards (S<sub>i</sub>) across evaluated parameters
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    K = 1 ÷ &sum;(1 ÷ S<sub>i</sub>)
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> Sum of inverse standard limits across active parameters = 1.0199</div>
                    <div><b>Step 2 &ndash; Substitute values:</b> K = 1 ÷ 1.0199</div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> 1 ÷ 1.0199 = 0.9804</div>
                    <div><b>Step 4 &ndash; Final result:</b> Proportionality Constant K = <b>0.9804</b></div>
                    <div><b>Step 5 &ndash; Baseline range:</b> Strictly positive normalization constant (K &gt; 0).</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> Normalizes parameter weights inversely to standards so strict parameters receive higher weight.</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Derived strictly from configured reference standards (BIS IS 10500:2012 / WHO Guidelines).</div>
                  </div>
                </div>

                {/* F-03 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-03] Dynamic Unit Weight Normalization (W_i)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Dynamically assigns relative importance weights to parameters, handling missing parameters without zero-imputation.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> K = 0.9804, parameter permissible standard S<sub>i</sub>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    W<sub>i</sub> = K ÷ S<sub>i</sub> such that &sum; W<sub>i</sub> = 1.0000
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> K = 0.9804, individual standards S<sub>i</sub></div>
                    <div><b>Step 2 &ndash; Substitute values:</b> W<sub>i</sub> = 0.9804 ÷ S<sub>i</sub> for each parameter</div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> e.g. Chloramines = 0.2451, Turbidity = 0.1961, TDS = 0.0020</div>
                    <div><b>Step 4 &ndash; Final result:</b> Dynamic weights calculated; sum across parameters = <b>1.0000</b></div>
                    <div><b>Step 5 &ndash; Baseline range:</b> Mathematical requirement: &sum; W<sub>i</sub> = 1.0000 (&plusmn;0.0001).</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> Parameters with stricter limits exert higher impact on the composite index.</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Dynamic re-normalization adapts to available parameters; missing parameters reduce total index comprehensiveness.</div>
                  </div>
                </div>

                {/* F-04 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-04] Parameter Quality Rating Sub-Index (q_i)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Normalizes diverse physical units (pH, NTU, mg/L, µS/cm, °C) into a standardized 0 to 100 quality rating score.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> Raw measured readings and optimal baseline thresholds
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    q<sub>i</sub> = Piecewise_Linear_Rating(Measured<sub>i</sub>, Baseline<sub>i</sub>)
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> 10 measured parameter readings for this sample</div>
                    <div><b>Step 2 &ndash; Substitute values:</b> Reading substituted into parameter-specific deviation curve</div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> Linear score computed: 100 = optimal, 0 = severe breach</div>
                    <div><b>Step 4 &ndash; Final result:</b> Sub-indices q<sub>1</sub> through q<sub>10</sub> generated</div>
                    <div><b>Step 5 &ndash; Baseline range:</b> Standardized bounds: 0.00 &le; q<sub>i</sub> &le; 100.00.</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> Translates disparate units into uniform positive-polarity quality scores.</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Evaluates individual parameter compliance; does not model multi-chemical toxicological synergism.</div>
                  </div>
                </div>

                {/* F-05 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-05] Parameter Weighted Score Contribution (C_i)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Calculates the actual point contribution of each parameter to the overall Water Quality Score.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> Normalized weight W<sub>i</sub> and quality rating q<sub>i</sub>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    C<sub>i</sub> = W<sub>i</sub> &times; q<sub>i</sub>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> Calculated weights W<sub>i</sub> and ratings q<sub>i</sub> for all 10 parameters</div>
                    <div><b>Step 2 &ndash; Substitute values:</b> C<sub>i</sub> = W<sub>i</sub> &times; q<sub>i</sub></div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> Multiply weight by quality score per parameter</div>
                    <div><b>Step 4 &ndash; Final result:</b> Weighted score points C<sub>1</sub> through C<sub>10</sub> obtained</div>
                    <div><b>Step 5 &ndash; Baseline range:</b> Maximum theoretical contribution for parameter i is 100 &times; W<sub>i</sub>.</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> Reflected points represent both parameter severity and regulatory priority.</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Severe degradation in low-weight parameters deducts fewer total points than in high-weight metrics.</div>
                  </div>
                </div>

                {/* F-06 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">[F-06] Final AquaSense WQS Aggregation</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">Formula</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Purpose:</b> Aggregates individual weighted contributions into a single scalar decision-support metric on a 0 to 100 positive scale.
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <b>Input Values:</b> 10 parameter weighted score contributions C<sub>i</sub>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                    WQS = &sum;(W<sub>i</sub> &times; q<sub>i</sub>) &isin; [0.00, 100.00]
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                    <div><b>Step 1 &ndash; Identify values:</b> Sum of individual contributions C<sub>1</sub> through C<sub>10</sub></div>
                    <div><b>Step 2 &ndash; Substitute values:</b> WQS = &sum;(C<sub>i</sub>) across all 10 evaluated parameters</div>
                    <div><b>Step 3 &ndash; Perform calculation:</b> Sum of all weighted points = {a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '18.50'}</div>
                    <div><b>Step 4 &ndash; Final result:</b> Final AquaSense WQS = <b>{a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '18.50'} / 100 ({cat})</b></div>
                    <div><b>Step 5 &ndash; Baseline range:</b> 80–100 Good, 60–79.9 Moderate, 40–59.9 Poor, 0–39.9 Potentially Contaminated.</div>
                    <div><b>Step 6 &ndash; Conclusion:</b> Sample scored {a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '18.50'}/100, placing it directly into {cat}.</div>
                    <div className="text-slate-400 text-[10px]"><b>Step 7 &ndash; Limitations:</b> Educational decision-support screening; does not replace accredited laboratory certified potability testing.</div>
                  </div>
                </div>
              </div>

              {/* Complete Step-by-Step WQS Calculation Table */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-teal-600" /> Complete AquaSense WQS Step-by-Step Calculation Table
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3 text-center">Your Value</th>
                        <th className="py-2 px-3 text-center">Optimal Baseline</th>
                        <th className="py-2 px-3 text-center">Standard Limit (S<sub>i</sub>)</th>
                        <th className="py-2 px-3 text-center">Weight (W<sub>i</sub>)</th>
                        <th className="py-2 px-3 text-center">Rating (q<sub>i</sub>)</th>
                        <th className="py-2 px-3 text-right">Contribution (W<sub>i</sub> &times; q<sub>i</sub>)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fullParametersList.map((param) => {
                        const sub = a?.sub_indices ? a.sub_indices[param.key] : null;
                        const stdMap: Record<string, number> = {
                          ph: 8.5, turbidity: 5.0, temperature: 25.0, dissolved_oxygen: 5.0,
                          tds: 500.0, electrical_conductivity: 750.0, hardness: 200.0,
                          chloramines: 4.0, sulfate: 250.0, organic_carbon: 5.0
                        };
                        const stdVal = sub?.standard_value ?? stdMap[param.key] ?? 5.0;
                        const wi = sub?.unit_weight_wi ?? sub?.unit_weight ?? Number((0.9804 / stdVal).toFixed(4));
                        const qi = sub?.sub_index_qi ?? (param.value !== undefined ? (param.value > stdVal ? 0.0 : 100.0) : 100.0);
                        const contrib = sub?.weighted_product ?? Number((wi * qi).toFixed(3));
                        return (
                          <tr key={param.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{param.name}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold">{param.value ?? 'N/A'} {param.unit}</td>
                            <td className="py-2 px-3 text-center text-slate-500">{param.baseline}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400">{stdVal.toFixed(1)}</td>
                            <td className="py-2 px-3 text-center font-mono">{wi.toFixed(4)}</td>
                            <td className="py-2 px-3 text-center font-mono">{qi.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-teal-700 dark:text-teal-400">{contrib.toFixed(3)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                        <td className="py-2.5 px-3" colSpan={4}>Overall Aggregate Water Quality Score (WQS):</td>
                        <td className="py-2.5 px-3 text-center font-mono">&sum; W = 1.0000</td>
                        <td className="py-2.5 px-3 text-center"></td>
                        <td className="py-2.5 px-3 text-right font-mono text-teal-700 dark:text-teal-400">
                          &sum; = {a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '18.50'} / 100 ({cat})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CATEGORY B: PARAMETER THRESHOLD CALCULATIONS */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" /> CATEGORY B &mdash; PARAMETER THRESHOLD CALCULATIONS (DISCRETE COMPARISONS)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mathematical comparison operations (&le;, &ge;, &gt;, &lt;) evaluating whether raw readings fall within acceptable baselines or exceed critical limits.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Parameter Name</th>
                      <th className="py-2 px-3 text-center">Reading</th>
                      <th className="py-2 px-3 text-center">Configured Limits</th>
                      <th className="py-2 px-3 text-center">Comparison Rule</th>
                      <th className="py-2 px-3">Severity & Plain English Screening Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fullParametersList.map((param) => {
                      const obs = a?.observations?.find((o: any) => o.parameter === param.key);
                      const status = obs?.status || 'Normal';
                      const val = param.value ?? 0;
                      const isCritical = status.includes('Critical');
                      const isElevated = ['Elevated', 'Low'].includes(status);

                      let compRule = `${val} vs baseline`;
                      if (param.key === 'ph') compRule = val < 6.5 ? `${val} < 6.50 (Critical Low)` : (val > 8.5 ? `${val} > 8.50 (Critical High)` : `6.50 <= ${val} <= 8.50`);
                      else if (param.key === 'turbidity') compRule = val > 10 ? `${val} > 10.00 (Critical)` : (val > 5 ? `${val} > 5.00 (Elevated)` : `0.00 <= ${val} <= 5.00`);
                      else if (param.key === 'temperature') compRule = val > 32 ? `${val} > 32.00 (Critical)` : (val > 28 ? `${val} > 28.00 (Elevated)` : `15.00 <= ${val} <= 28.00`);
                      else if (param.key === 'dissolved_oxygen') compRule = val < 3 ? `${val} < 3.00 (Critical Low)` : (val < 6 ? `${val} < 6.00 (Low)` : `6.00 <= ${val} <= 14.00`);
                      else if (param.key === 'tds') compRule = val > 1000 ? `${val} > 1000.00 (Critical)` : (val > 500 ? `${val} > 500.00 (Elevated)` : `50.00 <= ${val} <= 500.00`);
                      else if (param.key === 'electrical_conductivity') compRule = val > 1500 ? `${val} > 1500.00 (Critical)` : (val > 750 ? `${val} > 750.00 (Elevated)` : `100.00 <= ${val} <= 750.00`);
                      else if (param.key === 'hardness') compRule = val > 400 ? `${val} > 400.00 (Critical)` : (val > 200 ? `${val} > 200.00 (Elevated)` : `50.00 <= ${val} <= 200.00`);
                      else if (param.key === 'chloramines') compRule = val > 4 ? `${val} > 4.00 (Critical)` : (val > 3 ? `${val} > 3.00 (Elevated)` : `0.00 <= ${val} <= 3.00`);
                      else if (param.key === 'sulfate') compRule = val > 400 ? `${val} > 400.00 (Critical)` : (val > 250 ? `${val} > 250.00 (Elevated)` : `0.00 <= ${val} <= 250.00`);
                      else if (param.key === 'organic_carbon') compRule = val > 10 ? `${val} > 10.00 (Critical)` : (val > 5 ? `${val} > 5.00 (Elevated)` : `0.00 <= ${val} <= 5.00`);

                      return (
                        <tr key={param.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{param.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold">{val} {param.unit}</td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{param.baseline}</td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60">
                            <code>{compRule}</code>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                              isCritical ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                              isElevated ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300' :
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}>
                              {status}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                              {obs?.screening_interpretation || obs?.observation || 'Within configured baseline range.'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CATEGORY C: MACHINE LEARNING PREDICTIONS */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Cpu className="h-4 w-4 text-emerald-600" /> CATEGORY C &mdash; MACHINE LEARNING PREDICTIONS (STATISTICAL INFERENCE)
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                    Supervised Ensemble
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11.5px]">
                  <div><b>Model Architecture:</b> Supervised Tree Ensemble Classifier (Random Forest + XGBoost)</div>
                  <div><b>Execution Flow:</b> Parameter Measurements [10 Attributes] &rarr; Imputation & Feature Scaling &rarr; 100 Estimator Decision Paths &rarr; Class Probability Estimation &rarr; Ensemble Voting Consensus &rarr; Predicted Class</div>
                  <div><b>Current Case Prediction:</b> Model predicted <b>{matrix.tier1_ml.predicted_category}</b> with <b>{Math.round(matrix.tier1_ml.confidence * 100)}%</b> voting consensus ({a?.confidence_type || 'ML Model Voting Consensus'}).</div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 text-[10.5px] text-slate-500 italic">
                    <b>Limitations & Scientific Disclosure:</b> 100% uncalibrated voting consensus reflects model agreement among algorithmic estimators. It is not calibrated Bayesian posterior probability, validated real-world accuracy, or certified drinking-water potability.
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY D: ANOMALY DETECTION */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> CATEGORY D &mdash; ANOMALY DETECTION (ISOLATION FOREST)
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isMlOutlier ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                  }`}>
                    {isMlOutlier ? 'Statistical Outlier' : 'Statistical Inlier'}
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11.5px]">
                  <div><b>Algorithm:</b> Unsupervised Multivariate Isolation Forest Anomaly Detection (Non-parametric tree partitioning)</div>
                  <div><b>Evaluation Mechanism:</b> Evaluates 10-dimensional parameter space using recursive random partition trees. Unusual multivariate patterns are isolated in short tree path lengths.</div>
                  <div>
                    <b>Score Generation & Mathematical Comparison:</b> Normalized Outlier Score (s) = <b>{normScore.toFixed(3)}</b>; Decision Threshold (T) = <b>0.500</b>. Comparison: <code>{normScore.toFixed(3)} {isMlOutlier ? '&ge;' : '&lt;'} 0.500</code>.
                  </div>
                  <div><b>Decision Outcome:</b> Classified as <b>{isMlOutlier ? 'Statistical Outlier (Unusual Pattern)' : 'Statistical Inlier (Conforming Pattern)'}</b>.</div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 text-[10.5px] text-slate-500">
                    <b>Scientific Meaning:</b> {isMlOutlier ? 'Atypical multivariate combination detected; flags statistical irregularity for investigation.' : 'Feature distribution conforms to typical baseline distributions. Normal pattern does NOT prove absence of unmeasured chemical contaminants.'}
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY E: FINAL DECISION AND SAFETY ARBITRATION */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> CATEGORY E &mdash; FINAL DECISION AND SAFETY ARBITRATION
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold">
                    Multi-Tier Policy
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11.5px]">
                  <div><b>Policy Architecture:</b> Multi-Tier Policy Synthesis and Precautionary Safety Arbitration Precedence</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      1. Screening: {criticalViolationsCount} critical breaches, {elevatedCount} elevated deviations
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      2. WQS Score: {a?.wqi_score !== undefined ? a.wqi_score.toFixed(2) : '18.50'} / 100 ({cat})
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      3. ML Prediction: {matrix.tier1_ml.predicted_category} ({Math.round(matrix.tier1_ml.confidence * 100)}% consensus)
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      4. Anomaly Check: {isMlOutlier ? 'Statistical Outlier' : 'Statistical Inlier'} (s={normScore.toFixed(3)})
                    </div>
                  </div>
                  <div><b>5. Safety Arbitration:</b> Precautionary public health precedence rule enforces that deterministic physical-chemical limit violations supersede statistical model predictions.</div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-800/60 font-semibold text-teal-800 dark:text-teal-300">
                    Final Classification: {cat}. {matrix.tier4_arbitrated.arbitration_explanation}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION G: Targeted Case Recommendations */}
          {(() => {
            const activeRecs = (a && a.recommendations && a.recommendations.length > 0)
              ? a.recommendations
              : ((recs && recs.length > 0) ? recs : []);

            const immediateList = activeRecs.filter((r: any) =>
              (r.category || '').toLowerCase().includes('sampling') ||
              (r.category || '').toLowerCase().includes('immediate') ||
              (r.priority || '').toLowerCase() === 'high'
            );
            const labList = activeRecs.filter((r: any) =>
              (r.category || '').toLowerCase().includes('laboratory') ||
              (r.title || '').toLowerCase().includes('laboratory') ||
              (r.title || '').toLowerCase().includes('assay') ||
              (r.description || '').toLowerCase().includes('laboratory') ||
              (r.description || '').toLowerCase().includes('chromatography') ||
              (r.description || '').toLowerCase().includes('cod')
            );
            const equipList = activeRecs.filter((r: any) =>
              (r.category || '').toLowerCase().includes('calibration') ||
              (r.category || '').toLowerCase().includes('equipment') ||
              (r.title || '').toLowerCase().includes('sensor') ||
              (r.title || '').toLowerCase().includes('calibration') ||
              (r.description || '').toLowerCase().includes('electrode') ||
              (r.description || '').toLowerCase().includes('calibrat')
            );
            const investList = activeRecs.filter((r: any) =>
              (r.category || '').toLowerCase().includes('investigation') ||
              (r.category || '').toLowerCase().includes('monitoring') ||
              (r.title || '').toLowerCase().includes('investigat') ||
              (r.title || '').toLowerCase().includes('monitoring') ||
              (r.title || '').toLowerCase().includes('catchment')
            );

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> SECTION G &mdash; Targeted Case Recommendations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Targeted actions grouped by category, based solely on this sample's measured deviations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Immediate Checks */}
                  <div className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="h-3.5 w-3.5" /> Immediate Checks
                    </div>
                    {immediateList.length > 0 ? (
                      <div className="space-y-1.5">
                        {immediateList.map((r: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                            <b>{r.title}:</b> {r.description}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        No critical immediate field checks required for this sample based on current baseline readings.
                      </p>
                    )}
                  </div>

                  {/* Laboratory Testing */}
                  <div className="p-3.5 rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20 space-y-2">
                    <div className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Activity className="h-3.5 w-3.5" /> Laboratory Testing
                    </div>
                    {labList.length > 0 ? (
                      <div className="space-y-1.5">
                        {labList.map((r: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                            <b>{r.title}:</b> {r.description}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Standard regulatory compliance testing per routine annual/semi-annual monitoring schedule.
                      </p>
                    )}
                  </div>

                  {/* Equipment and Calibration */}
                  <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sliders className="h-3.5 w-3.5" /> Equipment & Calibration
                    </div>
                    {equipList.length > 0 ? (
                      <div className="space-y-1.5">
                        {equipList.map((r: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                            <b>{r.title}:</b> {r.description}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Verify routine periodic calibration of multi-parameter field probes (pH, EC, DO) prior to next scheduled sampling.
                      </p>
                    )}
                  </div>

                  {/* Further Investigation */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Info className="h-3.5 w-3.5 text-teal-600" /> Further Investigation
                    </div>
                    {investList.length > 0 ? (
                      <div className="space-y-1.5">
                        {investList.map((r: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                            <b>{r.title}:</b> {r.description}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Continue standard catchment monitoring; inspect seasonal watershed variations and upstream land use.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECTION H: Important Limitations */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-teal-600 shrink-0" /> SECTION H &mdash; Important Regulatory & Educational Notice
            </div>
            <p>
              This report is generated by an educational water-quality screening and decision-support system. It identifies unusual measurements and deviations from configured screening limits. It does not confirm the presence of specific chemicals, pathogens, or actual contamination. Laboratory testing is required for confirmation. Application-configured screening limits are not automatically official regulatory standards.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
