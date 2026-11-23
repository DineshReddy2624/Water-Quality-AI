import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleService } from '../../services';
import {
  Save, Sparkles, RotateCcw, AlertCircle, CheckCircle2,
  TestTube, ShieldCheck, HelpCircle
} from 'lucide-react';

// The 6 exact manual testing scenarios from user prompt Section 6
const TEST_SCENARIOS = [
  {
    id: 'WQ001',
    name: 'Scenario 1: Normal Water Sample',
    desc: 'Demonstrate normal baseline measurements.',
    source: 'Sample Lake A',
    location: 'Sample Lake A',
    lat: 37.7749,
    lon: -122.4194,
    data: { ph: 7.2, turbidity: 1.5, temperature: 25.0, dissolved_oxygen: 7.8, tds: 280.0, electrical_conductivity: 450.0, hardness: 120.0, chloramines: 2.1, sulfate: 180.0, organic_carbon: 3.2 }
  },
  {
    id: 'WQ002',
    name: 'Scenario 2: Acidic Water Sample',
    desc: 'Demonstrate acidic pH and elevated solids requiring attention.',
    source: 'Industrial Zone Canal',
    location: 'Industrial Zone',
    lat: 37.7833,
    lon: -122.4167,
    data: { ph: 5.2, turbidity: 8.5, temperature: 28.0, dissolved_oxygen: 4.0, tds: 650.0, electrical_conductivity: 950.0, hardness: 210.0, chloramines: 3.8, sulfate: 320.0, organic_carbon: 7.5 }
  },
  {
    id: 'WQ003',
    name: 'Scenario 3: High Turbidity Sample',
    desc: 'Demonstrate elevated turbidity detection (15.0 NTU).',
    source: 'River Source B Basin',
    location: 'River Source B',
    lat: 37.7650,
    lon: -122.4300,
    data: { ph: 7.1, turbidity: 15.0, temperature: 27.0, dissolved_oxygen: 6.2, tds: 420.0, electrical_conductivity: 600.0, hardness: 140.0, chloramines: 2.4, sulfate: 195.0, organic_carbon: 5.1 }
  },
  {
    id: 'WQ004',
    name: 'Scenario 4: High TDS Sample',
    desc: 'Demonstrate elevated dissolved solids (1200 mg/L) & EC (1800 µS/cm).',
    source: 'Groundwater Aquifer 4',
    location: 'Groundwater Zone',
    lat: 37.7900,
    lon: -122.4000,
    data: { ph: 7.5, turbidity: 2.0, temperature: 26.0, dissolved_oxygen: 6.8, tds: 1200.0, electrical_conductivity: 1800.0, hardness: 380.0, chloramines: 1.9, sulfate: 450.0, organic_carbon: 4.0 }
  },
  {
    id: 'WQ005',
    name: 'Scenario 5: Low Dissolved Oxygen Sample',
    desc: 'Demonstrate low dissolved oxygen detection (2.5 mg/L).',
    source: 'Reservoir C Intake',
    location: 'Reservoir C',
    lat: 37.7500,
    lon: -122.4500,
    data: { ph: 7.0, turbidity: 3.0, temperature: 30.0, dissolved_oxygen: 2.5, tds: 350.0, electrical_conductivity: 500.0, hardness: 130.0, chloramines: 1.5, sulfate: 160.0, organic_carbon: 6.8 }
  },
  {
    id: 'WQ006',
    name: 'Scenario 6: Multiple Abnormal Parameters',
    desc: 'Demonstrate multiple critical abnormal readings and high-priority alert.',
    source: 'Industrial Discharge Outfall',
    location: 'Industrial Discharge Area',
    lat: 37.7400,
    lon: -122.3900,
    data: { ph: 4.5, turbidity: 20.0, temperature: 35.0, dissolved_oxygen: 2.0, tds: 1500.0, electrical_conductivity: 2200.0, hardness: 490.0, chloramines: 5.2, sulfate: 600.0, organic_carbon: 14.5 }
  }
];

export const ManualSampleEntry: React.FC = () => {
  const navigate = useNavigate();
  const [sampleId, setSampleId] = useState('');
  const [waterSource, setWaterSource] = useState('Sample Lake A');
  const [locationName, setLocationName] = useState('Sample Lake A');
  const [latitude, setLatitude] = useState('37.7749');
  const [longitude, setLongitude] = useState('-122.4194');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

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

  const handleScenarioLoad = (scenario: typeof TEST_SCENARIOS[0]) => {
    setSampleId(scenario.id);
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
    setError(null);
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

    setSaving(true);
    try {
      const payload = {
        sample_id: sampleId.trim() || undefined,
        water_source_name: waterSource || 'Field Monitoring Station',
        location_name: locationName || 'Regional Catchment',
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        collection_date: collectionDate ? new Date(collectionDate).toISOString() : new Date().toISOString(),
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
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <TestTube className="h-4 w-4" /> Load Illustrative Test Scenarios (Prompt Section 6)
          </div>
          <span className="text-[11px] text-slate-500">Click to populate fields</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TEST_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleScenarioLoad(sc)}
              className="p-2 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:shadow-sm transition-all"
            >
              <div className="font-bold text-xs text-teal-700 dark:text-teal-300">{sc.id}</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">{sc.name.split(':')[1]}</div>
            </button>
          ))}
        </div>
      </div>

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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sample ID (Auto-generated if empty)
              </label>
              <input
                type="text"
                placeholder="e.g. WQ001"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (decimal degrees)
              </label>
              <input
                type="number"
                step="any"
                placeholder="37.7749"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (decimal degrees)
              </label>
              <input
                type="number"
                step="any"
                placeholder="-122.4194"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Collection Date & Time
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
