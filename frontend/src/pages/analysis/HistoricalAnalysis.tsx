import React, { useEffect, useState } from 'react';
import { sampleService, dashboardService } from '../../services';
import { WaterSample } from '../../types';
import { ParameterTrendChart } from '../../components/charts/ParameterTrendChart';
import { History, Calendar, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HistoricalAnalysis: React.FC = () => {
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [activeParam, setActiveParam] = useState<'wqi' | 'ph' | 'dissolved_oxygen' | 'turbidity' | 'tds'>('wqi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sampleRes, trendRes] = await Promise.all([
          sampleService.list({ location: selectedLocation || undefined, limit: 100 }),
          dashboardService.getTrends()
        ]);
        setSamples(sampleRes);
        setTrends(trendRes.trends || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedLocation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Historical Water Quality Monitoring & Timeline
          </h1>
          <p className="text-xs text-slate-500">
            Audit historical measurements, evaluate longitudinal parameter degradation, and review past analysis decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Locations</option>
            <option value="Sample Lake A">Sample Lake A</option>
            <option value="Industrial Zone">Industrial Zone</option>
            <option value="River Source B">River Source B</option>
            <option value="Groundwater Zone">Groundwater Zone</option>
            <option value="Reservoir C">Reservoir C</option>
            <option value="Industrial Discharge Area">Industrial Discharge Area</option>
          </select>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Longitudinal Parameter Trend
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'wqi', label: 'Overall WQI' },
              { id: 'ph', label: 'pH' },
              { id: 'dissolved_oxygen', label: 'DO' },
              { id: 'turbidity', label: 'Turbidity' },
              { id: 'tds', label: 'TDS' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveParam(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  activeParam === tab.id ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ParameterTrendChart data={trends} parameter={activeParam} height={300} />
      </div>

      {/* Historical Sample Timeline List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Chronological Sample Archive
        </h2>

        <div className="space-y-3">
          {samples.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{s.sample_id}</span>
                  <span className="text-xs text-slate-500">&bull; {s.location_name}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {s.collection_date ? s.collection_date.split('T')[0] : 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  pH: {s.parameters?.ph} | Turbidity: {s.parameters?.turbidity} NTU | DO: {s.parameters?.dissolved_oxygen} mg/L | TDS: {s.parameters?.tds} mg/L
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {s.analysis?.predicted_category || 'Assessed'}
                </span>
                <Link
                  to={`/samples/${s.sample_id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
                >
                  Inspect <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
