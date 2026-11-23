import React, { useEffect, useState } from 'react';
import { mlService } from '../../services';
import {
  BrainCircuit, Play, CheckCircle2, BarChart2,
  Cpu, Activity, RefreshCw, AlertCircle
} from 'lucide-react';

export const MLPipelinePage: React.FC = () => {
  const [metadata, setMetadata] = useState<any>(null);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchML = async () => {
    setLoading(true);
    try {
      const data = await mlService.getModels();
      setMetadata(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchML();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    setError(null);
    setTrainMessage(null);
    try {
      const res = await mlService.train();
      setTrainMessage(res.message);
      await fetchML();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Retraining failed.');
    } finally {
      setTraining(false);
    }
  };

  const models = metadata?.models || {};
  const rf = models.random_forest;
  const xgb = models.xgboost;
  const dt = models.decision_tree;
  const lr = models.logistic_regression;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Machine Learning Pipeline & Evaluation
          </h1>
          <p className="text-xs text-slate-500">
            Multi-model classification and unsupervised anomaly detection trained on water quality features.
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={training}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
        >
          <Play className={`h-4 w-4 ${training ? 'animate-spin' : ''}`} />
          {training ? 'Training Ensemble Pipeline...' : 'Retrain All ML Models'}
        </button>
      </div>

      {trainMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{trainMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Random Forest */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-teal-600">Random Forest</span>
            <Cpu className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {rf?.metrics ? `${Math.round(rf.metrics.accuracy * 100)}% Acc` : 'Trained'}
          </div>
          <div className="text-xs text-slate-500">
            F1-Macro: <b>{rf?.metrics?.f1_macro ?? 'N/A'}</b> &bull; 100 Estimators
          </div>
        </div>

        {/* XGBoost */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-cyan-600">XGBoost Classifier</span>
            <Activity className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {xgb?.metrics ? `${Math.round(xgb.metrics.accuracy * 100)}% Acc` : 'Trained'}
          </div>
          <div className="text-xs text-slate-500">
            F1-Macro: <b>{xgb?.metrics?.f1_macro ?? 'N/A'}</b> &bull; Gradient Boosted
          </div>
        </div>

        {/* Decision Tree */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600">Decision Tree</span>
            <BarChart2 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {dt?.metrics ? `${Math.round(dt.metrics.accuracy * 100)}% Acc` : 'Trained'}
          </div>
          <div className="text-xs text-slate-500">
            Interpretable baseline &bull; Max depth: 5
          </div>
        </div>

        {/* Isolation Forest */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-purple-600">Isolation Forest</span>
            <BrainCircuit className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            Anomaly Detector
          </div>
          <div className="text-xs text-slate-500">
            Unsupervised &bull; Contamination: 15%
          </div>
        </div>
      </div>

      {/* Feature Importance & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            Random Forest Feature Importance
          </h2>
          {rf?.feature_importance ? (
            <div className="space-y-3">
              {Object.entries(rf.feature_importance).map(([feat, score]: [string, any]) => (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{feat.replace('_', ' ')}</span>
                    <span className="font-mono text-slate-500">{(score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${score * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">Feature importance pending model training.</div>
          )}
        </div>

        {/* Evaluation Summary & Limitations Note */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            Evaluation Metrics & Data Limitations
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase text-slate-400">Total Dataset Samples</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{metadata?.total_samples || 32}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] uppercase text-slate-400">Train / Test Split</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">75% / 25%</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Scientific & Educational Disclaimer
            </div>
            <p className="leading-relaxed text-[11px]">
              Accuracy and F1 scores are calculated on held-out test splits of illustrative screening datasets.
              Model outputs represent decision-support classifications and must not be used as certification of potability
              or drinking water safety without laboratory chemical and microbiological assay confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
