import React, { useEffect, useState } from 'react';
import { sampleService, settingsService } from '../../services';
import { WaterSample } from '../../types';
import { Sparkles, Shield, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ParameterAnalysis: React.FC = () => {
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [thresholds, setThresholds] = useState<any>({});
  const [selectedParam, setSelectedParam] = useState<string>('ph');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sampleRes, threshRes] = await Promise.all([
          sampleService.list({ limit: 100 }),
          settingsService.getThresholds()
        ]);
        setSamples(sampleRes);
        setThresholds(threshRes.thresholds || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentThresh = thresholds[selectedParam] || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Parameter Screening & Compliance Thresholds
        </h1>
        <p className="text-xs text-slate-500">
          Inspect parameter deviations against configured screening ranges inspired by EPA/WHO baseline guidelines.
        </p>
      </div>

      {/* Parameter selector pills */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(thresholds).map((key) => {
          const item = thresholds[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedParam(key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedParam === key
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Selected Parameter Specification Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Parameter Profile</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {currentThresh.name} ({currentThresh.unit})
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 font-bold">
              Optimal: {currentThresh.optimal_min ?? 0} - {currentThresh.optimal_max ?? 'N/A'} {currentThresh.unit}
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 font-bold">
              Tolerable: {currentThresh.tolerable_min ?? 0} - {currentThresh.tolerable_max ?? 'N/A'} {currentThresh.unit}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          {currentThresh.description}
        </p>

        {currentThresh.high_concern_action && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300">
            <b>Elevated Level Advisory:</b> {currentThresh.high_concern_action}
          </div>
        )}
        {currentThresh.low_concern_action && (
          <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-300">
            <b>Depleted Level Advisory:</b> {currentThresh.low_concern_action}
          </div>
        )}
      </div>

      {/* Filtered Sample Table for Selected Parameter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500">
          Recent Readings for {currentThresh.name}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Sample ID</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Measured Value</th>
                <th className="py-2.5 px-3">Compliance Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {samples.map((s) => {
                const val = (s.parameters as any)?.[selectedParam];
                if (val === undefined || val === null) return null;

                const optMin = currentThresh.optimal_min;
                const optMax = currentThresh.optimal_max;
                const isNormal = (optMin === undefined || val >= optMin) && (optMax === undefined || val <= optMax);

                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {s.sample_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {s.location_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {val} {currentThresh.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isNormal
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isNormal ? 'Within Optimal Baseline' : 'Parameter Deviation'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link to={`/samples/${s.sample_id}`} className="font-semibold text-teal-600 hover:underline">
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
