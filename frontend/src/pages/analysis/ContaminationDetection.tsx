import React, { useEffect, useState } from 'react';
import { sampleService, alertService } from '../../services';
import { WaterSample, Alert } from '../../types';
import { Flame, ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContaminationDetection: React.FC = () => {
  const [contaminatedSamples, setContaminatedSamples] = useState<WaterSample[]>([]);
  const [highAlerts, setHighAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sampleRes, alertRes] = await Promise.all([
          sampleService.list({ category: 'Potentially Contaminated' }),
          alertService.list({ severity: 'High' })
        ]);
        setContaminatedSamples(sampleRes);
        setHighAlerts(alertRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white shadow-lg border border-rose-800/40 space-y-2">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
          <Flame className="h-4 w-4" /> Potential Contamination Screening Module
        </div>
        <h1 className="text-2xl font-black">
          Critical Screening Flags & High-Severity Alerts
        </h1>
        <p className="text-xs text-rose-200/80 max-w-2xl leading-relaxed">
          Samples identified below exhibit multiple concurrent critical parameter deviations (e.g., pH &lt; 5.0, dissolved oxygen &lt; 2.5 mg/L, TDS &gt; 1200 mg/L). 
          <i> Important Notice: This screening flags high anomaly probability and does not certify the presence of specific pathogens or industrial chemicals without certified laboratory assays.</i>
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Potentially Contaminated Samples</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{contaminatedSamples.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Samples requiring immediate field verification</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">High-Priority Alerts Active</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{highAlerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Triggered by extreme physical/chemical threshold exceedance</div>
        </div>
      </div>

      {/* Flagged Samples Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Flagged Potential Contamination Incidents</span>
          <span className="text-[11px] text-rose-600 font-semibold">{contaminatedSamples.length} Records</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {contaminatedSamples.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> No samples currently classified as Potentially Contaminated.
            </div>
          ) : (
            contaminatedSamples.map(s => {
              const p = s.parameters;
              return (
                <div key={s.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{s.sample_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        High Priority Flag
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Location: {s.location_name} &bull; Water Source: {s.water_source_name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 pt-1">
                      pH: <b className="text-rose-600">{p?.ph}</b> | DO: <b className="text-rose-600">{p?.dissolved_oxygen} mg/L</b> | Turbidity: <b className="text-rose-600">{p?.turbidity} NTU</b> | TDS: <b className="text-rose-600">{p?.tds} mg/L</b>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/samples/${s.sample_id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
                    >
                      Examine Sample & Alerts <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
