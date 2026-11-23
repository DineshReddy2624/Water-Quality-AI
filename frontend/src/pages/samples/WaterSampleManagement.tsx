import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sampleService, reportService } from '../../services';
import { WaterSample } from '../../types';
import {
  FileSpreadsheet, Plus, Search, Filter, RefreshCw,
  FileDown, Trash2, Eye, ShieldAlert, CheckCircle2,
  AlertTriangle, Flame
} from 'lucide-react';

export const WaterSampleManagement: React.FC = () => {
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const data = await sampleService.list({
        search: search.trim() || undefined,
        location: locationFilter.trim() || undefined,
        category: categoryFilter.trim() || undefined,
        limit: 200
      });
      setSamples(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [locationFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSamples();
  };

  const handleDelete = async (sampleId: string) => {
    if (window.confirm(`Are you sure you want to delete water sample ${sampleId}?`)) {
      try {
        await sampleService.delete(sampleId);
        setSamples(prev => prev.filter(s => s.sample_id !== sampleId));
      } catch (err) {
        alert('Failed to delete sample.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Water Sample Records
          </h1>
          <p className="text-xs text-slate-500">
            View, filter, analyze, and export historical sample batches from across all monitoring stations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={reportService.getDatasetExcelUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-sm"
          >
            <FileDown className="h-4 w-4" /> Export Excel
          </a>
          <Link
            to="/samples/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20"
          >
            <Plus className="h-4 w-4" /> New Sample
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Sample ID, location, or water source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Good Quality">Good Quality</option>
            <option value="Moderate Quality">Moderate Quality</option>
            <option value="Poor Quality">Poor Quality</option>
            <option value="Potentially Contaminated">Potentially Contaminated</option>
          </select>

          <button
            onClick={fetchSamples}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Samples Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Sample ID</th>
                <th className="py-3 px-4">Location & Source</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">pH</th>
                <th className="py-3 px-4">Turbidity</th>
                <th className="py-3 px-4">DO</th>
                <th className="py-3 px-4">TDS</th>
                <th className="py-3 px-4">EC</th>
                <th className="py-3 px-4">Quality Category</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {loading ? 'Loading samples...' : 'No water quality samples found matching current criteria.'}
                  </td>
                </tr>
              ) : (
                samples.map((s) => {
                  const p = s.parameters;
                  const cat = s.analysis?.predicted_category || 'Pending';
                  const badgeColor =
                    cat === 'Good Quality' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                    cat === 'Moderate Quality' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                    cat === 'Poor Quality' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <Link to={`/samples/${s.sample_id}`} className="hover:underline text-teal-600 dark:text-teal-400">
                          {s.sample_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{s.location_name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.water_source_name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {s.collection_date ? s.collection_date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono">{p ? p.ph.toFixed(2) : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{p ? `${p.turbidity.toFixed(1)} NTU` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{p ? `${p.dissolved_oxygen.toFixed(1)} mg/L` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{p ? `${p.tds.toFixed(0)} mg/L` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{p ? `${p.electrical_conductivity.toFixed(0)}` : 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                          {cat}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/samples/${s.sample_id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Analysis Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <a
                            href={reportService.getSamplePdfUrl(s.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Download PDF Report"
                          >
                            <FileDown className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(s.sample_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Delete Sample"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
