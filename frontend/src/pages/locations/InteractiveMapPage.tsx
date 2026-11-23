import React, { useEffect, useState } from 'react';
import { locationService, sampleService } from '../../services';
import { WaterLocation, WaterSample } from '../../types';
import { WaterQualityMap } from '../../components/maps/WaterQualityMap';
import { MapPin, Compass, RefreshCw, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InteractiveMapPage: React.FC = () => {
  const [locations, setLocations] = useState<WaterLocation[]>([]);
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [locRes, sampleRes] = await Promise.all([
          locationService.list(),
          sampleService.list({ limit: 100 })
        ]);
        setLocations(locRes);
        setSamples(sampleRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredSamples = selectedLoc
    ? samples.filter(s => s.location_name === selectedLoc || s.water_source_name === selectedLoc)
    : samples;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Geospatial Water Quality Monitoring Map
          </h1>
          <p className="text-xs text-slate-500">
            Interactive OpenStreetMap layer displaying monitoring stations, sample volumes, and repeated abnormal flags.
          </p>
        </div>
        {selectedLoc && (
          <button
            onClick={() => setSelectedLoc(null)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200"
          >
            Clear Selected: {selectedLoc} &times;
          </button>
        )}
      </div>

      {/* Main Map */}
      <WaterQualityMap
        locations={locations}
        samples={samples}
        selectedLocation={selectedLoc}
        onSelectLocation={(name) => setSelectedLoc(name)}
        height="500px"
      />

      {/* Location Station Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            onClick={() => setSelectedLoc(loc.location_name)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedLoc === loc.location_name
                ? 'ring-2 ring-teal-500 bg-teal-50/30 dark:bg-teal-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-600" /> {loc.name}
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {loc.water_type}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{loc.location_name}</div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Samples: <b>{loc.sample_count}</b></span>
              <span className={loc.abnormal_count > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                {loc.abnormal_count} Anomalies
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
