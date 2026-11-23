import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, MapPin, CheckCircle2, AlertTriangle,
  Flame, ShieldAlert, Plus, Upload, FileDown, ArrowUpRight,
  TrendingUp, Activity
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { ParameterTrendChart } from '../../components/charts/ParameterTrendChart';
import { QualityDistributionPie } from '../../components/charts/QualityDistributionPie';
import { WaterQualityMap } from '../../components/maps/WaterQualityMap';
import { dashboardService, locationService, sampleService } from '../../services';
import { DashboardSummary, WaterLocation, WaterSample } from '../../types';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [locations, setLocations] = useState<WaterLocation[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [recentSamples, setRecentSamples] = useState<WaterSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, locRes, trendRes, samplesRes] = await Promise.all([
          dashboardService.getSummary(),
          locationService.list(),
          dashboardService.getTrends(),
          sampleService.list({ limit: 6 })
        ]);
        setSummary(sumRes);
        setLocations(locRes);
        setTrends(trendRes.trends || []);
        setRecentSamples(samplesRes);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = summary?.kpis;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-navy-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-teal-800/40">
        <div>
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Water Quality Intelligence & Contamination Screening
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Monitoring Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time screening of physical & chemical parameters, multi-model ML anomaly scoring, and automated compliance risk advisories.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/samples/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors shadow-md shadow-teal-500/20"
          >
            <Plus className="h-4 w-4" /> Enter Sample
          </Link>
          <Link
            to="/datasets/upload"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/20"
          >
            <Upload className="h-4 w-4" /> Upload Dataset
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/20"
          >
            <FileDown className="h-4 w-4" /> Download Report
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Water Samples"
          value={kpis?.total_samples ?? 0}
          subtitle="Monitored in database"
          icon={Droplets}
          color="teal"
        />
        <StatCard
          title="Monitoring Locations"
          value={kpis?.total_locations ?? 0}
          subtitle="Active water bodies"
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Good Quality Samples"
          value={kpis?.good_quality_count ?? 0}
          subtitle="Optimal baseline metrics"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Moderate Quality"
          value={kpis?.moderate_quality_count ?? 0}
          subtitle="Minor parameter deviations"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Poor Quality Samples"
          value={kpis?.poor_quality_count ?? 0}
          subtitle="Review advisory active"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Potentially Contaminated"
          value={kpis?.potentially_contaminated_count ?? 0}
          subtitle="Immediate screening flag"
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Total Anomalies Detected"
          value={kpis?.total_anomalies ?? 0}
          subtitle="Isolation Forest & Thresholds"
          icon={ShieldAlert}
          color="purple"
        />
        <StatCard
          title="Active Alerts"
          value={kpis?.active_alerts ?? 0}
          subtitle="Require action / review"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Main Visuals: Quality Trends & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Water Quality Index (WQI) Trends
              </h2>
              <p className="text-xs text-slate-500">
                Composite screening index (0-100) across recent monitored collection dates
              </p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
              Explore Analytics <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ParameterTrendChart data={trends} parameter="wqi" height={280} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quality Classification Share
            </h2>
            <p className="text-xs text-slate-500">
              Categorical proportion across all database samples
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

      {/* Map & Recent Samples Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Map Preview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Monitoring Stations Map
              </h2>
              <p className="text-xs text-slate-500">
                Geospatial distribution of water sampling locations and status
              </p>
            </div>
            <Link to="/map" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
              Full Map View <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <WaterQualityMap locations={locations} samples={recentSamples} height="320px" />
        </div>

        {/* Recent Water Samples */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Sample Analyses
              </h2>
              <p className="text-xs text-slate-500">
                Latest field measurements and AI classification results
              </p>
            </div>
            <Link to="/samples" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
              View All Samples <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Sample ID</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">pH / DO / Turb</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentSamples.map((s) => {
                  const cat = s.analysis?.predicted_category || 'Pending';
                  const badgeColor =
                    cat === 'Good Quality' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                    cat === 'Moderate Quality' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                    cat === 'Poor Quality' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
                    cat === 'Potentially Contaminated' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {s.sample_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                        {s.location_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {s.parameters ? `${s.parameters.ph} | ${s.parameters.dissolved_oxygen} | ${s.parameters.turbidity}` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                          {cat}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/samples/${s.sample_id}`}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                        >
                          Details &rarr;
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
    </div>
  );
};
