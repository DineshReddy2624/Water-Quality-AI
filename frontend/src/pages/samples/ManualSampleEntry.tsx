import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleService } from '../../services';
import {
  Save, Sparkles, RotateCcw, AlertCircle, CheckCircle2,
  TestTube, ShieldCheck, HelpCircle, RefreshCw, AlertTriangle
} from 'lucide-react';

// The 6 exact manual testing scenarios calibrated with India geospatial coordinates
const TEST_SCENARIOS = [
  {
    id: 'WQ001',
    name: 'Scenario 1: Normal Water Sample',
    desc: 'Demonstrate normal baseline measurements.',
    source: 'Sample Lake A',
    location: 'Sample Lake A',
    lat: 12.9784,
    lon: 77.6200,
    data: { ph: 7.2, turbidity: 1.5, temperature: 25.0, dissolved_oxygen: 7.8, tds: 280.0, electrical_conductivity: 450.0, hardness: 120.0, chloramines: 2.1, sulfate: 180.0, organic_carbon: 3.2 }
  },
  {
    id: 'WQ002',
    name: 'Scenario 2: Acidic Water Sample',
    desc: 'Demonstrate acidic pH and elevated solids requiring attention.',
    source: 'Industrial Zone Canal',
    location: 'Industrial Zone',
    lat: 13.0310,
    lon: 77.5180,
    data: { ph: 5.2, turbidity: 8.5, temperature: 28.0, dissolved_oxygen: 4.0, tds: 650.0, electrical_conductivity: 950.0, hardness: 210.0, chloramines: 3.8, sulfate: 320.0, organic_carbon: 7.5 }
  },
  {
    id: 'WQ003',
    name: 'Scenario 3: High Turbidity Sample',
    desc: 'Demonstrate elevated turbidity detection (15.0 NTU).',
    source: 'River Source B Basin',
    location: 'River Source B',
    lat: 12.5180,
    lon: 77.4420,
    data: { ph: 7.1, turbidity: 15.0, temperature: 27.0, dissolved_oxygen: 6.2, tds: 420.0, electrical_conductivity: 600.0, hardness: 140.0, chloramines: 2.4, sulfate: 195.0, organic_carbon: 5.1 }
  },
  {
    id: 'WQ004',
    name: 'Scenario 4: High TDS Sample',
    desc: 'Demonstrate elevated dissolved solids (1200 mg/L) & EC (1800 µS/cm).',
    source: 'Groundwater Aquifer 4',
    location: 'Groundwater Zone',
    lat: 12.9250,
    lon: 77.5930,
    data: { ph: 7.5, turbidity: 2.0, temperature: 26.0, dissolved_oxygen: 6.8, tds: 1200.0, electrical_conductivity: 1800.0, hardness: 380.0, chloramines: 1.9, sulfate: 450.0, organic_carbon: 4.0 }
  },
  {
    id: 'WQ005',
    name: 'Scenario 5: Low Dissolved Oxygen Sample',
    desc: 'Demonstrate low dissolved oxygen detection (2.5 mg/L).',
    source: 'Reservoir C Intake',
    location: 'Reservoir C',
    lat: 12.8720,
    lon: 77.3390,
    data: { ph: 7.0, turbidity: 3.0, temperature: 30.0, dissolved_oxygen: 2.5, tds: 350.0, electrical_conductivity: 500.0, hardness: 130.0, chloramines: 1.5, sulfate: 160.0, organic_carbon: 6.8 }
  },
  {
    id: 'WQ006',
    name: 'Scenario 6: Multiple Abnormal Parameters',
    desc: 'Demonstrate multiple critical abnormal readings and high-priority alert.',
    source: 'Industrial Discharge Outfall',
    location: 'Industrial Discharge Area',
    lat: 12.9100,
    lon: 77.4950,
    data: { ph: 4.5, turbidity: 20.0, temperature: 35.0, dissolved_oxygen: 2.0, tds: 1500.0, electrical_conductivity: 2200.0, hardness: 490.0, chloramines: 5.2, sulfate: 600.0, organic_carbon: 14.5 }
  }
];

export const ManualSampleEntry: React.FC = () => {
  const navigate = useNavigate();
  const getInitialLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [sampleId, setSampleId] = useState('');
  const [nextSuggestedId, setNextSuggestedId] = useState('');
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [waterSource, setWaterSource] = useState('Sample Lake A');
  const [locationName, setLocationName] = useState('Sample Lake A');
  const [latitude, setLatitude] = useState('12.9784');
  const [longitude, setLongitude] = useState('77.6200');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [collectionDate, setCollectionDate] = useState(getInitialLocalDateTime());
  const [notes, setNotes] = useState('');

  // Fetch next available sample ID from backend
  const refreshNextId = async () => {
    setLoadingNextId(true);
    try {
      const res = await sampleService.getNextId();
      if (res?.next_sample_id) {
        setNextSuggestedId(res.next_sample_id);
        return res.next_sample_id;
      }
    } catch {
      // Backend auto-generates if empty
    } finally {
      setLoadingNextId(false);
    }
    return '';
  };

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    refreshNextId();
  }, []);

  // Debounced duplicate ID checking
  useEffect(() => {
    if (!sampleId.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sampleService.checkId(sampleId.trim());
        if (!res.is_available) {
          setDuplicateWarning(`Sample ID '${res.sample_id}' is already registered in the database. Please provide a unique ID or leave empty to auto-generate.`);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        setDuplicateWarning(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [sampleId]);

  // Core parameters
  const [ph, setPh] = useState<number | string>(7.2);
  const [turbidity, setTurbidity] = useState<number | string>(1.5);
  const [temperature, setTemperature] = useState<number | string>(25.0);
  const [dissolvedOxygen, setDissolvedOxygen] = useState<number | string>(7.8);
  const [tds, setTds] = useState<number | string>(280.0);
  const [electricalConductivity, setElectricalConductivity] = useState<number | string>(450.0);

  // Optional parameters
  const [hardness, setHardness] = useState<number | string>(120.0);
  const [chloramines, setChloramines] = useState<number | string>(2.1);
  const [sulfate, setSulfate] = useState<number | string>(180.0);
  const [organicCarbon, setOrganicCarbon] = useState<number | string>(3.2);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioNotification, setScenarioNotification] = useState<string | null>(null);

  const handleScenarioLoad = async (scenario: typeof TEST_SCENARIOS[0]) => {
    // Immediately clear error and duplicate warning
    setError(null);
    setDuplicateWarning(null);

    setWaterSource(scenario.source);
    setLocationName(scenario.location);
    setLatitude(scenario.lat.toString());
    setLongitude(scenario.lon.toString());
    setPh(scenario.data.ph);
    setTurbidity(scenario.data.turbidity);
    setTemperature(scenario.data.temperature);
    setDissolvedOxygen(scenario.data.dissolved_oxygen);
    setTds(scenario.data.tds);
    setElectricalConductivity(scenario.data.electrical_conductivity);
    setHardness(scenario.data.hardness);
    setChloramines(scenario.data.chloramines);
    setSulfate(scenario.data.sulfate);
    setOrganicCarbon(scenario.data.organic_carbon);
    setNotes(`Test Run for ${scenario.name}`);

    // Dynamically assign a fresh, unique sample ID instead of duplicate scenario ID
    try {
      const res = await sampleService.getNextId();
      if (res?.next_sample_id) {
        setSampleId(res.next_sample_id);
        setNextSuggestedId(res.next_sample_id);
        setScenarioNotification(`Loaded ${scenario.name.split(':')[1]?.trim() || scenario.name} → Generated new unique Sample ID: ${res.next_sample_id}`);
      } else {
        const fallback = nextSuggestedId || `WQ${String(Date.now()).slice(-3)}`;
        setSampleId(fallback);
        setScenarioNotification(`Loaded ${scenario.name.split(':')[1]?.trim() || scenario.name} → Assigned Sample ID: ${fallback}`);
      }
    } catch {
      const fallback = nextSuggestedId || `WQ${String(Date.now()).slice(-3)}`;
      setSampleId(fallback);
      setScenarioNotification(`Loaded ${scenario.name.split(':')[1]?.trim() || scenario.name} → Assigned Sample ID: ${fallback}`);
    }
  };

  const handleClear = () => {
    setSampleId('');
    setWaterSource('');
    setLocationName('');
    setLatitude('');
    setLongitude('');
    setPh('');
    setTurbidity('');
    setTemperature('');
    setDissolvedOxygen('');
    setTds('');
    setElectricalConductivity('');
    setHardness('');
    setChloramines('');
    setSulfate('');
    setOrganicCarbon('');
    setNotes('');
    setError(null);
  };

  const handleSubmit = async (autoAnalyze = true) => {
    setError(null);

    // Validation
    const phNum = parseFloat(String(ph));
    if (isNaN(phNum) || phNum < 0 || phNum > 14) {
      setError('pH must be a valid number between 0 and 14.');
      return;
    }
    const turbNum = parseFloat(String(turbidity));
    if (isNaN(turbNum) || turbNum < 0) {
      setError('Turbidity must be a positive number.');
      return;
    }
    const doNum = parseFloat(String(dissolvedOxygen));
    if (isNaN(doNum) || doNum < 0) {
      setError('Dissolved oxygen must be a positive number.');
      return;
    }
    const tdsNum = parseFloat(String(tds));
    if (isNaN(tdsNum) || tdsNum < 0) {
      setError('TDS must be a positive number.');
      return;
    }
    const ecNum = parseFloat(String(electricalConductivity));
    if (isNaN(ecNum) || ecNum < 0) {
      setError('Electrical conductivity must be a positive number.');
      return;
    }

    // India Geographical Bounding Box Validation
    if (latitude) {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < 8.0 || latNum > 37.0) {
        setError('Latitude must be within India territorial bounds (8.0° N to 37.0° N).');
        return;
      }
    }
    if (longitude) {
      const lonNum = parseFloat(longitude);
      if (isNaN(lonNum) || lonNum < 68.0 || lonNum > 97.0) {
        setError('Longitude must be within India territorial bounds (68.0° E to 97.0° E).');
        return;
      }
    }

    if (duplicateWarning) {
      setError(duplicateWarning);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sample_id: sampleId.trim() || undefined,
        water_source_name: waterSource || 'Field Monitoring Station',
        location_name: locationName || 'Regional Catchment',
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        timezone: timezone || 'Asia/Kolkata',
        collection_date: collectionDate || undefined,
        notes: notes || undefined,
        parameters: {
          ph: phNum,
          turbidity: turbNum,
          temperature: parseFloat(String(temperature)) || 25.0,
          dissolved_oxygen: doNum,
          tds: tdsNum,
          electrical_conductivity: ecNum,
          hardness: hardness !== '' ? parseFloat(String(hardness)) : undefined,
          chloramines: chloramines !== '' ? parseFloat(String(chloramines)) : undefined,
          sulfate: sulfate !== '' ? parseFloat(String(sulfate)) : undefined,
          organic_carbon: organicCarbon !== '' ? parseFloat(String(organicCarbon)) : undefined,
        }
      };

      const result = await sampleService.create(payload, autoAnalyze);
      navigate(`/samples/${result.sample_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save water sample.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manual Water Sample Entry
        </h1>
        <p className="text-xs text-slate-500">
          Enter field telemetry and laboratory assay measurements. Test directly with preset verification scenarios.
        </p>
      </div>

      {/* Quick Test Scenarios Bar */}
      <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-200/60 dark:border-teal-900/60 rounded-xl p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <TestTube className="h-4 w-4" /> Load Illustrative Test Scenarios (Prompt Section 6)
          </div>
          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
            Click any scenario to load values + make new unique Sample ID (Auto-generated if empty)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TEST_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleScenarioLoad(sc)}
              className="p-2.5 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:shadow-md transition-all group cursor-pointer"
              title={`Click to load ${sc.name} and make a new unique Sample ID`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-teal-700 dark:text-teal-300">Scenario {idx + 1}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-mono font-semibold">
                  {sc.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate mt-1">
                {sc.name.split(':')[1]?.trim() || sc.name}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Makes New Sample ID</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {scenarioNotification && (
        <div className="p-3 rounded-xl bg-teal-50/90 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200 text-xs flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="font-medium">{scenarioNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setScenarioNotification(null)}
            className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-6">
        {/* Section 1: Identification & Location */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            1. Sample Identification & Geo-Coordinates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sample ID (Auto-generated if empty)
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const id = await refreshNextId();
                    if (id) setSampleId(id);
                  }}
                  disabled={loadingNextId}
                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
                  title="Generate next sequential unique Sample ID"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {loadingNextId ? 'Generating...' : 'New ID'}
                </button>
              </div>
              <input
                type="text"
                placeholder={nextSuggestedId ? `Auto-generated e.g. ${nextSuggestedId}` : "Auto-generated if empty"}
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {sampleId ? 'Custom or freshly generated ID' : `Auto-generated sequential ID upon save ${nextSuggestedId ? `(${nextSuggestedId})` : ''}`}
              </span>
              {duplicateWarning && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-start gap-1 mt-1.5 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Water Source Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sample Lake A"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Intake Basin 1"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (decimal degrees, India)
              </label>
              <input
                type="number"
                step="any"
                placeholder="12.9784"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">India range: 8.0° N to 37.0° N</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (decimal degrees, India)
              </label>
              <input
                type="number"
                step="any"
                placeholder="77.6200"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">India range: 68.0° E to 97.0° E</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sampling Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Collection Date & Time (Local)
              </label>
              <input
                type="datetime-local"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Core Physical & Chemical Parameters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            2. Core Water Quality Parameters (Required for Classification)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                pH Level (0 - 14) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="14"
                required
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Optimal: 6.5 - 8.5</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Turbidity (NTU) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={turbidity}
                onChange={(e) => setTurbidity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Optimal: &lt; 5.0 NTU</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Temperature (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Normal: 15 - 28 °C</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dissolved Oxygen (mg/L) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={dissolvedOxygen}
                onChange={(e) => setDissolvedOxygen(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Optimal: &ge; 6.0 mg/L</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Dissolved Solids (mg/L) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={tds}
                onChange={(e) => setTds(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Optimal: &lt; 500 mg/L</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Electrical Conductivity (µS/cm) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={electricalConductivity}
                onChange={(e) => setElectricalConductivity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Optimal: &lt; 750 µS/cm</span>
            </div>
          </div>
        </div>

        {/* Section 3: Optional Chemical & Mineral Parameters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            3. Secondary Chemical Parameters (Optional)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hardness (mg/L)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={hardness}
                onChange={(e) => setHardness(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chloramines (mg/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={chloramines}
                onChange={(e) => setChloramines(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sulfate (mg/L)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={sulfate}
                onChange={(e) => setSulfate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Organic Carbon (mg/L)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={organicCarbon}
                onChange={(e) => setOrganicCarbon(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Field Notes & Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Visual observations, weather condition, nearby runoff..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Clear Form
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Sample Only
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {saving ? 'Analyzing & Saving...' : 'Save & Run AI Analysis'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
