import React, { useEffect, useState } from 'react';
import { dashboardService, sampleService } from '../../services';
import { DashboardSummary, WaterSample } from '../../types';
import { ParameterTrendChart } from '../../components/charts/ParameterTrendChart';
import { ParameterComparisonBarChart } from '../../components/charts/ParameterComparisonBarChart';
import { QualityDistributionPie } from '../../components/charts/QualityDistributionPie';
import {
  Activity, Droplets, CheckCircle, AlertTriangle,
  Flame, Gauge, RefreshCw, Filter
} from 'lucide-react';

export const WaterQualityDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [activeParam, setActiveParam] = useState<'ph' | 'turbidity' | 'dissolved_oxygen' | 'tds' | 'electrical_conductivity' | 'temperature'>('ph');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, sampleRes, trendRes] = await Promise.all([
        dashboardService.getSummary(),
        sampleService.list({ limit: 100 }),
        dashboardService.getTrends()
      ]);
      setSummary(sumRes);
      setSamples(sampleRes);
      setTrends(trendRes.trends || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const avg = summary?.averages;
  const kpis = summary?.kpis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Water Quality Parameter Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Multi-dimensional chemical and physical parameter tracking across all monitoring catchments.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Network Average Parameter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Average pH</div>
          <div className="text-xl font-bold mt-1 text-teal-600 dark:text-teal-400">{avg?.ph ?? 7.2}</div>
          <div className="text-[10px] text-slate-400 mt-1">Optimal: 6.5 - 8.5</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avg Turbidity</div>
          <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{avg?.turbidity ?? 3.5} <span className="text-xs font-normal">NTU</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Optimal: &lt; 5.0 NTU</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avg Dissolved O2</div>
          <div className="text-xl font-bold mt-1 text-sky-600 dark:text-sky-400">{avg?.dissolved_oxygen ?? 6.8} <span className="text-xs font-normal">mg/L</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Optimal: &ge; 6.0 mg/L</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avg TDS</div>
          <div className="text-xl font-bold mt-1 text-purple-600 dark:text-purple-400">{avg?.tds ?? 420} <span className="text-xs font-normal">mg/L</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Optimal: &lt; 500 mg/L</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avg Conductivity</div>
          <div className="text-xl font-bold mt-1 text-pink-600 dark:text-pink-400">{avg?.electrical_conductivity ?? 610} <span className="text-xs font-normal">µS/cm</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Optimal: &lt; 750 µS/cm</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Avg Temperature</div>
          <div className="text-xl font-bold mt-1 text-orange-600 dark:text-orange-400">{avg?.temperature ?? 23.5} <span className="text-xs font-normal">°C</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Normal: 15 - 28 °C</div>
        </div>
      </div>

      {/* Interactive Parameter Trend Viewer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Parameter Trend Chronology
            </h2>
            <p className="text-xs text-slate-500">
              Select a parameter to view time-series distribution across samples
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ph', label: 'pH Level' },
              { id: 'turbidity', label: 'Turbidity' },
              { id: 'dissolved_oxygen', label: 'Dissolved O2' },
              { id: 'tds', label: 'TDS' },
              { id: 'electrical_conductivity', label: 'Conductivity' },
              { id: 'temperature', label: 'Temperature' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveParam(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeParam === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ParameterTrendChart data={trends} parameter={activeParam} height={320} />
      </div>

      {/* Cross-Station Parameter Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Multi-Sample Parameter Comparison
          </h2>
          <p className="text-xs text-slate-500">
            Side-by-side comparison of core physical and dissolved solids metrics across stations
          </p>
          <ParameterComparisonBarChart
            samples={samples.map(s => ({
              sample_id: s.sample_id,
              location_name: s.location_name,
              ph: s.parameters?.ph || 7.0,
              turbidity: s.parameters?.turbidity || 0,
              dissolved_oxygen: s.parameters?.dissolved_oxygen || 0,
              tds: s.parameters?.tds || 0,
              electrical_conductivity: s.parameters?.electrical_conductivity || 0
            }))}
            height={280}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quality Tiers Distribution
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown of total {kpis?.total_samples ?? 0} assessed samples
            </p>
          </div>
          <QualityDistributionPie
            data={{
              good: kpis?.good_quality_count ?? 0,
              moderate: kpis?.moderate_quality_count ?? 0,
              poor: kpis?.poor_quality_count ?? 0,
              contaminated: kpis?.potentially_contaminated_count ?? 0
            }}
            height={260}
          />
        </div>
      </div>
    </div>
  );
};
