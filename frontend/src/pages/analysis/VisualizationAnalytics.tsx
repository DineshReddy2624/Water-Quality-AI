import React, { useEffect, useState } from 'react';
import { sampleService, dashboardService } from '../../services';
import { ParameterTrendChart } from '../../components/charts/ParameterTrendChart';
import { ParameterComparisonBarChart } from '../../components/charts/ParameterComparisonBarChart';
import { QualityDistributionPie } from '../../components/charts/QualityDistributionPie';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

export const VisualizationAnalytics: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, trendRes, sampleRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getTrends(),
          sampleService.list({ limit: 100 })
        ]);
        setSummary(sumRes);
        setTrends(trendRes.trends || []);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Data Visualizations & Exploratory Analytics
        </h1>
        <p className="text-xs text-slate-500">
          Interactive charts and parameter correlation matrices across physical, dissolved solids, and electrochemical metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* pH Distribution Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">pH Level Chronology</h2>
          <p className="text-xs text-slate-500">Tracking acidification and alkaline spikes (optimal baseline 6.5 - 8.5)</p>
          <ParameterTrendChart data={trends} parameter="ph" height={260} />
        </div>

        {/* Turbidity Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Turbidity Analysis (NTU)</h2>
          <p className="text-xs text-slate-500">Cloudiness and suspended solids fluctuation across samples (&lt; 5 NTU optimal)</p>
          <ParameterTrendChart data={trends} parameter="turbidity" height={260} />
        </div>

        {/* Dissolved Oxygen Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Dissolved Oxygen Levels (mg/L)</h2>
          <p className="text-xs text-slate-500">Aerobic water health index (&ge; 6.0 mg/L healthy)</p>
          <ParameterTrendChart data={trends} parameter="dissolved_oxygen" height={260} />
        </div>

        {/* TDS & Electrical Conductivity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Total Dissolved Solids Variation</h2>
          <p className="text-xs text-slate-500">Total dissolved mineral load (&lt; 500 mg/L optimal)</p>
          <ParameterTrendChart data={trends} parameter="tds" height={260} />
        </div>
      </div>
    </div>
  );
};
