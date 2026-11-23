import React, { useEffect, useState } from 'react';
import { sampleService, dashboardService } from '../../services';
import { WaterSample, DashboardSummary } from '../../types';
import { QualityDistributionPie } from '../../components/charts/QualityDistributionPie';
import { CheckCircle2, AlertTriangle, Flame, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WaterQualityClassification: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, sampleRes] = await Promise.all([
          dashboardService.getSummary(),
          sampleService.list({ limit: 150 })
        ]);
        setSummary(sumRes);
        setSamples(sampleRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = summary?.kpis;
  const filtered = selectedCategory === 'All'
    ? samples
    : samples.filter(s => s.analysis?.predicted_category === selectedCategory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Water Quality Classification Engine
        </h1>
        <p className="text-xs text-slate-500">
          Four-tier classification based on machine learning ensemble (Random Forest / XGBoost) and deterministic WQI rules.
        </p>
      </div>

      {/* 4 Classification Tier Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1 */}
        <div
          onClick={() => setSelectedCategory('Good Quality')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Good Quality' ? 'ring-2 ring-emerald-500 shadow-md' : 'border-emerald-200 dark:border-emerald-900/60'
          } bg-emerald-50/50 dark:bg-emerald-950/20`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Good Quality</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.good_quality_count ?? 0} <span className="text-xs font-normal text-slate-500">samples</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            All measured physical and chemical parameters lie within optimal illustrative ranges. WQI &ge; 80.
          </p>
        </div>

        {/* Tier 2 */}
        <div
          onClick={() => setSelectedCategory('Moderate Quality')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Moderate Quality' ? 'ring-2 ring-amber-500 shadow-md' : 'border-amber-200 dark:border-amber-900/60'
          } bg-amber-50/50 dark:bg-amber-950/20`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-amber-800 dark:text-amber-300">Moderate Quality</span>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.moderate_quality_count ?? 0} <span className="text-xs font-normal text-slate-500">samples</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Minor parameter elevations (e.g. turbidity or TDS slightly elevated). Routine observation recommended.
          </p>
        </div>

        {/* Tier 3 */}
        <div
          onClick={() => setSelectedCategory('Poor Quality')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Poor Quality' ? 'ring-2 ring-orange-500 shadow-md' : 'border-orange-200 dark:border-orange-900/60'
          } bg-orange-50/50 dark:bg-orange-950/20`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-orange-800 dark:text-orange-300">Poor Quality</span>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.poor_quality_count ?? 0} <span className="text-xs font-normal text-slate-500">samples</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Noticable degradation in multiple parameters (e.g. low DO or acidic pH). Confirmatory re-sampling advised.
          </p>
        </div>

        {/* Tier 4 */}
        <div
          onClick={() => setSelectedCategory('Potentially Contaminated')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Potentially Contaminated' ? 'ring-2 ring-rose-500 shadow-md' : 'border-rose-200 dark:border-rose-900/60'
          } bg-rose-50/50 dark:bg-rose-950/20`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-rose-800 dark:text-rose-300">Potentially Contaminated</span>
            <Flame className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.potentially_contaminated_count ?? 0} <span className="text-xs font-normal text-slate-500">samples</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Critical threshold violations detected across multiple parameters. High-priority screening alert.
          </p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Classified Samples ({filtered.length})
          </div>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Reset to All Categories
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Sample ID</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Predicted Category</th>
                <th className="py-2.5 px-3">WQI Score</th>
                <th className="py-2.5 px-3">Model Confidence</th>
                <th className="py-2.5 px-3">Classification Model</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(s => {
                const a = s.analysis;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {s.sample_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {s.location_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {a?.predicted_category || 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-600">
                      {a?.wqi_score ? `${a.wqi_score}/100` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {a?.confidence_score ? `${Math.round(a.confidence_score * 100)}%` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {a?.model_used || 'Rules + Ensemble'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link to={`/samples/${s.sample_id}`} className="font-semibold text-teal-600 hover:underline">
                        Examine &rarr;
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
